'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { startOfWeek, addDays, subWeeks, format, getDay } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { useUserId, useAuthError } from '@/hooks/useAuth';
import { useHabits } from '@/hooks/useHabits';
import { calculateWeeklyReview } from '@/lib/weekly-review';
import {
  getLatestWeeklyReview,
  saveWeeklyReview,
  hasWeeklyReviewBeenShownToday,
  markWeeklyReviewShown,
} from '@/lib/weekly-review-storage';
import type { WeeklyReview, HabitCompletion } from '@repo/db';

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
  const [generating, setGenerating] = useState(false);

  const userId = useUserId();
  const authError = useAuthError();
  const { data: habits, isLoading: habitsLoading } = useHabits();

  const now = useMemo(() => new Date(), []);
  const isMonday = getDay(now) === 1;

  const thisWeekStart = useMemo(() => startOfWeek(now, { weekStartsOn: 1 }), [now]);
  const lastWeekStart = useMemo(() => subWeeks(thisWeekStart, 1), [thisWeekStart]);
  const twoWeeksAgoStart = useMemo(() => subWeeks(thisWeekStart, 2), [thisWeekStart]);

  const {
    data: lastWeekCompletions,
    isFetched: lastWeekFetched,
  } = useWeeklyCompletions(lastWeekStart);

  const {
    data: twoWeeksAgoCompletions,
    isFetched: twoWeeksAgoFetched,
  } = useWeeklyCompletions(twoWeeksAgoStart);

  const lastWeekCompletionsByDate = useMemo(() => {
    if (!lastWeekCompletions) return {} as Record<string, string[]>;
    const byDate: Record<string, string[]> = {};
    for (let i = 0; i < 7; i++) {
      const day = addDays(lastWeekStart, i);
      byDate[format(day, 'yyyy-MM-dd')] = [];
    }
    for (const c of lastWeekCompletions) {
      const day = format(new Date(c.completed_at), 'yyyy-MM-dd');
      if (!byDate[day]) byDate[day] = [];
      byDate[day].push(c.habit_id);
    }
    return byDate;
  }, [lastWeekCompletions, lastWeekStart]);

  // Load existing review from storage
  useEffect(() => {
    const existing = getLatestWeeklyReview();
    if (existing) {
      setCurrentReview(existing);
    }
  }, []);

  const generateReview = useCallback(() => {
    if (!userId || !habits || habits.length === 0) return null;
    if (!lastWeekFetched || !twoWeeksAgoFetched) return null;
    if (!lastWeekCompletions) return null;

    const review = calculateWeeklyReview({
      habits,
      completions: lastWeekCompletions,
      previousCompletions: twoWeeksAgoCompletions ?? [],
      weekStart: lastWeekStart,
      previousWeekStart: twoWeeksAgoStart,
      userId,
    });

    saveWeeklyReview(review);
    return review;
  }, [
    userId, habits, lastWeekCompletions, twoWeeksAgoCompletions,
    lastWeekFetched, twoWeeksAgoFetched,
    lastWeekStart, twoWeeksAgoStart,
  ]);

  // Auto-generate and show on Monday
  useEffect(() => {
    if (!isMonday || !userId || !habits || habits.length === 0) return;
    if (hasWeeklyReviewBeenShownToday()) return;
    if (!lastWeekFetched) return;
    if (generating) return;

    setGenerating(true);
    const review = generateReview();
    setGenerating(false);

    if (!review) return;

    setCurrentReview(review);
    setShowModal(true);
    markWeeklyReviewShown();
  }, [
    isMonday, userId, habits, lastWeekFetched, generating, generateReview,
  ]);

  const openReview = useCallback(() => {
    const existing = getLatestWeeklyReview();

    if (existing) {
      setCurrentReview(existing);
      setShowModal(true);
      return;
    }

    if (!lastWeekFetched) return;

    setGenerating(true);
    const review = generateReview();
    setGenerating(false);

    if (review) {
      setCurrentReview(review);
      setShowModal(true);
    }
  }, [generateReview, lastWeekFetched]);

  const closeReview = useCallback(() => {
    setShowModal(false);
  }, []);

  const hasStoredReview = currentReview !== null && !authError;

  return {
    showModal,
    currentReview,
    hasStoredReview,
    openReview,
    closeReview,
    habits: habits ?? [],
    weekCompletions: lastWeekCompletionsByDate,
    lastWeekFetched,
  };
}
