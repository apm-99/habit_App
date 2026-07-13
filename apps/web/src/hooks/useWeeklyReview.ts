'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { startOfWeek, addDays, subWeeks, format, getDay } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useUserId } from '@/hooks/useAuth';
import { useHabits } from '@/hooks/useHabits';
import { calculateWeeklyReview } from '@/lib/weekly-review';
import {
  getLatestWeeklyReview,
  saveWeeklyReview,
  hasWeeklyReviewBeenShownToday,
  markWeeklyReviewShown,
} from '@/lib/weekly-review-storage';
import type { WeeklyReview, Habit, HabitCompletion } from '@repo/db';

function useWeeklyCompletions(weekStart: Date) {
  const userId = useUserId();
  const weekEnd = addDays(weekStart, 6);
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');
  const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['completions', 'weekly-review', userId, weekStartStr],
    enabled: !!userId,
    queryFn: async (): Promise<HabitCompletion[]> => {
      const { data, error } = await supabase
        .from('habit_completions')
        .select('*')
        .eq('user_id', userId)
        .gte('completed_at', `${weekStartStr}T00:00:00Z`)
        .lte('completed_at', `${weekEndStr}T23:59:59Z`);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useWeeklyReview() {
  const [showModal, setShowModal] = useState(false);
  const [currentReview, setCurrentReview] = useState<WeeklyReview | null>(null);

  const userId = useUserId();
  const { data: habits } = useHabits();

  const now = useMemo(() => new Date(), []);
  const isMonday = getDay(now) === 1;

  const thisWeekStart = useMemo(() => startOfWeek(now, { weekStartsOn: 1 }), [now]);
  const lastWeekStart = useMemo(() => subWeeks(thisWeekStart, 1), [thisWeekStart]);

  const { data: lastWeekCompletions } = useWeeklyCompletions(lastWeekStart);
  const { data: thisWeekCompletions } = useWeeklyCompletions(thisWeekStart);

  const lastWeekCompletionsForReview = useMemo(() => {
    if (!lastWeekCompletions) return [];
    return lastWeekCompletions;
  }, [lastWeekCompletions]);

  const thisWeekCompletionsForReview = useMemo(() => {
    if (!thisWeekCompletions) return [];
    return thisWeekCompletions;
  }, [thisWeekCompletions]);

  const thisWeekCompletionsByDate = useMemo(() => {
    if (!thisWeekCompletions) return {} as Record<string, string[]>;
    const byDate: Record<string, string[]> = {};
    for (let i = 0; i < 7; i++) {
      const day = addDays(thisWeekStart, i);
      byDate[format(day, 'yyyy-MM-dd')] = [];
    }
    for (const c of thisWeekCompletions) {
      const day = format(new Date(c.completed_at), 'yyyy-MM-dd');
      if (!byDate[day]) byDate[day] = [];
      byDate[day].push(c.habit_id);
    }
    return byDate;
  }, [thisWeekCompletions, thisWeekStart]);

  // Load existing review from storage
  useEffect(() => {
    const existing = getLatestWeeklyReview();
    if (existing) {
      setCurrentReview(existing);
    }
  }, []);

  // Auto-generate and show on Monday
  useEffect(() => {
    if (!isMonday || !userId || !habits || habits.length === 0) return;
    if (hasWeeklyReviewBeenShownToday()) return;
    if (!lastWeekCompletions || !thisWeekCompletions) return;

    const review = calculateWeeklyReview({
      habits,
      completions: thisWeekCompletionsForReview,
      previousCompletions: lastWeekCompletionsForReview,
      weekStart: thisWeekStart,
      previousWeekStart: lastWeekStart,
      userId,
    });

    saveWeeklyReview(review);
    setCurrentReview(review);
    setShowModal(true);
    markWeeklyReviewShown();
  }, [
    isMonday,
    userId,
    habits,
    lastWeekCompletions,
    thisWeekCompletions,
    thisWeekCompletionsForReview,
    lastWeekCompletionsForReview,
    thisWeekStart,
    lastWeekStart,
  ]);

  const openReview = useCallback(() => {
    const existing = getLatestWeeklyReview();
    if (existing) {
      setCurrentReview(existing);
      setShowModal(true);
    }
  }, []);

  const closeReview = useCallback(() => {
    setShowModal(false);
  }, []);

  const hasStoredReview = currentReview !== null;

  return {
    showModal,
    currentReview,
    hasStoredReview,
    openReview,
    closeReview,
    habits: habits ?? [],
    weekCompletions: thisWeekCompletionsByDate,
  };
}
