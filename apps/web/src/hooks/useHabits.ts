'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Habit, CreateHabitInput, UpdateHabitInput } from '@repo/db';

async function getUserId() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id;
}

export function useHabits() {
  return useQuery({
    queryKey: ['habits'],
    queryFn: async (): Promise<Habit[]> => {
      const userId = await getUserId();
      if (!userId) return [];
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', userId)
        .eq('archived', false)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateHabitInput) => {
      const userId = await getUserId();
      if (!userId) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('habits')
        .insert([{ ...input, user_id: userId }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });
}

export function useUpdateHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateHabitInput & { id: string }) => {
      const { data, error } = await supabase
        .from('habits')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });
}

export function useArchiveHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('habits')
        .update({ archived: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });
}

export function useCompletions(date: string) {
  return useQuery({
    queryKey: ['completions', date],
    queryFn: async () => {
      const userId = await getUserId();
      if (!userId) return [];
      const { data, error } = await supabase
        .from('habit_completions')
        .select('*')
        .eq('user_id', userId)
        .gte('completed_at', `${date}T00:00:00Z`)
        .lt('completed_at', `${date}T23:59:59Z`);
      if (error) throw error;
      return data;
    },
  });
}

export function useToggleCompletion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ habitId, date }: { habitId: string; date: string }) => {
      const userId = await getUserId();
      if (!userId) throw new Error('Not authenticated');
      const existing = await supabase
        .from('habit_completions')
        .select('id')
        .eq('habit_id', habitId)
        .eq('user_id', userId)
        .gte('completed_at', `${date}T00:00:00Z`)
        .lt('completed_at', `${date}T23:59:59Z`)
        .maybeSingle();
      if (existing.data) {
        const { error } = await supabase
          .from('habit_completions')
          .delete()
          .eq('id', existing.data.id);
        if (error) throw error;
        return { completed: false };
      } else {
        const { error } = await supabase
          .from('habit_completions')
          .insert([{ habit_id: habitId, user_id: userId }]);
        if (error) throw error;
        return { completed: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['completions'] });
    },
  });
}

const categoryColors: Record<string, string> = {
  health: '#30D158',
  fitness: '#FF9F0A',
  learning: '#0A84FF',
  mindfulness: '#BF5AF2',
  work: '#FF453A',
  social: '#5AC8FA',
  finance: '#FFD60A',
  other: '#8E8E93',
};

export function getCategoryColor(category: string): string {
  return categoryColors[category.toLowerCase()] || categoryColors.other;
}
