import { describe, it, expect } from 'vitest';
import type { Habit, HabitCompletion } from '@repo/db';
import { calculateRate, calculateOverallRate, getDayCompletionRatio } from '@/lib/completion-rate';

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'test-id',
    name: 'Test Habit',
    description: '',
    category: '',
    frequency_type: 'daily',
    target_count: 1,
    custom_days: [],
    reminder_enabled: false,
    reminder_time: null,
    archived: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    user_id: 'user-1',
    ...overrides,
  };
}

function makeCompletion(date: string, habitId = 'test-id'): HabitCompletion {
  return {
    id: `c-${date}`,
    habit_id: habitId,
    completed_at: date,
    created_at: date,
    user_id: 'user-1',
  };
}

describe('calculateRate', () => {
  it('returns 0 when no scheduled days in range', () => {
    const habit = makeHabit({ frequency_type: 'custom_days', custom_days: [] });
    const start = new Date('2024-01-01');
    const end = new Date('2024-01-07');
    expect(calculateRate(habit, [], start, end)).toBe(0);
  });

  it('returns 100 when all scheduled days completed', () => {
    const habit = makeHabit();
    const start = new Date('2024-01-01');
    const end = new Date('2024-01-03');
    const completions = [
      makeCompletion('2024-01-01'),
      makeCompletion('2024-01-02'),
      makeCompletion('2024-01-03'),
    ];
    expect(calculateRate(habit, completions, start, end)).toBe(100);
  });

  it('returns 50 when half of scheduled days completed', () => {
    const habit = makeHabit();
    const start = new Date('2024-01-01');
    const end = new Date('2024-01-04');
    const completions = [
      makeCompletion('2024-01-01'),
      makeCompletion('2024-01-02'),
    ];
    expect(calculateRate(habit, completions, start, end)).toBe(50);
  });

  it('returns 0 when no completions', () => {
    const habit = makeHabit();
    const start = new Date('2024-01-01');
    const end = new Date('2024-01-07');
    expect(calculateRate(habit, [], start, end)).toBe(0);
  });
});

describe('calculateOverallRate', () => {
  it('returns 0 for empty habits', () => {
    const start = new Date('2024-01-01');
    const end = new Date('2024-01-07');
    expect(calculateOverallRate([], [], start, end)).toBe(0);
  });

  it('returns aggregate rate across multiple habits', () => {
    const habit1 = makeHabit({ id: 'h1' });
    const habit2 = makeHabit({ id: 'h2' });
    const start = new Date('2024-01-01');
    const end = new Date('2024-01-02');
    const completions = [
      makeCompletion('2024-01-01', 'h1'),
      makeCompletion('2024-01-02', 'h1'),
      makeCompletion('2024-01-01', 'h2'),
    ];
    const rate = calculateOverallRate([habit1, habit2], completions, start, end);
    expect(rate).toBe(75);
  });
});

describe('getDayCompletionRatio', () => {
  it('returns {0,0} for empty habits', () => {
    const result = getDayCompletionRatio(new Date('2024-01-01'), [], []);
    expect(result).toEqual({ completed: 0, total: 0 });
  });

  it('returns correct ratio', () => {
    const habits = [makeHabit({ id: 'h1' }), makeHabit({ id: 'h2' }), makeHabit({ id: 'h3' })];
    const completions = [makeCompletion('2024-01-01', 'h1'), makeCompletion('2024-01-01', 'h2')];
    const result = getDayCompletionRatio(new Date('2024-01-01'), habits, completions);
    expect(result).toEqual({ completed: 2, total: 3 });
  });
});
