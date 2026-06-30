'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useUserId } from '@/hooks/useAuth';
import { startOfWeek, addDays, format } from 'date-fns';
import type { Habit, CreateHabitInput, UpdateHabitInput } from '@repo/db';

export function useHabits() {
  const userId = useUserId();
  return useQuery({
    queryKey: ['habits', userId],
    enabled: !!userId,
    queryFn: async (): Promise<Habit[]> => {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', userId)
        .eq('archived', false)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateHabit() {
  const queryClient = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: async (input: CreateHabitInput) => {
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
  const userId = useUserId();
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateHabitInput & { id: string }) => {
      if (!userId) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('habits')
        .update(input)
        .eq('id', id)
        .eq('user_id', userId)
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

export function useDeleteHabit() {
  const queryClient = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!userId) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('habit_completions')
        .delete()
        .eq('habit_id', id);
      if (error) throw error;
      const { error: habitError } = await supabase
        .from('habits')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      if (habitError) throw habitError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['completions'] });
    },
  });
}

export function useArchiveHabit() {
  const queryClient = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!userId) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('habits')
        .update({ archived: true })
        .eq('id', id)
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
    },
  });
}

export function useCompletions(date: string) {
  const userId = useUserId();
  return useQuery({
    queryKey: ['completions', userId, date],
    enabled: !!userId && !!date,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('habit_completions')
        .select('*')
        .eq('user_id', userId)
        .gte('completed_at', `${date}T00:00:00Z`)
        .lt('completed_at', `${date}T23:59:59Z`);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useWeekCompletions(selectedDate: Date) {
  const userId = useUserId();
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 6);

  const weekStartStr = format(weekStart, 'yyyy-MM-dd');
  const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['completions', 'week', userId, weekStartStr],
    enabled: !!userId,
    queryFn: async (): Promise<Record<string, string[]>> => {
      const { data, error } = await supabase
        .from('habit_completions')
        .select('*')
        .eq('user_id', userId)
        .gte('completed_at', `${weekStartStr}T00:00:00Z`)
        .lt('completed_at', `${weekEndStr}T23:59:59Z`);
      if (error) throw error;

      const byDate: Record<string, string[]> = {};
      for (let i = 0; i < 7; i++) {
        byDate[format(addDays(weekStart, i), 'yyyy-MM-dd')] = [];
      }
      for (const c of data ?? []) {
        const day = format(new Date(c.completed_at), 'yyyy-MM-dd');
        if (byDate[day]) {
          byDate[day].push(c.habit_id);
        }
      }
      return byDate;
    },
  });
}

export function useToggleCompletion() {
  const queryClient = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: async ({ habitId, date }: { habitId: string; date: string }) => {
      if (!userId) throw new Error('Not authenticated');
      const existing = await supabase
        .from('habit_completions')
        .select('id')
        .eq('habit_id', habitId)
        .eq('user_id', userId)
        .gte('completed_at', `${date}T00:00:00Z`)
        .lt('completed_at', `${date}T23:59:59Z`)
        .maybeSingle();
      if (existing.error) throw existing.error;
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
          .insert([{ habit_id: habitId, user_id: userId, completed_at: `${date}T12:00:00Z` }]);
        if (error) throw error;
        return { completed: true };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['completions'] });
      queryClient.invalidateQueries({ queryKey: ['all-completions'] });
    },
  });
}

const categoryColors: Record<string, string> = {
  health: '#30D158',
  fitness: '#FF9F0A',
  learning: '#FF6482',
  mindfulness: '#BF5AF2',
  work: '#FF453A',
  social: '#AF52DE',
  finance: '#FFD60A',
  other: '#8E8E93',
};

export function getCategoryColor(category: string): string {
  return categoryColors[category.toLowerCase()] || categoryColors.other;
}
