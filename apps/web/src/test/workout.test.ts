import { describe, it, expect } from 'vitest';
import {
  estimated1RM,
  totalVolume,
  setVolume,
  bestSet,
  formatWeight,
  formatDuration,
  formatVolume,
  formatSetSummary,
  getMuscleGroupColor,
  todayString,
  daysAgoString,
} from '@/lib/workout';
import type { WorkoutSet } from '@repo/db';

function makeSet(overrides: Partial<WorkoutSet> = {}): WorkoutSet {
  return {
    id: 'test-set-id',
    session_id: 'test-session-id',
    exercise_id: 'test-exercise-id',
    set_number: 1,
    weight: 80,
    reps: 8,
    is_warmup: false,
    is_failure: false,
    rpe: null,
    rest_seconds: null,
    notes: '',
    completed_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    user_id: 'test-user-id',
    ...overrides,
  };
}

describe('estimated1RM', () => {
  it('returns weight for single rep', () => {
    expect(estimated1RM(100, 1)).toBe(100);
  });

  it('calculates Epley formula correctly', () => {
    // 100 * (1 + 10/30) = 133.33...
    const result = estimated1RM(100, 10);
    expect(result).toBeCloseTo(133.33, 1);
  });

  it('returns 0 for zero weight or reps', () => {
    expect(estimated1RM(0, 10)).toBe(0);
    expect(estimated1RM(100, 0)).toBe(0);
  });

  it('calculates 80kg x 8 correctly', () => {
    // 80 * (1 + 8/30) = 80 * 1.2667 = 101.33
    const result = estimated1RM(80, 8);
    expect(result).toBeCloseTo(101.33, 1);
  });
});

describe('totalVolume', () => {
  it('sums weight * reps for working sets', () => {
    const sets = [
      makeSet({ weight: 80, reps: 8, is_warmup: false }),
      makeSet({ weight: 80, reps: 8, is_warmup: false }),
      makeSet({ weight: 80, reps: 6, is_warmup: false }),
    ];
    expect(totalVolume(sets)).toBe(80 * 8 + 80 * 8 + 80 * 6);
  });

  it('excludes warmup sets', () => {
    const sets = [
      makeSet({ weight: 40, reps: 10, is_warmup: true }),
      makeSet({ weight: 80, reps: 8, is_warmup: false }),
    ];
    expect(totalVolume(sets)).toBe(80 * 8);
  });

  it('returns 0 for empty array', () => {
    expect(totalVolume([])).toBe(0);
  });
});

describe('setVolume', () => {
  it('calculates volume for a working set', () => {
    expect(setVolume(makeSet({ weight: 80, reps: 8 }))).toBe(640);
  });

  it('returns 0 for warmup sets', () => {
    expect(setVolume(makeSet({ weight: 80, reps: 8, is_warmup: true }))).toBe(0);
  });
});

describe('bestSet', () => {
  it('returns the heaviest set', () => {
    const sets = [
      makeSet({ weight: 80, reps: 8 }),
      makeSet({ weight: 100, reps: 3 }),
      makeSet({ weight: 90, reps: 5 }),
    ];
    expect(bestSet(sets)?.weight).toBe(100);
  });

  it('prefers more reps at same weight', () => {
    const sets = [
      makeSet({ weight: 80, reps: 6 }),
      makeSet({ weight: 80, reps: 8 }),
    ];
    expect(bestSet(sets)?.reps).toBe(8);
  });

  it('excludes warmup sets', () => {
    const sets = [
      makeSet({ weight: 120, reps: 2, is_warmup: true }),
      makeSet({ weight: 80, reps: 8, is_warmup: false }),
    ];
    expect(bestSet(sets)?.weight).toBe(80);
  });

  it('returns null for empty array', () => {
    expect(bestSet([])).toBeNull();
  });
});

describe('formatWeight', () => {
  it('formats integer weights', () => {
    expect(formatWeight(80)).toBe('80');
  });

  it('formats decimal weights', () => {
    expect(formatWeight(82.5)).toBe('82.5');
  });

  it('formats zero', () => {
    expect(formatWeight(0)).toBe('0');
  });
});

describe('formatDuration', () => {
  it('formats seconds only', () => {
    expect(formatDuration(45)).toBe('45s');
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration(125)).toBe('2m 5s');
  });

  it('formats hours and minutes', () => {
    expect(formatDuration(3660)).toBe('1h 1m');
  });
});

describe('formatVolume', () => {
  it('formats zero', () => {
    expect(formatVolume(0)).toBe('0');
  });

  it('formats small numbers', () => {
    expect(formatVolume(500)).toBe('500');
  });

  it('formats thousands', () => {
    expect(formatVolume(12500)).toBe('12.5k');
  });

  it('formats millions', () => {
    expect(formatVolume(1500000)).toBe('1.5M');
  });
});

describe('formatSetSummary', () => {
  it('formats weight and reps', () => {
    expect(formatSetSummary(80, 8)).toBe('80 kg × 8');
  });

  it('formats decimal weight', () => {
    expect(formatSetSummary(82.5, 8)).toBe('82.5 kg × 8');
  });

  it('formats zero weight', () => {
    expect(formatSetSummary(0, 12)).toBe('12 reps');
  });
});

describe('getMuscleGroupColor', () => {
  it('returns correct color for known groups', () => {
    expect(getMuscleGroupColor('chest')).toBe('#FF6B4A');
    expect(getMuscleGroupColor('back')).toBe('#3DD68C');
    expect(getMuscleGroupColor('legs')).toBe('#FF9F0A');
  });

  it('returns default for unknown', () => {
    expect(getMuscleGroupColor('unknown')).toBe('#8E8E93');
  });

  it('is case-insensitive', () => {
    expect(getMuscleGroupColor('Chest')).toBe('#FF6B4A');
    expect(getMuscleGroupColor('CHEST')).toBe('#FF6B4A');
  });
});

describe('todayString', () => {
  it('returns YYYY-MM-DD format', () => {
    const result = todayString();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('daysAgoString', () => {
  it('returns a date N days ago', () => {
    const result = daysAgoString(7);
    const expected = new Date();
    expected.setUTCDate(expected.getUTCDate() - 7);
    expect(result).toBe(expected.toISOString().split('T')[0]);
  });

  it('returns today for 0 days', () => {
    expect(daysAgoString(0)).toBe(todayString());
  });
});
