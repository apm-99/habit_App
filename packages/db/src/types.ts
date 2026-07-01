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
