'use client';

import { useMemo } from 'react';
import { AppShell } from '@/components/AppShell';
import { HabitCard } from '@/components/HabitCard';
import { useHabits, useCompletions, useToggleCompletion } from '@/hooks/useHabits';

export default function TodayPage() {
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const { data: habits, isLoading: habitsLoading } = useHabits();
  const { data: completions } = useCompletions(today);
  const toggleCompletion = useToggleCompletion();

  const completedIds = useMemo(
    () => new Set(completions?.map((c) => c.habit_id) ?? []),
    [completions],
  );

  const handleToggle = (habitId: string) => {
    toggleCompletion.mutate({ habitId, date: today });
  };

  const todayHabits = useMemo(() => {
    if (!habits) return [];
    return habits.filter((habit) => {
      if (habit.frequency_type === 'daily') return true;
      if (habit.frequency_type === 'weekly') return true;
      const dayOfWeek = new Date().getDay();
      return habit.custom_days?.includes(dayOfWeek);
    });
  }, [habits]);

  const completedHabits = todayHabits.filter((h) => completedIds.has(h.id));
  const pendingHabits = todayHabits.filter((h) => !completedIds.has(h.id));
  const allDone = todayHabits.length > 0 && pendingHabits.length === 0;

  return (
    <AppShell>
      <div className="px-6 pt-10 pb-24">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-text-primary">Today</h1>
          <p className="text-sm text-text-secondary mt-1">
            {allDone
              ? 'All done!'
              : `${pendingHabits.length} of ${todayHabits.length} remaining`}
          </p>
        </div>

        {habitsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 card animate-pulse bg-elevated/50" />
            ))}
          </div>
        ) : todayHabits.length === 0 ? (
          <div className="text-center pt-20">
            <p className="text-text-secondary text-sm text-balance">
              No habits scheduled for today.{'\n'}Add some in the Habits tab.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingHabits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                showToggle
                completed={false}
                onToggle={() => handleToggle(habit.id)}
              />
            ))}
            {completedHabits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                showToggle
                completed
                onToggle={() => handleToggle(habit.id)}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
