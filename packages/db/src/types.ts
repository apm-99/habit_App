export type FrequencyType = 'daily' | 'weekly' | 'custom_days';

export interface Habit {
  id: string;
  name: string;
  description: string;
  category: string;
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
