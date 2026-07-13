'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EmptyState } from '@/components/EmptyState';
import { ExercisePicker } from '@/components/ExercisePicker';
import {
  useSplits,
  useActiveSplit,
  useCreateSplit,
  useUpdateSplit,
  useDeleteSplit,
  useSplitDays,
  useCreateSplitDay,
  useDeleteSplitDay,
  useSplitDayExercises,
  useAddSplitDayExercise,
  useUpdateSplitDayExercise,
  useRemoveSplitDayExercise,
  useStartWorkout,
  useActiveSession,
} from '@/hooks/useGym';
import {
  Dumbbell,
  Plus,
  Play,
  ChevronRight,
  Archive,
  MoreHorizontal,
  Trash2,
  Pencil,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Split, SplitDay, SplitDayExercise } from '@repo/db';

export default function GymPage() {
  const router = useRouter();
  const [showCreateSplit, setShowCreateSplit] = useState(false);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: splits, isLoading: splitsLoading } = useSplits();
  const { data: activeSplit } = useActiveSplit();
  const { data: activeSession } = useActiveSession();
  const createSplit = useCreateSplit();
  const updateSplit = useUpdateSplit();
  const { deleteSplit, undoDelete } = useDeleteSplit();
  const startWorkout = useStartWorkout();

  const archivedSplits = useMemo(() => {
    return splits?.filter((s) => s.archived) ?? [];
  }, [splits]);

  const handleCreateSplit = useCallback(async (name: string) => {
    setError(null);
    try {
      const split = await createSplit.mutateAsync({ name });
      setShowCreateSplit(false);
      router.push(`/gym?edit=${split.id}`);
    } catch (e) {
      const msg = (e as Error).message || 'Failed to create split';
      setError(msg);
      throw e;
    }
  }, [createSplit, router]);

  const handleArchiveSplit = useCallback(async (split: Split) => {
    await updateSplit.mutateAsync({ id: split.id, archived: true });
  }, [updateSplit]);

  const handleRestoreSplit = useCallback(async (split: Split) => {
    await updateSplit.mutateAsync({ id: split.id, archived: false });
  }, [updateSplit]);

  const handleStartWorkout = useCallback(async (dayId: string) => {
    const session = await startWorkout.mutateAsync({ dayId });
    router.push(`/gym/session/${session.id}`);
  }, [startWorkout, router]);

  const handleResumeWorkout = useCallback(() => {
    if (activeSession) {
      router.push(`/gym/session/${activeSession.id}`);
    }
  }, [activeSession, router]);

  if (splitsLoading) {
    return (
        <div className="px-5 pt-14 pb-24">
          <div className="h-8 w-32 rounded bg-surface-card animate-pulse mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[80px] rounded-2xl bg-surface-card animate-pulse" />
            ))}
          </div>
        </div>
    );
  }

  return (
    <>
      <div className="px-5 pt-14 pb-24">
        <div className="flex items-center justify-between mb-0.5">
          <h1 className="text-[36px] font-[500] tracking-[-0.02em] text-text-primary leading-tight">
            Gym
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/gym/history')}
              className="text-[15px] text-accent font-[500] active:opacity-50 transition-opacity"
            >
              History
            </button>
          </div>
        </div>
        <p className="text-[15px] text-text-secondary mb-5">
          {activeSplit ? activeSplit.name : 'No active split'}
        </p>

        {/* Error banner */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="py-3 px-4 rounded-[10px] bg-red-500/10 border border-red-500/20 flex items-center justify-between">
                <p className="text-[13px] text-red-400">{error}</p>
                <button onClick={() => setError(null)} className="text-red-400 ml-2">
                  <span className="text-[18px]">×</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {activeSession && (
          <motion.button
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={handleResumeWorkout}
            className="w-full mb-4 py-3 rounded-[14px] bg-accent/10 border border-accent/30 flex items-center justify-center gap-2 active:opacity-70 transition-opacity"
          >
            <Play size={16} className="text-accent" fill="currentColor" />
            <span className="text-[15px] font-semibold text-accent">Resume Active Workout</span>
          </motion.button>
        )}

        {!activeSplit ? (
          <EmptyState
            icon={<Dumbbell size={28} className="text-accent" />}
            title="No active split"
            description="Create a training split to organize your workouts."
            action={{ label: 'Create Split', onClick: () => setShowCreateSplit(true) }}
          />
        ) : (
          <SplitView
            split={activeSplit}
            onStartWorkout={handleStartWorkout}
            onEditDay={setSelectedDayId}
            onArchive={() => handleArchiveSplit(activeSplit)}
          />
        )}

        {/* Archived Splits */}
        {archivedSplits.length > 0 && (
          <div className="mt-8">
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="flex items-center gap-2 text-[15px] text-text-secondary font-medium mb-3"
            >
              <Archive size={16} />
              <span>Archived ({archivedSplits.length})</span>
              <ChevronRight
                size={16}
                className={`transition-transform ${showArchived ? 'rotate-90' : ''}`}
              />
            </button>
            <AnimatePresence>
              {showArchived && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-2 overflow-hidden"
                >
                  {archivedSplits.map((split) => (
                    <div
                      key={split.id}
                      className="flex items-center justify-between py-3 px-3 rounded-[10px] bg-elevated"
                    >
                      <span className="text-[15px] text-text-primary">{split.name}</span>
                      <button
                        onClick={() => handleRestoreSplit(split)}
                        className="text-[13px] text-accent font-medium active:opacity-50 transition-opacity"
                      >
                        Restore
                      </button>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Create Split Button */}
      <button
        onClick={() => setShowCreateSplit(true)}
        className="fixed bottom-24 right-6 w-[56px] h-[56px] rounded-full bg-accent flex items-center justify-center active:opacity-70 transition-opacity shadow-lg z-40"
      >
        <Plus size={24} className="text-white" />
      </button>

      {/* Create Split Modal */}
      <AnimatePresence>
        {showCreateSplit && (
          <CreateSplitForm
            onClose={() => setShowCreateSplit(false)}
            onSubmit={handleCreateSplit}
          />
        )}
      </AnimatePresence>

      {/* Day Editor */}
      <AnimatePresence>
        {selectedDayId && (
          <DayEditor
            key={selectedDayId}
            dayId={selectedDayId}
            onClose={() => setSelectedDayId(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function SplitView({
  split,
  onStartWorkout,
  onEditDay,
  onArchive,
}: {
  split: Split;
  onStartWorkout: (dayId: string) => void;
  onEditDay: (dayId: string) => void;
  onArchive: () => void;
}) {
  const { data: days, isLoading: daysLoading } = useSplitDays(split.id);
  const createDay = useCreateSplitDay();
  const deleteDay = useDeleteSplitDay();
  const [showAddDay, setShowAddDay] = useState(false);
  const [newDayName, setNewDayName] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  const handleAddDay = useCallback(async () => {
    if (!newDayName.trim()) return;
    const order = days?.length ?? 0;
    const newDay = await createDay.mutateAsync({
      split_id: split.id,
      name: newDayName.trim(),
      display_order: order,
    });
    setNewDayName('');
    setShowAddDay(false);
    onEditDay(newDay.id);
  }, [newDayName, days?.length, split.id, createDay, onEditDay]);

  const handleDeleteDay = useCallback(async (day: SplitDay) => {
    await deleteDay.mutateAsync({ id: day.id, split_id: split.id });
  }, [split.id, deleteDay]);

  if (daysLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[80px] rounded-2xl bg-surface-card animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Split Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[20px] font-[500] text-text-primary">{split.name}</h2>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-8 h-8 rounded-full flex items-center justify-center active:bg-surface-cardHover transition-colors"
          >
            <MoreHorizontal size={18} className="text-text-secondary" />
          </button>
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute right-0 top-10 bg-card rounded-[12px] border border-surface-border shadow-lg z-50 min-w-[160px] overflow-hidden"
              >
                <button
                  onClick={() => { onArchive(); setShowMenu(false); }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-[15px] text-text-primary active:bg-surface-cardHover transition-colors"
                >
                  <Archive size={16} />
                  Archive Split
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Days */}
      <div className="space-y-2">
        {days?.map((day, index) => (
          <DayCard
            key={day.id}
            day={day}
            index={index}
            onStart={() => onStartWorkout(day.id)}
            onEdit={() => onEditDay(day.id)}
            onDelete={() => handleDeleteDay(day)}
          />
        ))}
      </div>

      {/* Add Day */}
      {showAddDay ? (
        <div className="mt-3 flex gap-2">
          <input
            autoFocus
            value={newDayName}
            onChange={(e) => setNewDayName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddDay(); if (e.key === 'Escape') setShowAddDay(false); }}
            placeholder="Day name (e.g., Push Day)"
            className="flex-1 bg-elevated rounded-[10px] px-3.5 py-2.5 text-[15px] text-text-primary placeholder:text-text-secondary/50 outline-none border border-border focus:border-accent transition-colors"
          />
          <button
            onClick={handleAddDay}
            disabled={!newDayName.trim()}
            className="px-4 py-2.5 rounded-[10px] bg-accent text-white text-[15px] font-medium active:opacity-70 transition-opacity disabled:opacity-40"
          >
            Add
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowAddDay(true)}
          className="w-full mt-3 py-3 rounded-[10px] border border-dashed border-surface-border text-[15px] text-text-secondary font-medium active:opacity-50 transition-opacity"
        >
          + Add Day
        </button>
      )}
    </div>
  );
}

function DayCard({
  day,
  index,
  onStart,
  onEdit,
  onDelete,
}: {
  day: SplitDay;
  index: number;
  onStart: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { data: exercises } = useSplitDayExercises(day.id);
  const exerciseCount = exercises?.length ?? 0;

  return (
    <motion.div
      layout
      className="rounded-2xl bg-surface-card border border-surface-border overflow-hidden"
    >
      <div className="flex items-center gap-3 p-4">
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
          <Dumbbell size={18} className="text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-medium text-text-primary">{day.name}</p>
          <p className="text-[13px] text-text-secondary">
            {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onStart}
            className="w-9 h-9 rounded-full bg-accent flex items-center justify-center active:opacity-70 transition-opacity"
          >
            <Play size={16} className="text-white ml-0.5" fill="currentColor" />
          </button>
          <button
            onClick={onEdit}
            className="w-9 h-9 rounded-full flex items-center justify-center active:bg-surface-cardHover transition-colors"
          >
            <Pencil size={14} className="text-text-secondary" />
          </button>
          <button
            onClick={onDelete}
            className="w-9 h-9 rounded-full flex items-center justify-center active:bg-destructive/10 transition-colors"
          >
            <Trash2 size={14} className="text-destructive/60" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function DayEditor({
  dayId,
  onClose,
}: {
  dayId: string;
  onClose: () => void;
}) {
  const { data: exercises } = useSplitDayExercises(dayId);
  const addExercise = useAddSplitDayExercise();
  const updateExercise = useUpdateSplitDayExercise();
  const removeExercise = useRemoveSplitDayExercise();
  const [showPicker, setShowPicker] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({
    target_sets: 3,
    target_reps_min: 8,
    target_reps_max: 12,
    rest_seconds: 90,
  });

  const handleAddExercise = useCallback(async (exerciseId: string) => {
    setEditError(null);
    setShowPicker(false);
    try {
      const order = exercises?.length ?? 0;
      await addExercise.mutateAsync({
        day_id: dayId,
        exercise_id: exerciseId,
        display_order: order,
      });
    } catch (e) {
      setEditError((e as Error).message || 'Failed to add exercise');
    }
  }, [dayId, exercises?.length, addExercise]);

  const handleRemoveExercise = useCallback(async (id: string) => {
    setEditError(null);
    try {
      await removeExercise.mutateAsync({ id, day_id: dayId });
    } catch (e) {
      setEditError((e as Error).message || 'Failed to remove exercise');
    }
  }, [dayId, removeExercise]);

  const startEditing = useCallback((de: SplitDayExercise) => {
    setEditingId(de.id);
    setEditError(null);
    setEditValues({
      target_sets: de.target_sets,
      target_reps_min: de.target_reps_min,
      target_reps_max: de.target_reps_max,
      rest_seconds: de.rest_seconds,
    });
  }, []);

  const saveEditing = useCallback(async () => {
    if (!editingId) return;
    setEditError(null);
    try {
      await updateExercise.mutateAsync({ id: editingId, day_id: dayId, ...editValues });
      setEditingId(null);
    } catch (e) {
      setEditError((e as Error).message || 'Failed to save');
    }
  }, [editingId, dayId, editValues, updateExercise]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-[100]"
        onClick={onClose}
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-[101] mx-auto max-w-lg"
      >
        <div className="bg-card rounded-t-2xl max-h-[85vh] overflow-y-auto">
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-surface-border" />
          </div>
          <div className="px-6 pb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-text-primary">Exercises</h2>
              <button onClick={onClose} className="text-[15px] text-accent font-[500]">Done</button>
            </div>

            {editError && (
              <div className="mb-3 py-2 px-3 rounded-[10px] bg-red-500/10 border border-red-500/20">
                <p className="text-[13px] text-red-400">{editError}</p>
              </div>
            )}

            <div className="space-y-2 mb-4">
              {exercises?.map((de) => (
                <div
                  key={de.id}
                  className="rounded-[10px] bg-elevated overflow-hidden"
                >
                  <div className="flex items-center justify-between py-3 px-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] text-text-primary font-medium">{de.exercise.name}</p>
                      {editingId !== de.id && (
                        <p className="text-[13px] text-text-secondary">
                          {de.target_sets} x {de.target_reps_min}-{de.target_reps_max} reps
                          {de.rest_seconds > 0 && ` · ${de.rest_seconds}s rest`}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {editingId === de.id ? (
                        <>
                          <button
                            onClick={saveEditing}
                            disabled={updateExercise.isPending}
                            className="text-[13px] text-accent font-medium active:opacity-50 transition-opacity"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-[13px] text-text-secondary font-medium active:opacity-50 transition-opacity"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEditing(de)}
                            className="text-[13px] text-accent font-medium active:opacity-50 transition-opacity"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleRemoveExercise(de.id)}
                            className="text-[13px] text-destructive font-medium active:opacity-50 transition-opacity"
                          >
                            Remove
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {editingId === de.id && (
                    <div className="px-3 pb-3 pt-1 border-t border-surface-border">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] text-muted uppercase tracking-wide block mb-1">Sets</label>
                          <input
                            type="number"
                            inputMode="numeric"
                            min={1}
                            max={20}
                            value={editValues.target_sets}
                            onChange={(e) => setEditValues((v) => ({ ...v, target_sets: parseInt(e.target.value) || 3 }))}
                            className="w-full bg-card rounded-[8px] px-3 py-2 text-[15px] text-text-primary text-center outline-none border border-border focus:border-accent transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-muted uppercase tracking-wide block mb-1">Rest (s)</label>
                          <input
                            type="number"
                            inputMode="numeric"
                            min={0}
                            max={600}
                            value={editValues.rest_seconds}
                            onChange={(e) => setEditValues((v) => ({ ...v, rest_seconds: parseInt(e.target.value) || 0 }))}
                            className="w-full bg-card rounded-[8px] px-3 py-2 text-[15px] text-text-primary text-center outline-none border border-border focus:border-accent transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-muted uppercase tracking-wide block mb-1">Min Reps</label>
                          <input
                            type="number"
                            inputMode="numeric"
                            min={1}
                            max={100}
                            value={editValues.target_reps_min}
                            onChange={(e) => setEditValues((v) => ({ ...v, target_reps_min: parseInt(e.target.value) || 8 }))}
                            className="w-full bg-card rounded-[8px] px-3 py-2 text-[15px] text-text-primary text-center outline-none border border-border focus:border-accent transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-muted uppercase tracking-wide block mb-1">Max Reps</label>
                          <input
                            type="number"
                            inputMode="numeric"
                            min={1}
                            max={100}
                            value={editValues.target_reps_max}
                            onChange={(e) => setEditValues((v) => ({ ...v, target_reps_max: parseInt(e.target.value) || 12 }))}
                            className="w-full bg-card rounded-[8px] px-3 py-2 text-[15px] text-text-primary text-center outline-none border border-border focus:border-accent transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowPicker(true)}
              disabled={addExercise.isPending}
              className="w-full py-3 rounded-[10px] border border-dashed border-surface-border text-[15px] text-text-secondary font-medium active:opacity-50 transition-opacity disabled:opacity-40"
            >
              {addExercise.isPending ? 'Adding...' : '+ Add Exercise'}
            </button>
          </div>
        </div>
      </motion.div>

      <ExercisePicker
        open={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={handleAddExercise}
        disabled={addExercise.isPending}
        excludeIds={exercises?.map((de) => de.exercise_id)}
      />
    </>
  );
}

function CreateSplitForm({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit(name.trim());
    } catch (e) {
      setError((e as Error).message || 'Failed to create split');
    } finally {
      setSaving(false);
    }
  }, [name, onSubmit]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 z-[100]"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-x-5 top-1/2 -translate-y-1/2 z-[101] mx-auto max-w-lg"
      >
        <div className="bg-card rounded-2xl p-6">
          <h3 className="text-[20px] font-semibold text-text-primary text-center mb-4">
            New Split
          </h3>
          <input
            autoFocus
            value={name}
            onChange={(e) => { setName(e.target.value); setError(null); }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
            placeholder="Split name (e.g., Push Pull Legs)"
            className="w-full bg-elevated rounded-[10px] px-3.5 py-2.5 text-[15px] text-text-primary placeholder:text-text-secondary/50 outline-none border border-border focus:border-accent transition-colors mb-2"
          />
          {error && (
            <p className="text-[13px] text-red-400 mb-3">{error}</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-[10px] bg-elevated text-text-secondary text-sm font-medium active:opacity-70 transition-opacity"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!name.trim() || saving}
              className="flex-1 py-3 rounded-[10px] bg-accent text-white text-sm font-semibold active:opacity-70 transition-opacity disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
