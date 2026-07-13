'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import {
  useSessionWithSets,
  useCompleteSession,
  useCompleteGymHabit,
  useAddSet,
  useUpdateSet,
  useDeleteSet,
  useAddSessionExercise,
  useAllExerciseHistory,
  useSplitDayExercises,
} from '@/hooks/useGym';
import { ExercisePicker } from '@/components/ExercisePicker';
import {
  totalVolume,
  formatWeight,
  formatSetSummary,
  suggestProgressiveOverload,
  isPersonalRecord,
  compareSetPerformance,
  todayString,
} from '@/lib/workout';
import {
  ArrowLeft,
  Check,
  Plus,
  Trash2,
  Trophy,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  X,
} from 'lucide-react';
import type { WorkoutSet, Exercise, ExerciseHistory, WorkoutSessionExercise } from '@repo/db';

export default function WorkoutSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const { data, isLoading } = useSessionWithSets(sessionId);
  const { data: allHistory } = useAllExerciseHistory();
  const completeSession = useCompleteSession();
  const completeGymHabit = useCompleteGymHabit();
  const addSet = useAddSet();
  const updateSet = useUpdateSet();
  const deleteSet = useDeleteSet();
  const addSessionExercise = useAddSessionExercise();
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);

  const session = data?.session;
  const sets = useMemo(() => data?.sets ?? [], [data?.sets]);
  const sessionExercises = useMemo(() => data?.session_exercises ?? [], [data?.session_exercises]);
  const split = data?.split;
  const day = data?.day;

  const exerciseGroups = useMemo(() => {
    const map = new Map<string, {
      sessionExercise: WorkoutSessionExercise & { exercise: Exercise };
      sets: (WorkoutSet & { exercise: Exercise })[];
    }>();

    for (const se of sessionExercises) {
      map.set(se.exercise_id, {
        sessionExercise: se,
        sets: [],
      });
    }

    for (const s of sets) {
      const existing = map.get(s.exercise_id);
      if (existing) {
        existing.sets.push(s);
      } else {
        map.set(s.exercise_id, {
          sessionExercise: {
            id: `virtual-${s.exercise_id}`,
            session_id: sessionId,
            exercise_id: s.exercise_id,
            display_order: map.size,
            target_sets: 3,
            target_reps_min: 8,
            target_reps_max: 12,
            rest_seconds: 90,
            notes: '',
            created_at: new Date().toISOString(),
            user_id: '',
            exercise: s.exercise,
          },
          sets: [s],
        });
      }
    }

    return Array.from(map.values());
  }, [sessionExercises, sets, sessionId]);

  const getExerciseHistory = useCallback(
    (exerciseId: string): ExerciseHistory[] => {
      return (allHistory ?? []).filter((h) => h.exercise_id === exerciseId);
    },
    [allHistory],
  );

  const handleAddSet = useCallback(
    async (exerciseId: string) => {
      if (!sessionId) return;
      const exerciseSets = sets.filter((s) => s.exercise_id === exerciseId);
      const nextNumber = exerciseSets.length + 1;

      const lastSet = exerciseSets[exerciseSets.length - 1];
      const suggestion = suggestProgressiveOverload(allHistory ?? [], exerciseId);

      await addSet.mutateAsync({
        session_id: sessionId,
        exercise_id: exerciseId,
        set_number: nextNumber,
        weight: lastSet?.weight ?? suggestion?.suggested_weight ?? 0,
        reps: lastSet?.reps ?? suggestion?.suggested_reps ?? 0,
      });
    },
    [sessionId, sets, allHistory, addSet],
  );

  const handleAutoAddSet = useCallback(
    async (exerciseId: string) => {
      if (!sessionId) return;
      const exerciseSets = sets.filter((s) => s.exercise_id === exerciseId);
      const lastSet = exerciseSets[exerciseSets.length - 1];
      if (!lastSet || lastSet.weight === 0 || lastSet.reps === 0) return;
      const nextNumber = exerciseSets.length + 1;
      await addSet.mutateAsync({
        session_id: sessionId,
        exercise_id: exerciseId,
        set_number: nextNumber,
        weight: lastSet.weight,
        reps: lastSet.reps,
      });
    },
    [sessionId, sets, addSet],
  );

  const handleUpdateWeight = useCallback(
    async (setId: string, weight: number) => {
      await updateSet.mutateAsync({ id: setId, weight });
    },
    [updateSet],
  );

  const handleUpdateReps = useCallback(
    async (setId: string, reps: number) => {
      await updateSet.mutateAsync({ id: setId, reps });
    },
    [updateSet],
  );

  const handleDeleteSet = useCallback(
    async (setId: string) => {
      await deleteSet.mutateAsync(setId);
    },
    [deleteSet],
  );

  const handleComplete = useCallback(async () => {
    if (!session) return;
    await completeSession.mutateAsync({ id: session.id });
    await completeGymHabit.mutateAsync(todayString());
    router.push('/gym');
  }, [session, completeSession, completeGymHabit, router]);

  const handleAddExercise = useCallback(
    async (exerciseId: string) => {
      if (!sessionId) return;
      await addSessionExercise.mutateAsync({
        session_id: sessionId,
        exercise_id: exerciseId,
        display_order: sessionExercises.length,
      });
      setShowExercisePicker(false);
    },
    [sessionId, sessionExercises.length, addSessionExercise],
  );

  const totalVol = useMemo(() => totalVolume(sets as WorkoutSet[]), [sets]);
  const completedSets = useMemo(() => sets.filter((s) => !s.is_warmup).length, [sets]);

  if (isLoading) {
    return (
        <div className="px-5 pt-14 pb-24">
          <div className="h-8 w-32 rounded bg-surface-card animate-pulse mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[120px] rounded-2xl bg-surface-card animate-pulse" />
            ))}
          </div>
        </div>
    );
  }

  if (!session || session.completed_at) {
    return (
        <div className="px-5 pt-14 pb-24 text-center">
          <p className="text-text-secondary">Session not found or already completed.</p>
          <button
            onClick={() => router.push('/gym')}
            className="mt-4 text-accent text-[15px] font-[500]"
          >
            Back to Gym
          </button>
        </div>
    );
  }

  const hasSets = completedSets > 0;
  const hasIncomplete = exerciseGroups.some((g) => {
    const done = sets.filter((s) => s.exercise_id === g.sessionExercise.exercise_id && !s.is_warmup).length;
    return done < g.sessionExercise.target_sets;
  });

  return (
    <>
      <div className="px-5 pt-14 pb-28">
        {/* Header */}
        <div className="flex items-center gap-3 mb-1">
          <button onClick={() => router.push('/gym')} className="active:opacity-50 transition-opacity">
            <ArrowLeft size={22} className="text-text-primary" />
          </button>
          <div className="flex-1">
            <h1 className="text-[24px] font-[500] tracking-[-0.02em] text-text-primary">
              Workout
            </h1>
          </div>
        </div>

        {/* Context */}
        {day && (
          <p className="text-[13px] text-text-secondary mb-1 ml-[34px]">
            {split?.name ? `${split.name} · ` : ''}{day.name}
          </p>
        )}

        {/* Stats bar */}
        <div className="flex gap-3 mb-5 mt-3">
          <div className="flex-1 py-2.5 px-3 rounded-[10px] bg-surface-card text-center">
            <p className="text-[11px] text-muted uppercase tracking-wide">Volume</p>
            <p className="text-[17px] font-semibold text-text-primary tabular-nums">
              {totalVol >= 1000 ? `${(totalVol / 1000).toFixed(1)}k` : totalVol}
            </p>
          </div>
          <div className="flex-1 py-2.5 px-3 rounded-[10px] bg-surface-card text-center">
            <p className="text-[11px] text-muted uppercase tracking-wide">Sets</p>
            <p className="text-[17px] font-semibold text-text-primary tabular-nums">
              {completedSets}
            </p>
          </div>
          <div className="flex-1 py-2.5 px-3 rounded-[10px] bg-surface-card text-center">
            <p className="text-[11px] text-muted uppercase tracking-wide">Exercises</p>
            <p className="text-[17px] font-semibold text-text-primary tabular-nums">
              {exerciseGroups.length}
            </p>
          </div>
        </div>

        {/* Exercise Cards */}
        <div className="space-y-4">
          {exerciseGroups.map((group) => {
            const doneCount = sets.filter(
              (s) => s.exercise_id === group.sessionExercise.exercise_id && !s.is_warmup,
            ).length;
            const isComplete = doneCount >= group.sessionExercise.target_sets;

            return (
              <WorkoutExerciseCard
                key={group.sessionExercise.exercise_id}
                exercise={group.sessionExercise.exercise}
                sessionExercise={group.sessionExercise}
                sets={group.sets}
                history={getExerciseHistory(group.sessionExercise.exercise_id)}
                isComplete={isComplete}
                onAddSet={() => handleAddSet(group.sessionExercise.exercise_id)}
                onAutoAddSet={() => handleAutoAddSet(group.sessionExercise.exercise_id)}
                onUpdateWeight={handleUpdateWeight}
                onUpdateReps={handleUpdateReps}
                onDeleteSet={handleDeleteSet}
              />
            );
          })}
        </div>

        <button
          onClick={() => setShowExercisePicker(true)}
          className="w-full mt-4 py-3 rounded-[10px] border border-dashed border-surface-border text-[15px] text-text-secondary font-medium active:opacity-50 transition-opacity"
        >
          + Add Exercise
        </button>
      </div>

      {/* Slide-to-Finish */}
      <div className="fixed bottom-16 left-0 right-0 px-5 z-40">
        <SlideToFinish
          onComplete={() => setShowCompleteConfirm(true)}
          disabled={!hasSets}
        />
      </div>

      {/* Complete Confirm */}
      <AnimatePresence>
        {showCompleteConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-[100]"
              onClick={() => setShowCompleteConfirm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-x-5 top-1/2 -translate-y-1/2 z-[101] mx-auto max-w-lg"
            >
              <div className="bg-card rounded-2xl p-6">
                <h3 className="text-[20px] font-semibold text-text-primary text-center mb-2">
                  Finish Workout?
                </h3>
                <p className="text-[15px] text-text-secondary text-center mb-1">
                  {exerciseGroups.length} exercises, {completedSets} working sets
                </p>
                {hasIncomplete && (
                  <p className="text-[13px] text-accent text-center mb-4">
                    Incomplete exercises will be marked as Skipped
                  </p>
                )}
                {!hasIncomplete && (
                  <div className="mb-4" />
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCompleteConfirm(false)}
                    className="flex-1 py-3 rounded-[10px] bg-elevated text-text-secondary text-sm font-medium active:opacity-70 transition-opacity"
                  >
                    Keep Going
                  </button>
                  <button
                    onClick={handleComplete}
                    disabled={completeSession.isPending}
                    className="flex-1 py-3 rounded-[10px] bg-accent text-white text-sm font-semibold active:opacity-70 transition-opacity disabled:opacity-50"
                  >
                    {completeSession.isPending ? 'Saving...' : 'Finish'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ExercisePicker
        open={showExercisePicker}
        onClose={() => setShowExercisePicker(false)}
        onSelect={handleAddExercise}
      />
    </>
  );
}

// ── Slide to Finish ───────────────────────────────────────────

function SlideToFinish({
  onComplete,
  disabled,
}: {
  onComplete: () => void;
  disabled: boolean;
}) {
  const x = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [threshold, setThreshold] = useState(200);
  const [dragging, setDragging] = useState(false);

  const bg = useTransform(
    x,
    [0, threshold],
    ['rgba(255, 107, 74, 0.1)', 'rgba(255, 107, 74, 1)'],
  );
  const textOpacity = useTransform(x, [0, threshold * 0.3], [1, 0]);
  const checkScale = useTransform(x, [threshold * 0.5, threshold], [0.5, 1]);

  const handleDragEnd = useCallback(
    (_: never, info: PanInfo) => {
      setDragging(false);
      if (info.offset.x >= threshold) {
        onComplete();
      }
    },
    [threshold, onComplete],
  );

  return (
    <div
      ref={containerRef}
      className="relative h-[56px] rounded-[28px] overflow-hidden bg-surface-card border border-surface-border"
    >
      <motion.div
        className="absolute inset-0 rounded-[28px]"
        style={{ backgroundColor: bg }}
      />
      <motion.span
        className="absolute inset-0 flex items-center justify-center text-[15px] font-semibold text-text-secondary select-none pointer-events-none"
        style={{ opacity: textOpacity }}
      >
        {disabled ? 'Add sets to finish' : 'Slide to finish'}
      </motion.span>
      <motion.div
        className="absolute top-1 left-1 w-[48px] h-[48px] rounded-full bg-accent flex items-center justify-center cursor-grab active:cursor-grabbing z-10"
        drag="x"
        dragConstraints={{ left: 0, right: threshold }}
        dragElastic={0}
        onDragStart={() => setDragging(true)}
        onDragEnd={handleDragEnd}
        style={{ x }}
        whileTap={!disabled ? { scale: 1.05 } : undefined}
      >
        <motion.div style={{ scale: checkScale }}>
          <Check size={20} className="text-white" strokeWidth={2.5} />
        </motion.div>
      </motion.div>
    </div>
  );
}

// ── Exercise Card ─────────────────────────────────────────────

function WorkoutExerciseCard({
  exercise,
  sessionExercise,
  sets,
  history,
  isComplete,
  onAddSet,
  onAutoAddSet,
  onUpdateWeight,
  onUpdateReps,
  onDeleteSet,
}: {
  exercise: Exercise;
  sessionExercise: WorkoutSessionExercise & { exercise: Exercise };
  sets: (WorkoutSet & { exercise: Exercise })[];
  history: ExerciseHistory[];
  isComplete: boolean;
  onAddSet: () => void;
  onAutoAddSet: () => void;
  onUpdateWeight: (setId: string, weight: number) => void;
  onUpdateReps: (setId: string, reps: number) => void;
  onDeleteSet: (setId: string) => void;
}) {
  const pr = useMemo(() => {
    const working = history.filter((h) => !h.is_warmup && h.weight > 0 && h.reps > 0);
    if (working.length === 0) return null;
    return working.reduce((best, h) =>
      (h.estimated_1rm ?? 0) > (best.estimated_1rm ?? 0) ? h : best,
    );
  }, [history]);

  const lastWorkoutDate = useMemo(() => {
    const working = history.filter((h) => !h.is_warmup);
    if (working.length === 0) return null;
    return working[0].workout_date;
  }, [history]);

  return (
    <motion.div
      layout
      className={`rounded-2xl bg-surface-card border overflow-hidden transition-colors ${
        isComplete
          ? 'border-success/30 bg-success/5'
          : 'border-surface-border'
      }`}
    >
      {/* Exercise Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[17px] font-medium text-text-primary">{exercise.name}</p>
              {isComplete && (
                <div className="w-5 h-5 rounded-full bg-success/15 flex items-center justify-center">
                  <Check size={12} className="text-success" strokeWidth={3} />
                </div>
              )}
            </div>
            <p className="text-[13px] text-text-secondary">{exercise.primary_muscle}</p>
          </div>
        </div>

        {/* Target + Last */}
        <div className="flex items-center gap-3 mt-2">
          <span className="text-[12px] text-muted">
            {sets.filter((s) => !s.is_warmup).length}/{sessionExercise.target_sets} sets
          </span>
          {lastWorkoutDate && (
            <span className="text-[12px] text-text-secondary">
              Last: {lastWorkoutDate}
            </span>
          )}
          {pr && (
            <div className="flex items-center gap-1">
              <Trophy size={11} className="text-accent" />
              <span className="text-[11px] text-accent font-medium">PR</span>
            </div>
          )}
        </div>
      </div>

      {/* Sets */}
      {sets.length > 0 && (
        <div className="px-4 pb-1">
          <div className="grid grid-cols-[32px_1fr_1fr_24px] gap-2 py-1.5 text-[11px] text-muted uppercase tracking-wide">
            <span>#</span>
            <span>kg</span>
            <span>reps</span>
            <span></span>
          </div>
          {sets.map((set, index) => (
            <SetRow
              key={set.id}
              set={set}
              history={history}
              exerciseId={exercise.id}
              isLast={index === sets.length - 1}
              onUpdateWeight={(w) => onUpdateWeight(set.id, w)}
              onUpdateReps={(r) => onUpdateReps(set.id, r)}
              onDelete={() => onDeleteSet(set.id)}
              onAutoAdd={onAutoAddSet}
            />
          ))}
        </div>
      )}

      {/* Add Set Button */}
      <button
        onClick={onAddSet}
        className="w-full py-3 flex items-center justify-center gap-1.5 text-[14px] font-medium text-text-secondary border-t border-surface-border active:bg-surface-elevated transition-colors"
      >
        <Plus size={16} />
        Add Set
      </button>
    </motion.div>
  );
}

// ── Set Row ───────────────────────────────────────────────────

function SetRow({
  set,
  history,
  exerciseId,
  isLast,
  onUpdateWeight,
  onUpdateReps,
  onDelete,
  onAutoAdd,
}: {
  set: WorkoutSet & { exercise: Exercise };
  history: ExerciseHistory[];
  exerciseId: string;
  isLast: boolean;
  onUpdateWeight: (weight: number) => void;
  onUpdateReps: (reps: number) => void;
  onDelete: () => void;
  onAutoAdd?: () => void;
}) {
  const [localWeight, setLocalWeight] = useState(set.weight.toString());
  const [localReps, setLocalReps] = useState(set.reps.toString());
  const [showPerf, setShowPerf] = useState(false);
  const weightRef = useRef<HTMLInputElement>(null);
  const repsRef = useRef<HTMLInputElement>(null);
  const autoAddTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const perf = useMemo(
    () => compareSetPerformance(set.weight, set.reps, history, exerciseId),
    [set.weight, set.reps, history, exerciseId],
  );

  const recentWeights = useMemo(() => {
    const working = history
      .filter((h) => !h.is_warmup && h.weight > 0)
      .sort((a, b) => b.workout_date.localeCompare(a.workout_date));
    const unique = [...new Set(working.map((h) => h.weight))];
    return unique.slice(0, 4);
  }, [history]);

  const handleCommitWeight = useCallback(
    (value: string) => {
      const val = parseFloat(value) || 0;
      if (val !== set.weight) onUpdateWeight(val);
    },
    [set.weight, onUpdateWeight],
  );

  const handleCommitReps = useCallback(
    (value: string) => {
      const val = parseInt(value, 10) || 0;
      if (val !== set.reps) onUpdateReps(val);
    },
    [set.reps, onUpdateReps],
  );

  const triggerAutoAdd = useCallback(() => {
    if (!isLast || !onAutoAdd) return;
    if (autoAddTimerRef.current) clearTimeout(autoAddTimerRef.current);
    autoAddTimerRef.current = setTimeout(() => {
      onAutoAdd();
    }, 500);
  }, [isLast, onAutoAdd]);

  const handleBlurWeight = useCallback(() => {
    handleCommitWeight(localWeight);
  }, [localWeight, handleCommitWeight]);

  const handleBlurReps = useCallback(() => {
    handleCommitReps(localReps);
  }, [localReps, handleCommitReps]);

  const handleKeyDownWeight = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleCommitWeight(localWeight);
        repsRef.current?.focus();
      }
    },
    [localWeight, handleCommitWeight],
  );

  const handleKeyDownReps = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleCommitReps(localReps);
        triggerAutoAdd();
      }
    },
    [localReps, handleCommitReps, triggerAutoAdd],
  );

  const applyWeight = useCallback(
    (val: number) => {
      setLocalWeight(val.toString());
      onUpdateWeight(val);
      triggerAutoAdd();
    },
    [onUpdateWeight, triggerAutoAdd],
  );

  const applyReps = useCallback(
    (val: number) => {
      setLocalReps(val.toString());
      onUpdateReps(val);
      triggerAutoAdd();
    },
    [onUpdateReps, triggerAutoAdd],
  );

  const adjustWeight = useCallback(
    (delta: number) => {
      const current = parseFloat(localWeight) || 0;
      const next = Math.max(0, Math.round((current + delta) * 10) / 10);
      setLocalWeight(next.toString());
      onUpdateWeight(next);
      triggerAutoAdd();
    },
    [localWeight, onUpdateWeight, triggerAutoAdd],
  );

  const adjustReps = useCallback(
    (delta: number) => {
      const current = parseInt(localReps, 10) || 0;
      const next = Math.max(0, current + delta);
      setLocalReps(next.toString());
      onUpdateReps(next);
      triggerAutoAdd();
    },
    [localReps, onUpdateReps, triggerAutoAdd],
  );

  const perfColor =
    perf.type === 'improved'
      ? 'text-success'
      : perf.type === 'declined'
        ? 'text-red-400'
        : perf.type === 'first'
          ? 'text-accent'
          : 'text-text-secondary';

  const PerfIcon =
    perf.type === 'improved'
      ? ArrowUpRight
      : perf.type === 'declined'
        ? ArrowDownRight
        : perf.type === 'first'
          ? Trophy
          : Minus;

  return (
    <div className="mb-3">
      {/* Main row: #, weight, reps, delete */}
      <div className="grid grid-cols-[32px_1fr_1fr_24px] gap-2 items-center">
        <span className="text-[13px] text-text-secondary font-medium tabular-nums text-center">
          {set.set_number}
        </span>
        <input
          ref={weightRef}
          type="number"
          inputMode="decimal"
          value={localWeight}
          onChange={(e) => setLocalWeight(e.target.value)}
          onBlur={handleBlurWeight}
          onKeyDown={handleKeyDownWeight}
          className="w-full bg-elevated rounded-[8px] px-2.5 py-2 text-[15px] text-text-primary text-center outline-none border border-border focus:border-accent transition-colors tabular-nums"
          placeholder="0"
        />
        <input
          ref={repsRef}
          type="number"
          inputMode="numeric"
          value={localReps}
          onChange={(e) => setLocalReps(e.target.value)}
          onBlur={handleBlurReps}
          onKeyDown={handleKeyDownReps}
          className="w-full bg-elevated rounded-[8px] px-2.5 py-2 text-[15px] text-text-primary text-center outline-none border border-border focus:border-accent transition-colors tabular-nums"
          placeholder="0"
        />
        <button
          onClick={onDelete}
          className="w-6 h-6 rounded-full flex items-center justify-center active:bg-destructive/10 transition-colors mx-auto"
        >
          <Trash2 size={12} className="text-destructive/50" />
        </button>
      </div>

      {/* Quick-add chips row */}
      <div className="flex items-center gap-1 mt-1.5 px-[32px]">
        {/* Weight chips */}
        {recentWeights.length > 0 && (
          <div className="flex items-center gap-1 flex-1 min-w-0">
            {recentWeights.map((w) => (
              <button
                key={w}
                onClick={() => applyWeight(w)}
                className="px-2 py-0.5 rounded-full bg-accent/10 text-[10px] font-medium text-accent tabular-nums active:opacity-60 transition-opacity shrink-0"
              >
                {formatWeight(w)}
              </button>
            ))}
          </div>
        )}

        {/* Weight adjusters */}
        <div className="flex items-center gap-0.5 shrink-0">
          {[-2.5, -1.5, 1.5, 2.5, 5].map((delta) => (
            <button
              key={delta}
              onClick={() => adjustWeight(delta)}
              className="w-7 h-6 rounded bg-elevated text-[10px] font-medium text-text-secondary tabular-nums active:bg-surface-cardHover transition-colors"
            >
              {delta > 0 ? '+' : ''}{delta}
            </button>
          ))}
        </div>
      </div>

      {/* Reps chips row */}
      <div className="flex items-center gap-1 mt-1 px-[32px]">
        {/* Reps chips */}
        <div className="flex items-center gap-1 flex-1">
          {[6, 8, 10, 12, 15].map((r) => (
            <button
              key={r}
              onClick={() => applyReps(r)}
              className="px-2 py-0.5 rounded-full bg-surface-card text-[10px] font-medium text-text-secondary tabular-nums active:bg-surface-cardHover transition-colors shrink-0"
            >
              {r}
            </button>
          ))}
        </div>

        {/* Reps adjusters */}
        <div className="flex items-center gap-0.5 shrink-0">
          {[-1, 1, 2].map((delta) => (
            <button
              key={delta}
              onClick={() => adjustReps(delta)}
              className="w-7 h-6 rounded bg-elevated text-[10px] font-medium text-text-secondary tabular-nums active:bg-surface-cardHover transition-colors"
            >
              {delta > 0 ? '+' : ''}{delta}
            </button>
          ))}
        </div>
      </div>

      {/* Performance Feedback */}
      {perf.type !== 'first' && set.weight > 0 && set.reps > 0 && (
        <button
          onClick={() => setShowPerf(!showPerf)}
          className="w-full flex items-center gap-1 mt-1 px-1"
        >
          <PerfIcon size={11} className={perfColor} />
          <span className={`text-[11px] font-medium ${perfColor}`}>
            {perf.isPR ? 'PR!' : perf.message}
          </span>
        </button>
      )}
      {perf.type === 'first' && set.weight > 0 && set.reps > 0 && (
        <div className="flex items-center gap-1 mt-1 px-1">
          <Trophy size={11} className="text-accent" />
          <span className="text-[11px] font-medium text-accent">First time</span>
        </div>
      )}
    </div>
  );
}
