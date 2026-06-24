import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/hooks/useAuth';
import { useHabits, useCreateHabit } from '@/hooks/useHabits';
import type { ReactNode } from 'react';

const mockSession = vi.hoisted(() => ({ user: { id: 'test-user-123' } }));

vi.mock('@/lib/supabase', () => {
  const mockSelect = vi.fn();
  const mockEq = vi.fn();
  const mockOrder = vi.fn();
  const mockInsert = vi.fn();
  const mockSingle = vi.fn();

  const chainable = {
    select: mockSelect,
    eq: mockEq,
    order: mockOrder,
    insert: mockInsert,
    single: mockSingle,
  };

  const mockUnsubscribe = vi.fn();
  const mockOnAuthStateChange = vi.fn(() => ({ data: { subscription: { unsubscribe: mockUnsubscribe } } }));

  mockSelect.mockReturnValue(chainable);
  mockEq.mockReturnValue(chainable);
  mockOrder.mockResolvedValue({ data: [], error: null });
  mockInsert.mockReturnValue(chainable);
  mockSingle.mockResolvedValue({ data: { id: 'new-habit-1', name: 'Test Habit' }, error: null });

  return {
    supabase: {
      from: vi.fn(() => chainable),
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: mockSession } }),
        signInAnonymously: vi.fn().mockResolvedValue({ data: { session: mockSession }, error: null }),
        onAuthStateChange: mockOnAuthStateChange,
      },
    },
  };
});

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    );
  };
}

describe('useHabits', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch habits after auth resolves', async () => {
    const { result } = renderHook(() => useHabits(), { wrapper: createWrapper() });

    expect(result.current.data).toBeUndefined();

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
  });
});

describe('useCreateHabit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a habit and return it', async () => {
    const { result } = renderHook(() => useCreateHabit(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.mutate).toBeDefined();
    });

    const supabase = (await import('@/lib/supabase')).supabase;
    const mockFrom = supabase.from as ReturnType<typeof vi.fn>;

    result.current.mutate({
      name: 'Morning Run',
      description: 'Run 5km',
      category: 'fitness',
      frequency_type: 'daily',
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockFrom).toHaveBeenCalledWith('habits');
    expect(result.current.data).toEqual({ id: 'new-habit-1', name: 'Test Habit' });
  });

  it('should throw if no userId', async () => {
    const { supabase } = await import('@/lib/supabase');
    (supabase.auth.getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { session: null },
    });
    (supabase.auth.signInAnonymously as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    const { result } = renderHook(() => useCreateHabit(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.mutate).toBeDefined();
    });

    result.current.mutate({
      name: 'Test',
      frequency_type: 'daily',
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect((result.current.error as Error).message).toBe('Not authenticated');
  });
});
