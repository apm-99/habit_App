import { startOfMonth, endOfMonth, eachDayOfInterval, getDay, startOfWeek, endOfWeek } from 'date-fns';
import type { Habit, FrequencyType } from '@repo/db';

export function isScheduledToday(habit: Habit, date: Date = new Date()): boolean {
  const dayOfWeek = date.getDay();
  switch (habit.frequency_type) {
    case 'daily':
      return true;
    case 'weekly':
      return true;
    case 'custom_days':
      return habit.custom_days?.includes(dayOfWeek) ?? false;
    default:
      return false;
  }
}

export function getScheduledDaysForMonth(habit: Habit, year: number, month: number): Date[] {
  const monthStart = startOfMonth(new Date(year, month));
  const monthEnd = endOfMonth(monthStart);
  const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  return allDays.filter((date) => isScheduledToday(habit, date));
}

export function getWeeklyScheduleDescription(habit: Habit): string {
  if (habit.frequency_type === 'daily') return 'Daily';
  if (habit.frequency_type === 'weekly') {
    if (habit.target_count >= 7) return 'Daily';
    return `${habit.target_count}x/week`;
  }
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const days = (habit.custom_days ?? []).map((d) => dayNames[d]);
  if (days.length === 7) return 'Daily';
  return days.join('/');
}

export function getScheduledDaysInRange(habit: Habit, start: Date, end: Date): Date[] {
  const allDays = eachDayOfInterval({ start, end });
  return allDays.filter((date) => isScheduledToday(habit, date));
}
