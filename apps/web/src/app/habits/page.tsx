'use client';

import { useState, useCallback } from 'react';
import { AppShell } from '@/components/AppShell';
import { HabitCard } from '@/components/HabitCard';
import { HabitForm } from '@/components/HabitForm';
import { UndoToast } from '@/components/UndoToast';
import { useHabits, useCreateHabit, useUpdateHabit, useUndoDeleteHabit } from '@/hooks/useHabits';
import { Plus } from 'lucide-react';
import type { CreateHabitInput, Habit } from '@repo/db';

export default function HabitsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>(undefined);
  const { data: habits, isLoading } = useHabits();
  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();
  const { deleteHabit, undoDelete } = useUndoDeleteHabit();
  const [deletedHabit, setDeletedHabit] = useState<Habit | undefined>(undefined);

  const handleSubmit = async (input: CreateHabitInput) => {
    if (editingHabit) {
      await updateHabit.mutateAsync({ id: editingHabit.id, ...input });
    } else {
      await createHabit.mutateAsync(input);
    }
    setShowForm(false);
    setEditingHabit(undefined);
  };

  const handleDelete = useCallback((habit: Habit) => {
    setDeletedHabit(habit);
    deleteHabit(habit);
  }, [deleteHabit]);

  const handleUndoDelete = useCallback(() => {
    if (deletedHabit) {
      undoDelete(deletedHabit);
      setDeletedHabit(undefined);
    }
  }, [deletedHabit, undoDelete]);

  return (
    <AppShell>
      <div className="px-5 pt-14 pb-24">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[36px] font-[500] tracking-[-0.02em] text-text-primary leading-tight">Habits</h1>
          <button
            onClick={() => { setEditingHabit(undefined); setShowForm(true); }}
            className="w-[34px] h-[34px] rounded-full bg-accent flex items-center justify-center active:opacity-70 transition-opacity shadow-sm"
          >
            <Plus size={18} className="text-white" />
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-[10px]">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[52px] rounded-[10px] bg-card animate-pulse" />
            ))}
          </div>
        ) : habits && habits.length > 0 ? (
          <div className="space-y-[1px]">
            {habits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                onClick={() => { setEditingHabit(habit); setShowForm(true); }}
                onDelete={() => handleDelete(habit)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center pt-20">
            <h2 className="text-[22px] font-[400] tracking-[-0.01em] text-text-primary">No habits yet</h2>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 text-accent text-[15px] font-semibold active:opacity-70 transition-opacity"
            >
              Create your first habit
            </button>
          </div>
        )}
      </div>

      <HabitForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditingHabit(undefined); }}
        onSubmit={handleSubmit}
        initial={editingHabit}
        saving={createHabit.isPending || updateHabit.isPending}
        error={createHabit.error ? (createHabit.error as Error).message : updateHabit.error ? (updateHabit.error as Error).message : null}
      />

      {deletedHabit && (
        <UndoToast
          message={`"${deletedHabit.name}" deleted`}
          onUndo={handleUndoDelete}
          onDismiss={() => setDeletedHabit(undefined)}
        />
      )}
    </AppShell>
  );
}
