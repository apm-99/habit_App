import { startOfWeek, addDays, format, startOfDay, differenceInCalendarDays } from 'date-fns';
import type { Habit, HabitCompletion, HabitBreakdown, WeekComparison, WeeklyAchievement, WeeklyReview } from '@repo/db';
import { getScheduledDaysInRange } from './schedule';

function getScheduledOccurrences(habit: Habit, weekStart: Date, weekEnd: Date): number {
  if (habit.frequency_type === 'weekly') {
    const dayCount = differenceInCalendarDays(weekEnd, weekStart) + 1;
    return Math.min(habit.target_count, dayCount);
  }
  return getScheduledDaysInRange(habit, weekStart, weekEnd).length;
}

function getCompletedOccurrences(
  habitId: string,
  completions: HabitCompletion[],
  weekStart: Date,
  weekEnd: Date,
): number {
  let count = 0;
  const scheduledDays = eachDayOfIntervalStrict(weekStart, weekEnd);
  for (const day of scheduledDays) {
    const isCompleted = completions.some((c) => {
      if (c.habit_id !== habitId) return false;
      const cDate = startOfDay(new Date(c.completed_at));
      return differenceInCalendarDays(cDate, day) === 0;
    });
    if (isCompleted) count++;
  }
  return count;
}

function eachDayOfIntervalStrict(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  const current = new Date(start);
  while (current <= end) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
}

function getScoreLabel(score: number): string {
  if (score >= 95) return 'Perfect Week';
  if (score >= 90) return 'Excellent Week';
  if (score >= 75) return 'Good Progress';
  return 'Needs Improvement';
}

function getScoreColor(score: number): string {
  if (score >= 90) return '#3DD68C';
  if (score >= 75) return '#FFD60A';
  return '#FF5C5C';
}

function getHabitColor(pct: number): string {
  if (pct >= 90) return '#3DD68C';
  if (pct >= 70) return '#FFD60A';
  return '#FF5C5C';
}

function determineAchievements(
  overallScore: number,
  habitBreakdown: HabitBreakdown[],
  weekComparison: WeekComparison[],
  totalScheduled: number,
): WeeklyAchievement[] {
  const achievements: WeeklyAchievement[] = [];

  if (overallScore === 100 && totalScheduled > 0) {
    achievements.push({
      id: 'perfect-week',
      name: 'Perfect Week',
      description: 'Every scheduled habit completed.',
    });
  }

  const all100 = habitBreakdown.length > 0 && habitBreakdown.every((h) => h.percentage === 100);
  if (all100 && habitBreakdown.length > 0) {
    achievements.push({
      id: 'focused',
      name: 'Focused',
      description: 'Every habit reached 100%.',
    });
  }

  const improved = weekComparison.some((c) => c.difference > 0);
  if (improved && weekComparison.length > 0) {
    achievements.push({
      id: 'momentum',
      name: 'Momentum',
      description: 'Overall score improved compared to last week.',
    });
  }

  return achievements;
}

export function calculateWeeklyReview(params: {
  habits: Habit[];
  completions: HabitCompletion[];
  previousCompletions: HabitCompletion[];
  weekStart: Date;
  previousWeekStart: Date;
  userId: string;
}): WeeklyReview {
  const { habits, completions, previousCompletions, weekStart, previousWeekStart, userId } = params;
  const weekEnd = addDays(weekStart, 6);
  const previousWeekEnd = addDays(previousWeekStart, 6);

  let totalScheduled = 0;
  let totalCompleted = 0;

  const habitBreakdown: HabitBreakdown[] = habits.map((habit) => {
    const scheduled = getScheduledOccurrences(habit, weekStart, weekEnd);
    const completed = getCompletedOccurrences(habit.id, completions, weekStart, weekEnd);
    totalScheduled += scheduled;
    totalCompleted += Math.min(completed, scheduled);

    const percentage = scheduled > 0 ? Math.round((Math.min(completed, scheduled) / scheduled) * 100) : 0;

    return {
      habit_id: habit.id,
      habit_name: habit.name,
      completed: Math.min(completed, scheduled),
      scheduled,
      percentage,
    };
  });

  const overallScore = totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0;

  // Previous week calculations
  let prevTotalScheduled = 0;
  let prevTotalCompleted = 0;
  const prevHabitMap = new Map<string, { completed: number; scheduled: number; percentage: number }>();

  for (const habit of habits) {
    const scheduled = getScheduledOccurrences(habit, previousWeekStart, previousWeekEnd);
    const completed = getCompletedOccurrences(habit.id, previousCompletions, previousWeekStart, previousWeekEnd);
    prevTotalScheduled += scheduled;
    prevTotalCompleted += Math.min(completed, scheduled);

    const percentage = scheduled > 0 ? Math.round((Math.min(completed, scheduled) / scheduled) * 100) : 0;
    prevHabitMap.set(habit.id, { completed: Math.min(completed, scheduled), scheduled, percentage });
  }

  const previousScore = prevTotalScheduled > 0 ? Math.round((prevTotalCompleted / prevTotalScheduled) * 100) : null;
  const previousCompletedCount = prevTotalScheduled > 0 ? prevTotalCompleted : null;

  const scoreDifference = previousScore !== null ? overallScore - previousScore : null;
  const completedDifference = previousCompletedCount !== null ? totalCompleted - previousCompletedCount : null;

  // Per-habit comparison
  const weekComparison: WeekComparison[] = habitBreakdown
    .filter((h) => prevHabitMap.has(h.habit_id))
    .map((h) => {
      const prev = prevHabitMap.get(h.habit_id)!;
      return {
        habit_id: h.habit_id,
        habit_name: h.habit_name,
        current_pct: h.percentage,
        previous_pct: prev.percentage,
        difference: h.percentage - prev.percentage,
      };
    });

  const achievements = determineAchievements(overallScore, habitBreakdown, weekComparison, totalScheduled);

  return {
    id: `review-${format(weekStart, 'yyyy-MM-dd')}`,
    week_start: format(weekStart, 'yyyy-MM-dd'),
    week_end: format(weekEnd, 'yyyy-MM-dd'),
    overall_score: overallScore,
    total_completed: totalCompleted,
    total_scheduled: totalScheduled,
    habit_breakdown: habitBreakdown,
    previous_score: previousScore,
    previous_completed: previousCompletedCount,
    score_difference: scoreDifference,
    completed_difference: completedDifference,
    week_comparison: weekComparison,
    achievements,
    generated_at: new Date().toISOString(),
    user_id: userId,
  };
}

export { getScoreLabel, getScoreColor, getHabitColor };
