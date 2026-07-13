import { z } from 'zod';

export const FrequencyTypeSchema = z.enum(['daily', 'weekly', 'custom_days']);

export const CreateHabitSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  description: z.string().max(500, 'Description must be 500 characters or less').default(''),
  category: z.string().max(50).default(''),
  frequency_type: FrequencyTypeSchema,
  target_count: z.number().int().min(1).max(7).default(1),
  custom_days: z.array(z.number().int().min(0).max(6)).default([]),
  reminder_enabled: z.boolean().default(false),
  reminder_time: z.string().nullable().default(null),
});

export const UpdateHabitSchema = CreateHabitSchema.partial().extend({
  archived: z.boolean().optional(),
});

export const TodoPrioritySchema = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]);

export const CreateTodoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  notes: z.string().max(1000, 'Notes must be 1000 characters or less').default(''),
  due_date: z.string().nullable().default(null),
  priority: TodoPrioritySchema.default(0),
  category: z.string().max(50).default(''),
});

export const UpdateTodoSchema = CreateTodoSchema.partial().extend({
  completed: z.boolean().optional(),
});

export type CreateHabitInput = z.infer<typeof CreateHabitSchema>;
export type UpdateHabitInput = z.infer<typeof UpdateHabitSchema>;
export type CreateTodoInput = z.infer<typeof CreateTodoSchema>;
export type UpdateTodoInput = z.infer<typeof UpdateTodoSchema>;

// ── Gym Tracker Schemas ──────────────────────────────────────

export const ExerciseCategorySchema = z.enum(['compound', 'isolation', 'cardio', 'other']);
export const MuscleGroupCategorySchema = z.enum([
  'chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'cardio', 'other',
]);

export const CreateExerciseSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  primary_muscle: z.string().min(1, 'Primary muscle is required'),
  secondary_muscles: z.array(z.string()).default([]),
  category: ExerciseCategorySchema.default('other'),
});

export const UpdateExerciseSchema = CreateExerciseSchema.partial();

export const CreateSplitSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
});

export const UpdateSplitSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  archived: z.boolean().optional(),
});

export const CreateSplitDaySchema = z.object({
  split_id: z.string().uuid(),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  display_order: z.number().int().min(0).default(0),
});

export const UpdateSplitDaySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  display_order: z.number().int().min(0).optional(),
});

export const CreateSplitDayExerciseSchema = z.object({
  day_id: z.string().uuid(),
  exercise_id: z.string().uuid(),
  display_order: z.number().int().min(0).default(0),
  target_sets: z.number().int().min(1).max(20).default(3),
  target_reps_min: z.number().int().min(1).max(100).default(8),
  target_reps_max: z.number().int().min(1).max(100).default(12),
  rest_seconds: z.number().int().min(0).max(600).default(90),
  notes: z.string().max(500).default(''),
});

export const UpdateSplitDayExerciseSchema = z.object({
  display_order: z.number().int().min(0).optional(),
  target_sets: z.number().int().min(1).max(20).optional(),
  target_reps_min: z.number().int().min(1).max(100).optional(),
  target_reps_max: z.number().int().min(1).max(100).optional(),
  rest_seconds: z.number().int().min(0).max(600).optional(),
  notes: z.string().max(500).optional(),
});

// ── Weekly Review Schema ─────────────────────────────────────

export const HabitBreakdownSchema = z.object({
  habit_id: z.string(),
  habit_name: z.string(),
  completed: z.number().int().min(0),
  scheduled: z.number().int().min(0),
  percentage: z.number().min(0).max(100),
});

export const WeekComparisonSchema = z.object({
  habit_id: z.string(),
  habit_name: z.string(),
  current_pct: z.number().min(0).max(100),
  previous_pct: z.number().min(0).max(100),
  difference: z.number().min(-100).max(100),
});

export const WeeklyAchievementSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
});

export const WeeklyReviewSchema = z.object({
  id: z.string(),
  week_start: z.string(),
  week_end: z.string(),
  overall_score: z.number().min(0).max(100),
  total_completed: z.number().int().min(0),
  total_scheduled: z.number().int().min(0),
  habit_breakdown: z.array(HabitBreakdownSchema),
  previous_score: z.number().nullable(),
  previous_completed: z.number().nullable(),
  score_difference: z.number().nullable(),
  completed_difference: z.number().nullable(),
  week_comparison: z.array(WeekComparisonSchema),
  achievements: z.array(WeeklyAchievementSchema),
  generated_at: z.string(),
  user_id: z.string(),
});
