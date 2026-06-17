import { startOfDay, subDays, differenceInCalendarDays, isBefore } from 'date-fns';
import type { Habit, HabitCompletion } from '@repo/db';
import { isScheduledToday, getScheduledDaysInRange } from './schedule';

export function calculateCurrentStreak(habit: Habit, completions: HabitCompletion[]): number {
  const today = startOfDay(new Date());

  let checkDate = today;
  let streak = 0;
  const maxLookback = 365;

  for (let i = 0; i < maxLookback; i++) {
    if (!isScheduledToday(habit, checkDate)) {
      checkDate = subDays(checkDate, 1);
      continue;
    }

    const completed = completions.some((c) => {
      const cDate = startOfDay(new Date(c.completed_at));
      return differenceInCalendarDays(cDate, checkDate) === 0;
    });

    if (!completed) break;
    streak++;
    checkDate = subDays(checkDate, 1);
  }

  return streak;
}

export function calculateLongestStreak(habit: Habit, completions: HabitCompletion[]): number {
  if (completions.length === 0) return 0;

  const sortedDates = completions
    .map((c) => startOfDay(new Date(c.completed_at)))
    .sort((a, b) => a.getTime() - b.getTime());

  const today = startOfDay(new Date());
  const earliestCompletion = sortedDates[0];
  const rangeStart = isBefore(earliestCompletion, subDays(today, 365))
    ? earliestCompletion
    : subDays(today, 365);

  const allScheduledDays = getScheduledDaysInRange(habit, rangeStart, today);

  let longest = 0;
  let currentRun = 0;

  for (const scheduledDay of allScheduledDays) {
    const completed = completions.some((c) => {
      const cDate = startOfDay(new Date(c.completed_at));
      return differenceInCalendarDays(cDate, scheduledDay) === 0;
    });

    if (completed) {
      currentRun++;
      if (currentRun > longest) longest = currentRun;
    } else {
      currentRun = 0;
    }
  }

  return longest;
}
