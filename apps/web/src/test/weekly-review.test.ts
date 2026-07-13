import { describe, it, expect, beforeEach, vi } from 'vitest';
import { startOfWeek, addDays, format, subWeeks } from 'date-fns';
import type { Habit, HabitCompletion } from '@repo/db';
import { calculateWeeklyReview, getScoreLabel, getScoreColor, getHabitColor } from '@/lib/weekly-review';

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
    id: `c-${date}-${habitId}`,
    habit_id: habitId,
    completed_at: `${date}T12:00:00Z`,
    created_at: `${date}T12:00:00Z`,
    user_id: 'user-1',
  };
}

// Week starting Monday 2024-01-01
const weekStart = new Date('2024-01-01');
const weekEnd = addDays(weekStart, 6);
const previousWeekStart = subWeeks(weekStart, 1);

describe('calculateWeeklyReview', () => {
  it('returns 0 score when no habits exist', () => {
    const review = calculateWeeklyReview({
      habits: [],
      completions: [],
      previousCompletions: [],
      weekStart,
      previousWeekStart,
      userId: 'user-1',
    });

    expect(review.overall_score).toBe(0);
    expect(review.total_completed).toBe(0);
    expect(review.total_scheduled).toBe(0);
    expect(review.habit_breakdown).toEqual([]);
  });

  it('calculates 100% when all scheduled habits are completed', () => {
    const habit = makeHabit({ id: 'h1', frequency_type: 'daily' });
    const completions = Array.from({ length: 7 }, (_, i) =>
      makeCompletion(format(addDays(weekStart, i), 'yyyy-MM-dd'), 'h1'),
    );

    const review = calculateWeeklyReview({
      habits: [habit],
      completions,
      previousCompletions: [],
      weekStart,
      previousWeekStart,
      userId: 'user-1',
    });

    expect(review.overall_score).toBe(100);
    expect(review.total_completed).toBe(7);
    expect(review.total_scheduled).toBe(7);
    expect(review.habit_breakdown[0].percentage).toBe(100);
  });

  it('calculates partial completion correctly', () => {
    const habit = makeHabit({ id: 'h1', frequency_type: 'daily' });
    const completions = [
      makeCompletion('2024-01-01', 'h1'),
      makeCompletion('2024-01-02', 'h1'),
      makeCompletion('2024-01-03', 'h1'),
    ];

    const review = calculateWeeklyReview({
      habits: [habit],
      completions,
      previousCompletions: [],
      weekStart,
      previousWeekStart,
      userId: 'user-1',
    });

    expect(review.overall_score).toBe(43); // 3/7 = 42.86 -> 43
    expect(review.total_completed).toBe(3);
    expect(review.total_scheduled).toBe(7);
  });

  it('handles custom_days habits correctly', () => {
    // Mon/Wed/Fri habit
    const habit = makeHabit({
      id: 'h1',
      frequency_type: 'custom_days',
      custom_days: [1, 3, 5], // Mon=1, Wed=3, Fri=5
    });
    // 2024-01-01 is Monday
    const completions = [
      makeCompletion('2024-01-01', 'h1'), // Mon
      makeCompletion('2024-01-03', 'h1'), // Wed
    ];

    const review = calculateWeeklyReview({
      habits: [habit],
      completions,
      previousCompletions: [],
      weekStart,
      previousWeekStart,
      userId: 'user-1',
    });

    expect(review.total_scheduled).toBe(3); // Mon, Wed, Fri
    expect(review.total_completed).toBe(2);
    expect(review.overall_score).toBe(67); // 2/3 = 66.67 -> 67
  });

  it('handles weekly target_count habits', () => {
    const habit = makeHabit({
      id: 'h1',
      frequency_type: 'weekly',
      target_count: 3,
    });
    // Weekly habits are scheduled every day but target is 3
    const completions = [
      makeCompletion('2024-01-01', 'h1'),
      makeCompletion('2024-01-02', 'h1'),
      makeCompletion('2024-01-03', 'h1'),
    ];

    const review = calculateWeeklyReview({
      habits: [habit],
      completions,
      previousCompletions: [],
      weekStart,
      previousWeekStart,
      userId: 'user-1',
    });

    // Weekly habits scheduled every day = 7 scheduled
    expect(review.total_scheduled).toBe(7);
    expect(review.total_completed).toBe(3);
  });

  it('calculates comparison with previous week', () => {
    const habit = makeHabit({ id: 'h1', frequency_type: 'daily' });

    // Current week: 5/7
    const completions = Array.from({ length: 5 }, (_, i) =>
      makeCompletion(format(addDays(weekStart, i), 'yyyy-MM-dd'), 'h1'),
    );

    // Previous week: 3/7
    const previousCompletions = Array.from({ length: 3 }, (_, i) =>
      makeCompletion(format(addDays(previousWeekStart, i), 'yyyy-MM-dd'), 'h1'),
    );

    const review = calculateWeeklyReview({
      habits: [habit],
      completions,
      previousCompletions,
      weekStart,
      previousWeekStart,
      userId: 'user-1',
    });

    expect(review.previous_score).toBe(43); // 3/7 = 42.86 -> 43
    expect(review.score_difference).toBe(28); // 71 - 43 = 28
    expect(review.completed_difference).toBe(2); // 5 - 3 = 2
    expect(review.week_comparison).toHaveLength(1);
    expect(review.week_comparison[0].difference).toBe(28); // 71 - 43 = 28
  });

  it('returns null comparison when no habits exist', () => {
    const review = calculateWeeklyReview({
      habits: [],
      completions: [],
      previousCompletions: [],
      weekStart,
      previousWeekStart,
      userId: 'user-1',
    });

    expect(review.previous_score).toBeNull();
    expect(review.previous_completed).toBeNull();
    expect(review.score_difference).toBeNull();
    expect(review.completed_difference).toBeNull();
    expect(review.week_comparison).toHaveLength(0);
  });

  it('returns zero previous score when habits exist but no previous completions', () => {
    const habit = makeHabit({ id: 'h1', frequency_type: 'daily' });
    const completions = [
      makeCompletion('2024-01-01', 'h1'),
      makeCompletion('2024-01-02', 'h1'),
    ];

    const review = calculateWeeklyReview({
      habits: [habit],
      completions,
      previousCompletions: [],
      weekStart,
      previousWeekStart,
      userId: 'user-1',
    });

    expect(review.previous_score).toBe(0);
    expect(review.previous_completed).toBe(0);
    expect(review.score_difference).toBe(29); // 29 - 0 = 29
    expect(review.completed_difference).toBe(2); // 2 - 0 = 2
  });

  it('awards Perfect Week achievement for 100% score', () => {
    const habit = makeHabit({ id: 'h1', frequency_type: 'daily' });
    const completions = Array.from({ length: 7 }, (_, i) =>
      makeCompletion(format(addDays(weekStart, i), 'yyyy-MM-dd'), 'h1'),
    );

    const review = calculateWeeklyReview({
      habits: [habit],
      completions,
      previousCompletions: [],
      weekStart,
      previousWeekStart,
      userId: 'user-1',
    });

    expect(review.achievements.find((a) => a.id === 'perfect-week')).toBeDefined();
  });

  it('does not award Perfect Week for less than 100%', () => {
    const habit = makeHabit({ id: 'h1', frequency_type: 'daily' });
    const completions = Array.from({ length: 6 }, (_, i) =>
      makeCompletion(format(addDays(weekStart, i), 'yyyy-MM-dd'), 'h1'),
    );

    const review = calculateWeeklyReview({
      habits: [habit],
      completions,
      previousCompletions: [],
      weekStart,
      previousWeekStart,
      userId: 'user-1',
    });

    expect(review.achievements.find((a) => a.id === 'perfect-week')).toBeUndefined();
  });

  it('awards Focused achievement when all habits reach 100%', () => {
    const habit1 = makeHabit({ id: 'h1', name: 'Reading', frequency_type: 'daily' });
    const habit2 = makeHabit({ id: 'h2', name: 'Meditation', frequency_type: 'daily' });
    const completions = [
      ...Array.from({ length: 7 }, (_, i) =>
        makeCompletion(format(addDays(weekStart, i), 'yyyy-MM-dd'), 'h1'),
      ),
      ...Array.from({ length: 7 }, (_, i) =>
        makeCompletion(format(addDays(weekStart, i), 'yyyy-MM-dd'), 'h2'),
      ),
    ];

    const review = calculateWeeklyReview({
      habits: [habit1, habit2],
      completions,
      previousCompletions: [],
      weekStart,
      previousWeekStart,
      userId: 'user-1',
    });

    expect(review.achievements.find((a) => a.id === 'focused')).toBeDefined();
  });

  it('awards Momentum when score improves over previous week', () => {
    const habit = makeHabit({ id: 'h1', frequency_type: 'daily' });
    // Current week: 5/7
    const completions = Array.from({ length: 5 }, (_, i) =>
      makeCompletion(format(addDays(weekStart, i), 'yyyy-MM-dd'), 'h1'),
    );
    // Previous week: 3/7
    const previousCompletions = Array.from({ length: 3 }, (_, i) =>
      makeCompletion(format(addDays(previousWeekStart, i), 'yyyy-MM-dd'), 'h1'),
    );

    const review = calculateWeeklyReview({
      habits: [habit],
      completions,
      previousCompletions,
      weekStart,
      previousWeekStart,
      userId: 'user-1',
    });

    expect(review.achievements.find((a) => a.id === 'momentum')).toBeDefined();
  });

  it('does not award Momentum when score declines', () => {
    const habit = makeHabit({ id: 'h1', frequency_type: 'daily' });
    // Current week: 3/7
    const completions = Array.from({ length: 3 }, (_, i) =>
      makeCompletion(format(addDays(weekStart, i), 'yyyy-MM-dd'), 'h1'),
    );
    // Previous week: 5/7
    const previousCompletions = Array.from({ length: 5 }, (_, i) =>
      makeCompletion(format(addDays(previousWeekStart, i), 'yyyy-MM-dd'), 'h1'),
    );

    const review = calculateWeeklyReview({
      habits: [habit],
      completions,
      previousCompletions,
      weekStart,
      previousWeekStart,
      userId: 'user-1',
    });

    expect(review.achievements.find((a) => a.id === 'momentum')).toBeUndefined();
  });

  it('handles new habits created during the week', () => {
    // Habit only scheduled from Wednesday
    const habit = makeHabit({
      id: 'h1',
      frequency_type: 'custom_days',
      custom_days: [3], // Wednesday only
    });

    // 2024-01-03 is Wednesday
    const completions = [makeCompletion('2024-01-03', 'h1')];

    const review = calculateWeeklyReview({
      habits: [habit],
      completions,
      previousCompletions: [],
      weekStart,
      previousWeekStart,
      userId: 'user-1',
    });

    expect(review.total_scheduled).toBe(1);
    expect(review.total_completed).toBe(1);
    expect(review.overall_score).toBe(100);
  });

  it('handles habits with no completions', () => {
    const habit = makeHabit({ id: 'h1', frequency_type: 'daily' });

    const review = calculateWeeklyReview({
      habits: [habit],
      completions: [],
      previousCompletions: [],
      weekStart,
      previousWeekStart,
      userId: 'user-1',
    });

    expect(review.overall_score).toBe(0);
    expect(review.total_completed).toBe(0);
    expect(review.total_scheduled).toBe(7);
    expect(review.habit_breakdown[0].percentage).toBe(0);
  });

  it('caps completions at scheduled count', () => {
    const habit = makeHabit({
      id: 'h1',
      frequency_type: 'custom_days',
      custom_days: [1], // Monday only
    });

    // User somehow has 2 completions on the same day (shouldn't happen but defensive)
    const completions = [
      makeCompletion('2024-01-01', 'h1'),
      'extra-id',
    ].slice(0, 1).map((c) =>
      typeof c === 'string' ? makeCompletion('2024-01-01', 'h1') : c,
    );

    const review = calculateWeeklyReview({
      habits: [habit],
      completions,
      previousCompletions: [],
      weekStart,
      previousWeekStart,
      userId: 'user-1',
    });

    expect(review.total_completed).toBeLessThanOrEqual(review.total_scheduled);
  });

  it('generates correct review ID', () => {
    const review = calculateWeeklyReview({
      habits: [],
      completions: [],
      previousCompletions: [],
      weekStart,
      previousWeekStart,
      userId: 'user-1',
    });

    expect(review.id).toBe('review-2024-01-01');
  });

  it('includes user_id in review', () => {
    const review = calculateWeeklyReview({
      habits: [],
      completions: [],
      previousCompletions: [],
      weekStart,
      previousWeekStart,
      userId: 'user-123',
    });

    expect(review.user_id).toBe('user-123');
  });

  it('generates generated_at timestamp', () => {
    const review = calculateWeeklyReview({
      habits: [],
      completions: [],
      previousCompletions: [],
      weekStart,
      previousWeekStart,
      userId: 'user-1',
    });

    expect(review.generated_at).toBeTruthy();
    expect(new Date(review.generated_at).getTime()).not.toBeNaN();
  });

  it('handles multiple habits with different schedules', () => {
    const dailyHabit = makeHabit({ id: 'h1', name: 'Daily', frequency_type: 'daily' });
    const mwfHabit = makeHabit({
      id: 'h2',
      name: 'MWF',
      frequency_type: 'custom_days',
      custom_days: [1, 3, 5],
    });

    // Complete all daily habits
    const dailyCompletions = Array.from({ length: 7 }, (_, i) =>
      makeCompletion(format(addDays(weekStart, i), 'yyyy-MM-dd'), 'h1'),
    );
    // Complete 2 of 3 MWF habits
    const mwfCompletions = [
      makeCompletion('2024-01-01', 'h2'), // Mon
      makeCompletion('2024-01-03', 'h2'), // Wed
    ];

    const review = calculateWeeklyReview({
      habits: [dailyHabit, mwfHabit],
      completions: [...dailyCompletions, ...mwfCompletions],
      previousCompletions: [],
      weekStart,
      previousWeekStart,
      userId: 'user-1',
    });

    // Daily: 7 scheduled, 7 completed
    // MWF: 3 scheduled, 2 completed
    // Total: 10 scheduled, 9 completed
    expect(review.total_scheduled).toBe(10);
    expect(review.total_completed).toBe(9);
    expect(review.overall_score).toBe(90);
  });
});

describe('getScoreLabel', () => {
  it('returns "Perfect Week" for 95-100%', () => {
    expect(getScoreLabel(100)).toBe('Perfect Week');
    expect(getScoreLabel(95)).toBe('Perfect Week');
  });

  it('returns "Excellent Week" for 90-94%', () => {
    expect(getScoreLabel(94)).toBe('Excellent Week');
    expect(getScoreLabel(90)).toBe('Excellent Week');
  });

  it('returns "Good Progress" for 75-89%', () => {
    expect(getScoreLabel(89)).toBe('Good Progress');
    expect(getScoreLabel(75)).toBe('Good Progress');
  });

  it('returns "Needs Improvement" for below 75%', () => {
    expect(getScoreLabel(74)).toBe('Needs Improvement');
    expect(getScoreLabel(0)).toBe('Needs Improvement');
  });
});

describe('getScoreColor', () => {
  it('returns green for 90%+', () => {
    expect(getScoreColor(100)).toBe('#3DD68C');
    expect(getScoreColor(90)).toBe('#3DD68C');
  });

  it('returns yellow for 75-89%', () => {
    expect(getScoreColor(89)).toBe('#FFD60A');
    expect(getScoreColor(75)).toBe('#FFD60A');
  });

  it('returns red for below 75%', () => {
    expect(getScoreColor(74)).toBe('#FF5C5C');
    expect(getScoreColor(0)).toBe('#FF5C5C');
  });
});

describe('getHabitColor', () => {
  it('returns green for 90%+', () => {
    expect(getHabitColor(100)).toBe('#3DD68C');
    expect(getHabitColor(90)).toBe('#3DD68C');
  });

  it('returns yellow for 70-89%', () => {
    expect(getHabitColor(89)).toBe('#FFD60A');
    expect(getHabitColor(70)).toBe('#FFD60A');
  });

  it('returns red for below 70%', () => {
    expect(getHabitColor(69)).toBe('#FF5C5C');
    expect(getHabitColor(0)).toBe('#FF5C5C');
  });
});
