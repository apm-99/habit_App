'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { AppShell } from '@/components/AppShell';
import { HabitCard } from '@/components/HabitCard';
import { HabitForm } from '@/components/HabitForm';
import { WeeklyRings } from '@/components/WeeklyRings';
import { useHabits, useCompletions, useToggleCompletion, useCreateHabit, useUpdateHabit, useDeleteHabit, useWeekCompletions } from '@/hooks/useHabits';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { isScheduledToday } from '@/lib/schedule';
import type { CreateHabitInput, Habit } from '@repo/db';
import { format, addDays, subDays, isToday, getDayOfYear, getDaysInYear } from 'date-fns';

export default function TodayPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showForm, setShowForm] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>(undefined);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dateStr = useMemo(() => format(selectedDate, 'yyyy-MM-dd'), [selectedDate]);
  const isCurrentDay = useMemo(() => isToday(selectedDate), [selectedDate]);

  const { data: habits, isLoading: habitsLoading } = useHabits();
  const { data: completions } = useCompletions(dateStr);
  const { data: weekCompletions } = useWeekCompletions(selectedDate);
  const toggleCompletion = useToggleCompletion();
  const createHabit = useCreateHabit();
  const updateHabit = useUpdateHabit();
  const deleteHabit = useDeleteHabit();

  const completedIds = useMemo(
    () => new Set(completions?.map((c) => c.habit_id) ?? []),
    [completions],
  );

  const handleToggle = useCallback((habitId: string) => {
    toggleCompletion.mutate({ habitId, date: dateStr });
  }, [dateStr, toggleCompletion]);

  const handleFormSubmit = async (input: CreateHabitInput) => {
    if (editingHabit) {
      await updateHabit.mutateAsync({ id: editingHabit.id, ...input });
    } else {
      await createHabit.mutateAsync(input);
    }
    setShowForm(false);
    setEditingHabit(undefined);
  };

  const handleEdit = useCallback((habit: Habit) => {
    setEditingHabit(habit);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback((id: string) => {
    deleteHabit.mutate(id);
  }, [deleteHabit]);

  const todayHabits = useMemo(() => {
    if (!habits) return [];
    return habits.filter((habit) => isScheduledToday(habit, selectedDate));
  }, [habits, selectedDate]);

  const sortedHabits = useMemo(() => {
    const pending: Habit[] = [];
    const done: Habit[] = [];
    for (const h of todayHabits) {
      if (completedIds.has(h.id)) {
        done.push(h);
      } else {
        pending.push(h);
      }
    }
    return [...pending, ...done];
  }, [todayHabits, completedIds]);

  const weeklyProgressMap = useMemo(() => {
    if (!weekCompletions) return new Map<string, { completed: number; target: number }>();
    const map = new Map<string, { completed: number; target: number }>();
    for (const habit of habits ?? []) {
      let target = 0;
      if (habit.frequency_type === 'daily') target = 7;
      else if (habit.frequency_type === 'weekly') target = habit.target_count;
      else if (habit.frequency_type === 'custom_days') target = habit.custom_days?.length ?? 0;

      let completed = 0;
      for (const [, ids] of Object.entries(weekCompletions)) {
        if (ids.includes(habit.id)) completed++;
      }

      map.set(habit.id, { completed: Math.min(completed, target), target });
    }
    return map;
  }, [habits, weekCompletions]);

  const completedCount = useMemo(() => todayHabits.filter(h => completedIds.has(h.id)).length, [todayHabits, completedIds]);

  const goToPrevDay = useCallback(() => setSelectedDate(d => subDays(d, 1)), []);
  const goToNextDay = useCallback(() => setSelectedDate(d => addDays(d, 1)), []);
  const goToToday = useCallback(() => setSelectedDate(new Date()), []);

  const dayLabel = mounted ? format(selectedDate, isCurrentDay ? 'EEEE, MMMM d' : 'MMM d, yyyy') : '';

  const completionsByDate = useMemo(() => {
    if (!weekCompletions) return {};
    return weekCompletions;
  }, [weekCompletions]);

  function YearProgress() {
    const now = new Date();
    const dayOfYear = getDayOfYear(now);
    const daysInYear = getDaysInYear(now);
    const pct = (dayOfYear / daysInYear) * 100;
    return (
      <div className="mt-10">
        <p className="text-[13px] font-[500] text-text-secondary tracking-[-0.01em] mb-3">Year Progress</p>
        <div className="flex items-baseline gap-1.5 mb-2.5">
          <span className="text-[28px] font-[350] text-text-primary tracking-[-0.02em]">{pct.toFixed(1)}%</span>
          <span className="text-[13px] text-muted">{dayOfYear} / {daysInYear} days</span>
        </div>
          <div className="h-[4px] rounded-full bg-border overflow-hidden">
            <div className="h-full rounded-full bg-[#007AFF]/70 transition-all duration-500 ease-smooth" style={{ width: `${pct}%` }} />
          </div>
      </div>
    );
  }

  return (
    <AppShell>
      <div className="px-5 pt-14 pb-24">
        <div className="flex items-center justify-between mb-0.5">
          <h1 className="text-[36px] font-[500] tracking-[-0.02em] text-text-primary leading-tight">
            {isCurrentDay ? 'Today' : format(selectedDate, 'EEEE')}
          </h1>
          {!isCurrentDay && mounted && (
            <button
              onClick={goToToday}
              className="text-[15px] text-accent font-[500] active:opacity-50 transition-opacity"
            >
              Today
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 mb-5">
          <p className="text-[15px] text-text-secondary">{mounted ? dayLabel : ''}</p>
          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={goToPrevDay}
              className="w-[32px] h-[32px] rounded-full flex items-center justify-center active:opacity-50 transition-opacity text-text-secondary hover:text-text-primary"
              aria-label="Previous day"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={goToNextDay}
              className="w-[32px] h-[32px] rounded-full flex items-center justify-center active:opacity-50 transition-opacity text-text-secondary hover:text-text-primary"
              aria-label="Next day"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <WeeklyRings habits={habits || []} completionsByDate={completionsByDate} selectedDate={selectedDate} onSelectDay={setSelectedDate} />

        {habitsLoading ? (
          <div className="space-y-[10px]">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[52px] rounded-[10px] bg-card animate-pulse" />
            ))}
          </div>
        ) : todayHabits.length === 0 ? (
          <div className="text-center pt-20">
            <h2 className="text-[22px] font-[400] tracking-[-0.01em] text-text-primary">No habits scheduled</h2>
            <p className="text-[15px] text-text-secondary mt-2.5 max-w-[280px] mx-auto leading-relaxed">
              {isCurrentDay ? 'Create a habit to get started.' : 'No habits scheduled for this day.'}
            </p>
            {isCurrentDay && (
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 border border-text-secondary/50 rounded-[20px] px-6 py-2.5 text-[15px] text-text-primary active:opacity-50 transition-opacity"
              >
                Create Habit
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="text-[14px] text-text-secondary mb-5">
              <strong className="font-[500] text-text-primary">{completedCount} of {todayHabits.length}</strong> completed
              {isCurrentDay && (
                <button
                  onClick={() => setShowForm(true)}
                  className="ml-3 text-[15px] text-accent bg-none border-none p-0 align-baseline font-[400] cursor-pointer active:opacity-50 transition-opacity"
                >
                  Add
                </button>
              )}
            </p>

            <div className="space-y-5">
              {sortedHabits.map((habit) => (
                <div key={habit.id} className="animate-[fadeSlideUp_0.35s_cubic-bezier(0.16,1,0.3,1)_both]">
                  <HabitCard
                    habit={habit}
                    showToggle
                    completed={completedIds.has(habit.id)}
                    onToggle={() => handleToggle(habit.id)}
                    onClick={() => handleEdit(habit)}
                    onDelete={() => handleDelete(habit.id)}
                    weeklyProgress={weeklyProgressMap.get(habit.id)}
                  />
                </div>
              ))}
            </div>
          </>
        )}

        {mounted && <YearProgress />}
      </div>

      {isCurrentDay && (
        <button
          onClick={() => setShowForm(true)}
          className="fixed bottom-24 right-6 w-[56px] h-[56px] rounded-full bg-accent flex items-center justify-center active:opacity-70 transition-opacity shadow-lg z-40"
        >
          <Plus size={24} className="text-white" />
        </button>
      )}

      <HabitForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditingHabit(undefined); }}
        onSubmit={handleFormSubmit}
        initial={editingHabit}
        saving={createHabit.isPending || updateHabit.isPending}
        error={createHabit.error ? (createHabit.error as Error).message : updateHabit.error ? (updateHabit.error as Error).message : null}
      />
    </AppShell>
  );
}
