'use client';

import { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { HabitCard } from '@/components/HabitCard';
import { HabitForm } from '@/components/HabitForm';
import { useHabits, useCreateHabit } from '@/hooks/useHabits';
import { Plus } from 'lucide-react';
import type { CreateHabitInput } from '@repo/db';

export default function HabitsPage() {
  const [showForm, setShowForm] = useState(false);
  const { data: habits, isLoading } = useHabits();
  const createHabit = useCreateHabit();

  const handleCreate = (input: CreateHabitInput) => {
    createHabit.mutate(input);
  };

  return (
    <AppShell>
      <div className="px-6 pt-10 pb-24">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-text-primary">Habits</h1>
            <p className="text-sm text-text-secondary mt-1">Manage your habits</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="w-10 h-10 rounded-full bg-accent flex items-center justify-center active:scale-90 transition-transform"
          >
            <Plus size={20} className="text-white" />
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 card animate-pulse bg-elevated/50" />
            ))}
          </div>
        ) : habits && habits.length > 0 ? (
          <div className="space-y-3">
            {habits.map((habit) => (
              <HabitCard key={habit.id} habit={habit} />
            ))}
          </div>
        ) : (
          <div className="text-center pt-20">
            <p className="text-text-secondary text-sm">No habits yet</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 text-accent text-sm font-medium"
            >
              Create your first habit
            </button>
          </div>
        )}
      </div>

      <HabitForm open={showForm} onClose={() => setShowForm(false)} onSubmit={handleCreate} />
    </AppShell>
  );
}
