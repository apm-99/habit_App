import { describe, it, expect } from 'vitest';
import type { Habit, HabitCompletion } from '@repo/db';
import { calculateCurrentStreak, calculateLongestStreak } from '@/lib/streaks';

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

function makeCompletion(date: string, habitId = 'test-id'): HabitCompletion {
  return {
    id: `c-${date}`,
    habit_id: habitId,
    completed_at: date,
    created_at: date,
    user_id: 'user-1',
  };
}

describe('calculateCurrentStreak', () => {
  it('returns 0 when no completions', () => {
    const habit = makeHabit();
    expect(calculateCurrentStreak(habit, [])).toBe(0);
  });

  it('returns 1 for today completion', () => {
    const today = new Date().toISOString().split('T')[0];
    const habit = makeHabit();
    const completions = [makeCompletion(today)];
    expect(calculateCurrentStreak(habit, completions)).toBe(1);
  });

  it('returns streak for consecutive days', () => {
    const today = new Date();
    const completions: HabitCompletion[] = [];
    for (let i = 0; i < 5; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      completions.push(makeCompletion(date.toISOString()));
    }
    const habit = makeHabit();
    expect(calculateCurrentStreak(habit, completions)).toBe(5);
  });

  it('breaks streak when a day is missed', () => {
    const today = new Date();
    const completions: HabitCompletion[] = [];
    for (let i = 0; i < 3; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      completions.push(makeCompletion(date.toISOString()));
    }
    const missedDay = new Date(today);
    missedDay.setDate(missedDay.getDate() - 3);
    const olderDate = new Date(today);
    olderDate.setDate(olderDate.getDate() - 4);
    completions.push(makeCompletion(olderDate.toISOString()));
    const habit = makeHabit();
    expect(calculateCurrentStreak(habit, completions)).toBe(3);
  });
});

describe('calculateLongestStreak', () => {
  it('returns 0 when no completions', () => {
    const habit = makeHabit();
    expect(calculateLongestStreak(habit, [])).toBe(0);
  });

  it('returns 1 for single completion', () => {
    const habit = makeHabit();
    const completions = [makeCompletion('2024-01-01')];
    expect(calculateLongestStreak(habit, completions)).toBe(1);
  });

  it('returns longest streak from multiple runs', () => {
    const habit = makeHabit();
    const completions: HabitCompletion[] = [];
    const base = new Date('2024-01-01');
    for (let i = 0; i < 3; i++) {
      const date = new Date(base);
      date.setDate(date.getDate() + i);
      completions.push(makeCompletion(date.toISOString()));
    }
    const base2 = new Date('2024-01-10');
    for (let i = 0; i < 5; i++) {
      const date = new Date(base2);
      date.setDate(date.getDate() + i);
      completions.push(makeCompletion(date.toISOString()));
    }
    expect(calculateLongestStreak(habit, completions)).toBe(5);
  });
});
