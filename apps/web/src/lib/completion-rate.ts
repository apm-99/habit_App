import { startOfDay, differenceInCalendarDays } from 'date-fns';
import type { Habit, HabitCompletion } from '@repo/db';
import { getScheduledDaysInRange } from './schedule';

export function calculateRate(
  habit: Habit,
  completions: HabitCompletion[],
  startDate: Date,
  endDate: Date,
): number {
  const scheduledDays = getScheduledDaysInRange(habit, startDate, endDate);
  if (scheduledDays.length === 0) return 0;

  let completedCount = 0;
  for (const scheduledDay of scheduledDays) {
    const isCompleted = completions.some((c) => {
      const cDate = startOfDay(new Date(c.completed_at));
      return differenceInCalendarDays(cDate, scheduledDay) === 0;
    });
    if (isCompleted) completedCount++;
  }

  return Math.round((completedCount / scheduledDays.length) * 100);
}

export function calculateOverallRate(
  habits: Habit[],
  completions: HabitCompletion[],
  startDate: Date,
  endDate: Date,
): number {
  if (habits.length === 0) return 0;

  let totalScheduled = 0;
  let totalCompleted = 0;

  for (const habit of habits) {
    const scheduledDays = getScheduledDaysInRange(habit, startDate, endDate);
    totalScheduled += scheduledDays.length;

    for (const scheduledDay of scheduledDays) {
      const isCompleted = completions.some((c) => {
        const cDate = startOfDay(new Date(c.completed_at));
        return c.habit_id === habit.id && differenceInCalendarDays(cDate, scheduledDay) === 0;
      });
      if (isCompleted) totalCompleted++;
    }
  }

  if (totalScheduled === 0) return 0;
  return Math.round((totalCompleted / totalScheduled) * 100);
}

export function getDayCompletionRatio(
  date: Date,
  habits: Habit[],
  completions: HabitCompletion[],
): { completed: number; total: number } {
  const scheduled = habits.filter((h) => {
    const dayOfWeek = date.getDay();
    if (h.frequency_type === 'daily') return true;
    if (h.frequency_type === 'weekly') return true;
    return h.custom_days?.includes(dayOfWeek) ?? false;
  });

  const completed = scheduled.filter((h) =>
    completions.some((c) => {
      const cDate = startOfDay(new Date(c.completed_at));
      return c.habit_id === h.id && differenceInCalendarDays(cDate, date) === 0;
    }),
  );

  return { completed: completed.length, total: scheduled.length };
}
