'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useUserId } from '@/hooks/useAuth';
import { useHabits } from '@/hooks/useHabits';
import { calculateCurrentStreak, calculateLongestStreak } from '@/lib/streaks';
import { calculateRate, calculateOverallRate, getDayCompletionRatio } from '@/lib/completion-rate';
import { isScheduledToday } from '@/lib/schedule';
import { startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, subDays, eachDayOfInterval } from 'date-fns';
import type { Habit, HabitCompletion } from '@repo/db';

function useAllCompletions() {
  const userId = useUserId();
  return useQuery({
    queryKey: ['all-completions', userId],
    enabled: !!userId,
    queryFn: async (): Promise<HabitCompletion[]> => {
      const { data, error } = await supabase
        .from('habit_completions')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 1000 * 60,
  });
}

export function useStreaks() {
  const { data: habits } = useHabits();
  const { data: completions } = useAllCompletions();

  return useMemo(() => {
    if (!habits || !completions) return null;
    return habits.map((habit) => {
      const habitCompletions = completions.filter((c) => c.habit_id === habit.id);
      return {
        habitId: habit.id,
        currentStreak: calculateCurrentStreak(habit, habitCompletions),
        longestStreak: calculateLongestStreak(habit, habitCompletions),
      };
    });
  }, [habits, completions]);
}

export function useMonthlyData(year: number, month: number) {
  const { data: habits } = useHabits();
  const { data: completions } = useAllCompletions();

  return useMemo(() => {
    if (!habits || !completions) return null;
    const monthStart = startOfMonth(new Date(year, month));
    const monthEnd = endOfMonth(monthStart);
    const days: { date: Date; completed: number; total: number }[] = [];
    const current = new Date(monthStart);
    while (current <= monthEnd) {
      const ratio = getDayCompletionRatio(current, habits, completions);
      days.push({ date: new Date(current), ...ratio });
      current.setDate(current.getDate() + 1);
    }
    return days;
  }, [habits, completions, year, month]);
}

export function useYearlyData(year: number) {
  const { data: habits } = useHabits();
  const { data: completions } = useAllCompletions();

  return useMemo(() => {
    if (!habits || !completions) return null;
    const yearStart = startOfYear(new Date(year, 0));
    const yearEnd = endOfYear(yearStart);
    const days: { date: Date; completed: number; total: number }[] = [];
    const current = new Date(yearStart);
    while (current <= yearEnd) {
      const ratio = getDayCompletionRatio(current, habits, completions);
      days.push({ date: new Date(current), ...ratio });
      current.setDate(current.getDate() + 1);
    }
    return days;
  }, [habits, completions, year]);
}

export function useCompletionRate(monthsBack: number = 1) {
  const { data: habits } = useHabits();
  const { data: completions } = useAllCompletions();

  return useMemo(() => {
    if (!habits || !completions) return null;
    const end = new Date();
    const start = subMonths(end, monthsBack);
    return {
      overall: calculateOverallRate(habits, completions, start, end),
      byHabit: habits.map((habit) => {
        const habitCompletions = completions.filter((c) => c.habit_id === habit.id);
        return {
          habitId: habit.id,
          habitName: habit.name,
          rate: calculateRate(habit, habitCompletions, start, end),
        };
      }),
    };
  }, [habits, completions, monthsBack]);
}

export function useDailyRates(daysBack: number = 30) {
  const { data: habits } = useHabits();
  const { data: completions } = useAllCompletions();

  return useMemo(() => {
    if (!habits || !completions) return null;
    const end = new Date();
    const start = subDays(end, daysBack - 1);
    const days = eachDayOfInterval({ start, end });
    return days.map((date) => {
      let total = 0;
      let completed = 0;
      for (const habit of habits) {
        if (!isScheduledToday(habit, date)) continue;
        total++;
        const dateStr = date.toISOString().split('T')[0];
        const hasCompletion = completions.some(
          (c) => c.habit_id === habit.id && c.completed_at.startsWith(dateStr),
        );
        if (hasCompletion) completed++;
      }
      return {
        date,
        rate: total > 0 ? completed / total : 0,
        completed,
        total,
      };
    });
  }, [habits, completions, daysBack]);
}
