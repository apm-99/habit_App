import { describe, it, expect } from 'vitest';
import type { Habit } from '@repo/db';
import { isScheduledToday, getWeeklyScheduleDescription } from '@/lib/schedule';

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'test-id',
    name: 'Test Habit',
    description: '',
    category: '',
    frequency_type: 'daily',
    target_count: 1,
    custom_days: [],
    reminder_enabled: false,
    reminder_time: null,
    archived: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    user_id: 'user-1',
    ...overrides,
  };
}

describe('isScheduledToday', () => {
  it('returns true for daily habit', () => {
    const habit = makeHabit({ frequency_type: 'daily' });
    expect(isScheduledToday(habit, new Date('2024-01-01'))).toBe(true);
  });

  it('returns true for weekly habit', () => {
    const habit = makeHabit({ frequency_type: 'weekly' });
    expect(isScheduledToday(habit, new Date('2024-01-01'))).toBe(true);
  });

  it('returns true for custom_days matching today', () => {
    const monday = new Date('2024-01-01');
    expect(monday.getDay()).toBe(1);
    const habit = makeHabit({ frequency_type: 'custom_days', custom_days: [1] });
    expect(isScheduledToday(habit, monday)).toBe(true);
  });

  it('returns false for custom_days not matching today', () => {
    const monday = new Date('2024-01-01');
    const habit = makeHabit({ frequency_type: 'custom_days', custom_days: [3] });
    expect(isScheduledToday(habit, monday)).toBe(false);
  });

  it('returns false for empty custom_days', () => {
    const habit = makeHabit({ frequency_type: 'custom_days', custom_days: [] });
    expect(isScheduledToday(habit, new Date('2024-01-01'))).toBe(false);
  });
});

describe('getWeeklyScheduleDescription', () => {
  it('returns "Daily" for daily habit', () => {
    expect(getWeeklyScheduleDescription(makeHabit({ frequency_type: 'daily' }))).toBe('Daily');
  });

  it('returns "3x/week" for weekly habit', () => {
    expect(getWeeklyScheduleDescription(makeHabit({ frequency_type: 'weekly', target_count: 3 }))).toBe('3x/week');
  });

  it('returns "Daily" for 7x/week', () => {
    expect(getWeeklyScheduleDescription(makeHabit({ frequency_type: 'weekly', target_count: 7 }))).toBe('Daily');
  });

  it('returns day names for custom_days', () => {
    const habit = makeHabit({ frequency_type: 'custom_days', custom_days: [1, 3, 5] });
    expect(getWeeklyScheduleDescription(habit)).toBe('Mon/Wed/Fri');
  });

  it('returns "Daily" for all 7 custom_days', () => {
    const habit = makeHabit({ frequency_type: 'custom_days', custom_days: [0, 1, 2, 3, 4, 5, 6] });
    expect(getWeeklyScheduleDescription(habit)).toBe('Daily');
  });
});
