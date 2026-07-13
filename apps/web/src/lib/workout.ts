import type {
  WorkoutSet,
  Exercise,
  ExerciseHistory,
  ExercisePersonalRecord,
  WeeklyVolume,
} from '@repo/db';

/**
 * Calculate estimated 1-rep max using the Epley formula.
 * e1rm = weight * (1 + reps / 30)
 */
export function estimated1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

/**
 * Calculate total volume for a set of working sets (excluding warmups).
 */
export function totalVolume(sets: WorkoutSet[]): number {
  return sets
    .filter((s) => !s.is_warmup)
    .reduce((sum, s) => sum + s.weight * s.reps, 0);
}

/**
 * Calculate volume for a single set.
 */
export function setVolume(set: WorkoutSet): number {
  if (set.is_warmup) return 0;
  return set.weight * set.reps;
}

/**
 * Get the best (heaviest) working set from a list.
 */
export function bestSet(sets: WorkoutSet[]): WorkoutSet | null {
  const working = sets.filter((s) => !s.is_warmup && s.weight > 0 && s.reps > 0);
  if (working.length === 0) return null;
  return working.reduce((best, s) =>
    s.weight > best.weight || (s.weight === best.weight && s.reps > best.reps) ? s : best,
  );
}

/**
 * Get the personal record for an exercise from history.
 */
export function getPersonalRecord(history: ExerciseHistory[]): ExercisePersonalRecord | null {
  const working = history.filter((h) => !h.is_warmup && h.weight > 0 && h.reps > 0);
  if (working.length === 0) return null;

  let maxWeight = 0;
  let maxReps = 0;
  let max1RM = 0;
  let totalVol = 0;

  for (const h of working) {
    if (h.weight > maxWeight) maxWeight = h.weight;
    if (h.reps > maxReps) maxReps = h.reps;
    const e1rm = h.estimated_1rm ?? estimated1RM(h.weight, h.reps);
    if (e1rm > max1RM) max1RM = e1rm;
    totalVol += h.weight * h.reps;
  }

  return {
    exercise_id: working[0].exercise_id,
    max_weight: maxWeight,
    max_reps: maxReps,
    max_estimated_1rm: max1RM,
    total_volume: totalVol,
    set_count: working.length,
  };
}

/**
 * Get the last completed workout for an exercise.
 */
export function getLastWorkout(
  history: ExerciseHistory[],
  exerciseId: string,
): ExerciseHistory[] | null {
  const exerciseHistory = history
    .filter((h) => h.exercise_id === exerciseId && !h.is_warmup)
    .sort((a, b) => b.workout_date.localeCompare(a.workout_date));

  if (exerciseHistory.length === 0) return null;

  const lastDate = exerciseHistory[0].workout_date;
  return exerciseHistory.filter((h) => h.workout_date === lastDate);
}

/**
 * Generate a progressive overload suggestion based on history.
 */
export function suggestProgressiveOverload(
  history: ExerciseHistory[],
  exerciseId: string,
): {
  suggested_weight: number;
  suggested_reps: number;
  message: string;
  type: 'increase_weight' | 'increase_reps' | 'maintain';
} | null {
  const recent = history
    .filter((h) => h.exercise_id === exerciseId && !h.is_warmup)
    .sort((a, b) => b.workout_date.localeCompare(a.workout_date));

  if (recent.length === 0) {
    return null;
  }

  const lastSets = recent.filter((h) => h.workout_date === recent[0].workout_date);
  const lastBest = lastSets.reduce((best, s) =>
    s.weight > best.weight || (s.weight === best.weight && s.reps > best.reps) ? s : best,
  );

  if (lastBest.weight === 0) return null;

  // Check if the user has been repeating this weight for 3+ weeks
  const uniqueWeeks = new Map<string, typeof recent[0]>();
  for (const h of recent) {
    const weekStart = getWeekStart(h.workout_date);
    if (!uniqueWeeks.has(weekStart)) {
      uniqueWeeks.set(weekStart, h);
    }
  }

  const weeks = Array.from(uniqueWeeks.values());
  const repeatedWeeks = weeks.filter((w) => w.weight === lastBest.weight).length;

  // If repeated 3+ weeks at same weight, suggest increasing reps first
  if (repeatedWeeks >= 3 && lastBest.reps < 12) {
    const newReps = lastBest.reps + 2;
    return {
      suggested_weight: lastBest.weight,
      suggested_reps: Math.min(newReps, 12),
      message: `You've repeated this weight for ${repeatedWeeks} weeks. Aim for ${lastBest.weight} × ${Math.min(newReps, 12)} before increasing load.`,
      type: 'increase_reps',
    };
  }

  // If last session was strong (8+ reps), increase weight
  if (lastBest.reps >= 8) {
    const increment = getWeightIncrement(lastBest.weight);
    return {
      suggested_weight: lastBest.weight + increment,
      suggested_reps: lastBest.reps,
      message: `Based on your previous performance, increase weight by ${increment} kg.`,
      type: 'increase_weight',
    };
  }

  // If reps are below 8, try to increase reps first
  if (lastBest.reps < 8) {
    return {
      suggested_weight: lastBest.weight,
      suggested_reps: lastBest.reps + 1,
      message: `Increase reps to ${lastBest.reps + 1} before adding weight.`,
      type: 'increase_reps',
    };
  }

  return {
    suggested_weight: lastBest.weight,
    suggested_reps: lastBest.reps,
    message: 'Maintain current weight and reps.',
    type: 'maintain',
  };
}

/**
 * Get the appropriate weight increment based on current load.
 */
function getWeightIncrement(currentWeight: number): number {
  if (currentWeight < 20) return 1;
  if (currentWeight < 60) return 2;
  if (currentWeight < 100) return 2.5;
  return 2.5;
}

/**
 * Get ISO week start date string (Monday).
 */
function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().split('T')[0];
}

/**
 * Calculate weekly volumes from history.
 */
export function calculateWeeklyVolumes(
  history: ExerciseHistory[],
  exercises: Exercise[],
  weeksBack: number = 12,
): WeeklyVolume[] {
  const now = new Date();
  const volumes: WeeklyVolume[] = [];

  for (let i = 0; i < weeksBack; i++) {
    const weekEnd = new Date(now);
    weekEnd.setUTCDate(weekEnd.getUTCDate() - i * 7);
    const weekStart = new Date(weekEnd);
    weekStart.setUTCDate(weekStart.getUTCDate() - 6);

    const startStr = weekStart.toISOString().split('T')[0];
    const endStr = weekEnd.toISOString().split('T')[0];

    const weekSets = history.filter(
      (h) =>
        !h.is_warmup &&
        h.workout_date >= startStr &&
        h.workout_date <= endStr &&
        h.weight > 0 &&
        h.reps > 0,
    );

    const muscleVolumes: Record<string, number> = {};
    let totalVolume = 0;

    for (const s of weekSets) {
      const vol = s.weight * s.reps;
      totalVolume += vol;

      const exercise = exercises.find((e) => e.id === s.exercise_id);
      if (exercise) {
        muscleVolumes[exercise.primary_muscle] =
          (muscleVolumes[exercise.primary_muscle] ?? 0) + vol;
        for (const secondary of exercise.secondary_muscles) {
          muscleVolumes[secondary] = (muscleVolumes[secondary] ?? 0) + vol * 0.5;
        }
      }
    }

    volumes.unshift({
      week_start: startStr,
      total_volume: totalVolume,
      set_count: weekSets.length,
      muscle_volumes: muscleVolumes,
    });
  }

  return volumes;
}

/**
 * Format weight for display.
 */
export function formatWeight(weight: number): string {
  if (weight === 0) return '0';
  if (weight % 1 === 0) return weight.toString();
  return weight.toFixed(1);
}

/**
 * Format duration in seconds to a human-readable string.
 */
export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) return `${hrs}h ${mins}m`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

/**
 * Format volume for display (e.g., 12500 → "12.5k").
 */
export function formatVolume(volume: number): string {
  if (volume === 0) return '0';
  if (volume >= 1_000_000) return `${(volume / 1_000_000).toFixed(1)}M`;
  if (volume >= 1_000) return `${(volume / 1_000).toFixed(1)}k`;
  return volume.toString();
}

/**
 * Format reps for display.
 */
export function formatReps(reps: number): string {
  return reps.toString();
}

/**
 * Get a summary string for a set (e.g., "80 kg × 8").
 */
export function formatSetSummary(weight: number, reps: number): string {
  if (weight === 0) return `${reps} reps`;
  return `${formatWeight(weight)} kg × ${reps}`;
}

/**
 * Get muscle group color based on category.
 */
export function getMuscleGroupColor(category: string): string {
  const colors: Record<string, string> = {
    chest: '#FF6B4A',
    back: '#3DD68C',
    shoulders: '#FFD60A',
    arms: '#AF52DE',
    legs: '#FF9F0A',
    core: '#FF6482',
    cardio: '#FF453A',
    other: '#8E8E93',
  };
  return colors[category.toLowerCase()] ?? colors.other;
}

/**
 * Check if a new set is a personal record compared to history.
 */
export function isPersonalRecord(
  weight: number,
  reps: number,
  history: ExerciseHistory[],
  exerciseId: string,
): boolean {
  const working = history.filter(
    (h) => h.exercise_id === exerciseId && !h.is_warmup && h.weight > 0 && h.reps > 0,
  );

  if (working.length === 0) return weight > 0 && reps > 0;

  const current1RM = estimated1RM(weight, reps);
  const max1RM = Math.max(...working.map((h) => h.estimated_1rm ?? estimated1RM(h.weight, h.reps)));

  return current1RM > max1RM;
}

/**
 * Get today's date string in UTC.
 */
export function todayString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get date N days ago as a string.
 */
export function daysAgoString(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().split('T')[0];
}

// ── Performance Comparison ────────────────────────────────────

export interface PerformanceComparison {
  weightDelta: number;
  repsDelta: number;
  volumeDelta: number;
  isPR: boolean;
  isHighestVolume: boolean;
  message: string;
  type: 'improved' | 'declined' | 'same' | 'first';
}

/**
 * Compare current set performance against last workout.
 */
export function compareSetPerformance(
  currentWeight: number,
  currentReps: number,
  history: ExerciseHistory[],
  exerciseId: string,
): PerformanceComparison {
  const working = history
    .filter((h) => h.exercise_id === exerciseId && !h.is_warmup)
    .sort((a, b) => b.workout_date.localeCompare(a.workout_date));

  if (working.length === 0) {
    return {
      weightDelta: 0,
      repsDelta: 0,
      volumeDelta: 0,
      isPR: currentWeight > 0 && currentReps > 0,
      isHighestVolume: false,
      message: 'First time logging this exercise',
      type: 'first',
    };
  }

  // Get last workout's best set for this exercise
  const lastDate = working[0].workout_date;
  const lastSets = working.filter((h) => h.workout_date === lastDate);
  const lastBest = lastSets.reduce((best, s) =>
    s.weight > best.weight || (s.weight === best.weight && s.reps > best.reps) ? s : best,
  );

  const weightDelta = currentWeight - lastBest.weight;
  const repsDelta = currentReps - lastBest.reps;
  const currentVolume = currentWeight * currentReps;
  const lastVolume = lastBest.weight * lastBest.reps;
  const volumeDelta = currentVolume - lastVolume;

  // Check if PR
  const max1RM = Math.max(...working.map((h) => h.estimated_1rm ?? estimated1RM(h.weight, h.reps)));
  const current1RM = estimated1RM(currentWeight, currentReps);
  const isPR = current1RM > max1RM;

  // Check if highest volume ever
  const allVolumes = working.map((h) => h.weight * h.reps);
  const maxVolume = Math.max(...allVolumes);
  const isHighestVolume = currentVolume > maxVolume;

  let message: string;
  let type: PerformanceComparison['type'];

  if (isPR) {
    message = `New Personal Record! ${formatSetSummary(currentWeight, currentReps)}`;
    type = 'improved';
  } else if (isHighestVolume) {
    message = 'Highest volume ever!';
    type = 'improved';
  } else if (weightDelta > 0) {
    message = `↑ +${formatWeight(weightDelta)} kg from last workout`;
    type = 'improved';
  } else if (repsDelta > 0) {
    message = `↑ +${repsDelta} repetition${repsDelta > 1 ? 's' : ''}`;
    type = 'improved';
  } else if (weightDelta < 0) {
    message = `↓ ${formatWeight(weightDelta)} kg from last workout`;
    type = 'declined';
  } else if (repsDelta < 0) {
    message = `↓ ${repsDelta} repetition${repsDelta < -1 ? 's' : ''}`;
    type = 'declined';
  } else {
    message = 'Same as last workout';
    type = 'same';
  }

  return {
    weightDelta,
    repsDelta,
    volumeDelta,
    isPR,
    isHighestVolume,
    message,
    type,
  };
}

/**
 * Get last completed date for an exercise.
 */
export function getLastCompletedDate(
  history: ExerciseHistory[],
  exerciseId: string,
): string | null {
  const exerciseHistory = history
    .filter((h) => h.exercise_id === exerciseId && !h.is_warmup)
    .sort((a, b) => b.workout_date.localeCompare(a.workout_date));

  if (exerciseHistory.length === 0) return null;
  return exerciseHistory[0].workout_date;
}

/**
 * Get days since last workout for an exercise.
 */
export function getDaysSinceLastWorkout(
  history: ExerciseHistory[],
  exerciseId: string,
): number | null {
  const lastDate = getLastCompletedDate(history, exerciseId);
  if (!lastDate) return null;
  const now = new Date();
  const last = new Date(lastDate + 'T00:00:00Z');
  return Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Pre-fill sets from last workout for an exercise.
 */
export function prefillSetsFromHistory(
  history: ExerciseHistory[],
  exerciseId: string,
  count: number = 3,
): { weight: number; reps: number }[] {
  const working = history
    .filter((h) => h.exercise_id === exerciseId && !h.is_warmup)
    .sort((a, b) => b.workout_date.localeCompare(a.workout_date));

  if (working.length === 0) {
    return Array.from({ length: count }, () => ({ weight: 0, reps: 0 }));
  }

  // Get last workout's sets
  const lastDate = working[0].workout_date;
  const lastSets = working
    .filter((h) => h.workout_date === lastDate)
    .sort((a, b) => a.weight - b.weight);

  // Fill with last workout's pattern
  const sets = [];
  for (let i = 0; i < count; i++) {
    const sourceSet = lastSets[i % lastSets.length];
    sets.push({
      weight: sourceSet.weight,
      reps: sourceSet.reps,
    });
  }
  return sets;
}
