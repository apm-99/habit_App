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

export type CreateHabitInput = z.infer<typeof CreateHabitSchema>;
export type UpdateHabitInput = z.infer<typeof UpdateHabitSchema>;
