export type FrequencyType = 'daily' | 'weekly' | 'custom_days';

export type TodoPriority = 0 | 1 | 2 | 3;

export interface Todo {
  id: string;
  title: string;
  notes: string;
  due_date: string | null;
  priority: TodoPriority;
  category: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface CreateTodoInput {
  title: string;
  notes?: string;
  due_date?: string | null;
  priority?: TodoPriority;
  category?: string;
}

export interface UpdateTodoInput {
  title?: string;
  notes?: string;
  due_date?: string | null;
  priority?: TodoPriority;
  category?: string;
  completed?: boolean;
}

export interface Habit {
  id: string;
  name: string;
  description: string;
  category: string;
  emoji: string;
  frequency_type: FrequencyType;
  target_count: number;
  custom_days: number[];
  reminder_enabled: boolean;
  reminder_time: string | null;
  archived: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  completed_at: string;
  created_at: string;
  user_id: string;
}

export interface CreateHabitInput {
  name: string;
  description?: string;
  category?: string;
  frequency_type: FrequencyType;
  target_count?: number;
  custom_days?: number[];
  reminder_enabled?: boolean;
  reminder_time?: string | null;
}

export interface UpdateHabitInput extends Partial<CreateHabitInput> {
  archived?: boolean;
}

// ── Gym Tracker ──────────────────────────────────────────────

export type ExerciseCategory = 'compound' | 'isolation' | 'cardio' | 'other';

export type MuscleGroupCategory =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'arms'
  | 'legs'
  | 'core'
  | 'cardio'
  | 'other';

export interface MuscleGroup {
  id: string;
  name: string;
  category: MuscleGroupCategory;
  created_at: string;
}

export interface Exercise {
  id: string;
  name: string;
  primary_muscle: string;
  secondary_muscles: string[];
  category: ExerciseCategory;
  is_custom: boolean;
  user_id: string | null;
  created_at: string;
}

export interface WorkoutSession {
  id: string;
  day_id: string | null;
  started_at: string;
  completed_at: string | null;
  duration_seconds: number | null;
  notes: string;
  created_at: string;
  user_id: string;
}

export interface WorkoutSet {
  id: string;
  session_id: string;
  exercise_id: string;
  set_number: number;
  weight: number;
  reps: number;
  is_warmup: boolean;
  is_failure: boolean;
  rpe: number | null;
  rest_seconds: number | null;
  notes: string;
  completed_at: string;
  created_at: string;
  user_id: string;
}

export interface WorkoutSessionExercise {
  id: string;
  session_id: string;
  exercise_id: string;
  display_order: number;
  target_sets: number;
  target_reps_min: number;
  target_reps_max: number;
  rest_seconds: number;
  notes: string;
  created_at: string;
  user_id: string;
}

export interface ExerciseHistory {
  id: string;
  user_id: string;
  exercise_id: string;
  session_id: string;
  workout_date: string;
  weight: number;
  reps: number;
  is_warmup: boolean;
  is_pr: boolean;
  estimated_1rm: number | null;
  created_at: string;
}

// ── Split Types ─────────────────────────────────────────────

export interface Split {
  id: string;
  name: string;
  archived: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface SplitDay {
  id: string;
  split_id: string;
  name: string;
  display_order: number;
  created_at: string;
  user_id: string;
}

export interface SplitDayExercise {
  id: string;
  day_id: string;
  exercise_id: string;
  display_order: number;
  target_sets: number;
  target_reps_min: number;
  target_reps_max: number;
  rest_seconds: number;
  notes: string;
  created_at: string;
  user_id: string;
}

// ── Input Types ──────────────────────────────────────────────

export interface CreateExerciseInput {
  name: string;
  primary_muscle: string;
  secondary_muscles?: string[];
  category?: ExerciseCategory;
}

export interface UpdateExerciseInput {
  name?: string;
  primary_muscle?: string;
  secondary_muscles?: string[];
  category?: ExerciseCategory;
}

export interface CreateSplitInput {
  name: string;
}

export interface UpdateSplitInput {
  name?: string;
  archived?: boolean;
}

export interface CreateSplitDayInput {
  split_id: string;
  name: string;
  display_order?: number;
}

export interface UpdateSplitDayInput {
  name?: string;
  display_order?: number;
}

export interface CreateSplitDayExerciseInput {
  day_id: string;
  exercise_id: string;
  display_order?: number;
  target_sets?: number;
  target_reps_min?: number;
  target_reps_max?: number;
  rest_seconds?: number;
  notes?: string;
}

export interface UpdateSplitDayExerciseInput {
  display_order?: number;
  target_sets?: number;
  target_reps_min?: number;
  target_reps_max?: number;
  rest_seconds?: number;
  notes?: string;
}

// ── Weekly Review Types ─────────────────────────────────────

export interface HabitBreakdown {
  habit_id: string;
  habit_name: string;
  completed: number;
  scheduled: number;
  percentage: number;
}

export interface WeekComparison {
  habit_id: string;
  habit_name: string;
  current_pct: number;
  previous_pct: number;
  difference: number;
}

export interface WeeklyAchievement {
  id: string;
  name: string;
  description: string;
}

export interface WeeklyReview {
  id: string;
  week_start: string;
  week_end: string;
  overall_score: number;
  total_completed: number;
  total_scheduled: number;
  habit_breakdown: HabitBreakdown[];
  previous_score: number | null;
  previous_completed: number | null;
  score_difference: number | null;
  completed_difference: number | null;
  week_comparison: WeekComparison[];
  achievements: WeeklyAchievement[];
  generated_at: string;
  user_id: string;
}

// ── Derived Types ────────────────────────────────────────────

export interface WorkoutSessionWithSets {
  session: WorkoutSession;
  sets: (WorkoutSet & { exercise: Exercise })[];
  session_exercises: (WorkoutSessionExercise & { exercise: Exercise })[];
  split: Split | null;
  day: SplitDay | null;
}

export interface ExercisePersonalRecord {
  exercise_id: string;
  max_weight: number;
  max_reps: number;
  max_estimated_1rm: number;
  total_volume: number;
  set_count: number;
}

export interface WeeklyVolume {
  week_start: string;
  total_volume: number;
  set_count: number;
  muscle_volumes: Record<string, number>;
}
