'use client';

import { useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useUserId } from '@/hooks/useAuth';
import { format, addDays } from 'date-fns';
import { enqueue } from '@/lib/sync-queue';
import type { Todo, CreateTodoInput, UpdateTodoInput } from '@repo/db';

export function useTodos() {
  const userId = useUserId();
  return useQuery({
    queryKey: ['todos', userId],
    enabled: !!userId,
    queryFn: async (): Promise<Todo[]> => {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateTodo() {
  const queryClient = useQueryClient();
  const userId = useUserId();

  return useMutation({
    mutationFn: async (input: CreateTodoInput) => {
      if (!userId) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('todos')
        .insert([{ ...input, user_id: userId }])
        .select()
        .single();
      if (error) throw error;
      return data as Todo;
    },
    onMutate: async (input) => {
      if (!userId) return;
      await queryClient.cancelQueries({ queryKey: ['todos', userId] });

      const previous = queryClient.getQueryData<Todo[]>(['todos', userId]);
      const optimistic: Todo = {
        id: crypto.randomUUID?.() ?? `temp-${Date.now()}`,
        title: input.title,
        notes: input.notes ?? '',
        due_date: input.due_date ?? null,
        priority: input.priority ?? 0,
        category: input.category ?? '',
        completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: userId,
      };

      queryClient.setQueryData<Todo[]>(['todos', userId], (old) =>
        old ? [optimistic, ...old] : [optimistic],
      );

      return { previous, optimisticId: optimistic.id };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['todos', userId], context.previous);
      }
      if (context?.optimisticId) {
        enqueue('createTodo', { input: _input, optimisticId: context.optimisticId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
}

export function useUpdateTodo() {
  const queryClient = useQueryClient();
  const userId = useUserId();

  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateTodoInput & { id: string }) => {
      if (!userId) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('todos')
        .update(input)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw error;
      return data as Todo;
    },
    onMutate: async ({ id, ...input }) => {
      if (!userId) return;
      await queryClient.cancelQueries({ queryKey: ['todos', userId] });

      const previous = queryClient.getQueryData<Todo[]>(['todos', userId]);

      queryClient.setQueryData<Todo[]>(['todos', userId], (old) =>
        old
          ? old.map((t) => (t.id === id ? { ...t, ...input, updated_at: new Date().toISOString() } : t))
          : [],
      );

      return { previous };
    },
    onError: (_err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['todos', userId], context.previous);
      }
      enqueue('updateTodo', variables);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
}

export function useDeleteTodo() {
  const queryClient = useQueryClient();
  const userId = useUserId();
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const performRealDelete = useCallback(async (id: string) => {
    if (!userId) return;
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) return;
    queryClient.invalidateQueries({ queryKey: ['todos'] });
  }, [userId, queryClient]);

  const deleteTodo = useCallback(
    (todo: Todo) => {
      const key = todo.id;

      queryClient.setQueryData<Todo[]>(['todos', userId], (old) =>
        old ? old.filter((t) => t.id !== key) : [],
      );

      const timer = setTimeout(() => {
        timersRef.current.delete(key);
        performRealDelete(key);
      }, 5000);

      timersRef.current.set(key, timer);
    },
    [queryClient, userId, performRealDelete],
  );

  const undoDelete = useCallback(
    (todo: Todo) => {
      const key = todo.id;
      const timer = timersRef.current.get(key);
      if (timer) {
        clearTimeout(timer);
        timersRef.current.delete(key);
      }

      queryClient.setQueryData<Todo[]>(['todos', userId], (old) => {
        if (!old) return [todo];
        if (old.some((t) => t.id === key)) return old;
        return [...old, todo].sort((a, b) => b.created_at.localeCompare(a.created_at));
      });
    },
    [queryClient, userId],
  );

  return { deleteTodo, undoDelete };
}

export function useCleanupOldTodos() {
  const userId = useUserId();

  return useMutation({
    mutationFn: async () => {
      if (!userId) return;
      const cutoff = format(addDays(new Date(), -2), 'yyyy-MM-dd');
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('user_id', userId)
        .lt('created_at', `${cutoff}T23:59:59Z`);
      if (error) throw error;
    },
    onSuccess: () => {
      // Don't invalidate here — the caller controls when to refetch
    },
  });
}
