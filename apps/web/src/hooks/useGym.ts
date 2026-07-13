'use client';

import { useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useUserId } from '@/hooks/useAuth';
import type {
  Exercise,
  WorkoutSession,
  WorkoutSet,
  WorkoutSessionExercise,
  ExerciseHistory,
  Split,
  SplitDay,
  SplitDayExercise,
  CreateSplitInput,
  UpdateSplitInput,
  CreateSplitDayInput,
  UpdateSplitDayInput,
  CreateSplitDayExerciseInput,
  UpdateSplitDayExerciseInput,
} from '@repo/db';

// ── Exercises ────────────────────────────────────────────────

export function useExercises() {
  const userId = useUserId();
  return useQuery({
    queryKey: ['exercises', userId],
    enabled: !!userId,
    queryFn: async (): Promise<Exercise[]> => {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .or(`user_id.is.null,user_id.eq.${userId}`)
        .order('name', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateExercise() {
  const queryClient = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: async (input: { name: string; primary_muscle: string; secondary_muscles?: string[]; category?: string }) => {
      if (!userId) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('exercises')
        .insert([{
          name: input.name,
          primary_muscle: input.primary_muscle,
          secondary_muscles: input.secondary_muscles ?? [],
          category: input.category ?? 'other',
          is_custom: true,
          user_id: userId,
        }])
        .select()
        .single();
      if (error) throw error;
      return data as Exercise;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
    },
  });
}

// ── Muscle Groups ────────────────────────────────────────────

export function useMuscleGroups() {
  return useQuery({
    queryKey: ['muscle-groups'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('muscle_groups')
        .select('*')
        .order('name', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

// ── Splits ───────────────────────────────────────────────────

export function useSplits() {
  const userId = useUserId();
  return useQuery({
    queryKey: ['splits', userId],
    enabled: !!userId,
    queryFn: async (): Promise<Split[]> => {
      const { data, error } = await supabase
        .from('splits')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useActiveSplit() {
  const userId = useUserId();
  return useQuery({
    queryKey: ['active-split', userId],
    enabled: !!userId,
    queryFn: async (): Promise<Split | null> => {
      const { data, error } = await supabase
        .from('splits')
        .select('*')
        .eq('user_id', userId)
        .eq('archived', false)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as Split | null;
    },
  });
}

export function useCreateSplit() {
  const queryClient = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: async (input: CreateSplitInput) => {
      if (!userId) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('splits')
        .insert([{ name: input.name }])
        .select()
        .single();
      if (error) throw error;
      return data as Split;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['splits'] });
      queryClient.invalidateQueries({ queryKey: ['active-split'] });
    },
  });
}

export function useUpdateSplit() {
  const queryClient = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateSplitInput & { id: string }) => {
      if (!userId) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('splits')
        .update(input)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw error;
      return data as Split;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['splits'] });
      queryClient.invalidateQueries({ queryKey: ['active-split'] });
    },
  });
}

export function useDeleteSplit() {
  const queryClient = useQueryClient();
  const userId = useUserId();
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const performRealDelete = useCallback(async (id: string) => {
    if (!userId) return;
    const { error } = await supabase
      .from('splits')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) return;
    queryClient.invalidateQueries({ queryKey: ['splits'] });
    queryClient.invalidateQueries({ queryKey: ['active-split'] });
    queryClient.invalidateQueries({ queryKey: ['split-days'] });
    queryClient.invalidateQueries({ queryKey: ['split-day-exercises'] });
  }, [userId, queryClient]);

  const deleteSplit = useCallback(
    (split: Split) => {
      const key = split.id;
      queryClient.setQueryData<Split[]>(['splits', userId], (old) =>
        old ? old.filter((s) => s.id !== key) : [],
      );
      const timer = setTimeout(() => {
        timersRef.current.delete(key);
        performRealDelete(key);
      }, 5000);
      timersRef.current.set(key, timer);
    },
    [queryClient, userId, performRealDelete],
  );

  const undoDelete = useCallback(
    (split: Split) => {
      const key = split.id;
      const timer = timersRef.current.get(key);
      if (timer) {
        clearTimeout(timer);
        timersRef.current.delete(key);
      }
      queryClient.setQueryData<Split[]>(['splits', userId], (old) => {
        if (!old) return [split];
        if (old.some((s) => s.id === key)) return old;
        return [...old, split].sort((a, b) => a.created_at.localeCompare(b.created_at));
      });
    },
    [queryClient, userId],
  );

  return { deleteSplit, undoDelete };
}

// ── Split Days ───────────────────────────────────────────────

export function useSplitDays(splitId: string | null) {
  const userId = useUserId();
  return useQuery({
    queryKey: ['split-days', splitId, userId],
    enabled: !!userId && !!splitId,
    queryFn: async (): Promise<SplitDay[]> => {
      const { data, error } = await supabase
        .from('split_days')
        .select('*')
        .eq('split_id', splitId!)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return (data ?? []) as SplitDay[];
    },
  });
}

export function useCreateSplitDay() {
  const queryClient = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: async (input: CreateSplitDayInput) => {
      if (!userId) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('split_days')
        .insert([{
          split_id: input.split_id,
          name: input.name,
          display_order: input.display_order ?? 0,
        }])
        .select()
        .single();
      if (error) throw error;
      return data as SplitDay;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['split-days', variables.split_id] });
    },
  });
}

export function useUpdateSplitDay() {
  const queryClient = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: async ({ id, ...input }: UpdateSplitDayInput & { id: string; split_id: string }) => {
      if (!userId) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('split_days')
        .update(input)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw error;
      return data as SplitDay;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['split-days', variables.split_id] });
    },
  });
}

export function useDeleteSplitDay() {
  const queryClient = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: async ({ id, split_id }: { id: string; split_id: string }) => {
      if (!userId) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('split_days')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      if (error) throw error;
      return split_id;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['split-days', variables.split_id] });
    },
  });
}

// ── Split Day Exercises ──────────────────────────────────────

export function useSplitDayExercises(dayId: string | null) {
  const userId = useUserId();
  return useQuery({
    queryKey: ['split-day-exercises', dayId, userId],
    enabled: !!userId && !!dayId,
    queryFn: async (): Promise<(SplitDayExercise & { exercise: Exercise })[]> => {
      const { data, error } = await supabase
        .from('split_day_exercises')
        .select('*, exercise:exercises(*)')
        .eq('day_id', dayId!)
        .order('display_order', { ascending: true });
      if (error) throw error;
      // Deduplicate: keep first occurrence per exercise_id (guards against pre-fix DB duplicates)
      const seen = new Set<string>();
      const deduped: (SplitDayExercise & { exercise: Exercise })[] = [];
      for (const row of (data ?? []) as (SplitDayExercise & { exercise: Exercise })[]) {
        if (!seen.has(row.exercise_id)) {
          seen.add(row.exercise_id);
          deduped.push(row);
        }
      }
      return deduped;
    },
  });
}

export function useAddSplitDayExercise() {
  const queryClient = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: async (input: CreateSplitDayExerciseInput) => {
      if (!userId) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('split_day_exercises')
        .insert([{
          day_id: input.day_id,
          exercise_id: input.exercise_id,
          display_order: input.display_order ?? 0,
          target_sets: input.target_sets ?? 3,
          target_reps_min: input.target_reps_min ?? 8,
          target_reps_max: input.target_reps_max ?? 12,
          rest_seconds: input.rest_seconds ?? 90,
          notes: input.notes ?? '',
        }])
        .select('*, exercise:exercises(*)')
        .single();
      if (error) throw error;
      return data as SplitDayExercise & { exercise: Exercise };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['split-day-exercises', variables.day_id] });
    },
  });
}

export function useUpdateSplitDayExercise() {
  const queryClient = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: async ({ id, day_id, ...input }: UpdateSplitDayExerciseInput & { id: string; day_id: string }) => {
      if (!userId) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('split_day_exercises')
        .update(input)
        .eq('id', id)
        .eq('user_id', userId)
        .select('*, exercise:exercises(*)')
        .single();
      if (error) throw error;
      return data as SplitDayExercise & { exercise: Exercise };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['split-day-exercises', variables.day_id] });
    },
  });
}

export function useRemoveSplitDayExercise() {
  const queryClient = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: async ({ id, day_id }: { id: string; day_id: string }) => {
      if (!userId) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('split_day_exercises')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      if (error) throw error;
      return day_id;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['split-day-exercises', variables.day_id] });
    },
  });
}

export function useReorderSplitDayExercises() {
  const queryClient = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: async (items: { id: string; display_order: number; day_id: string }[]) => {
      if (!userId) throw new Error('Not authenticated');
      const updates = items.map((item) =>
        supabase
          .from('split_day_exercises')
          .update({ display_order: item.display_order })
          .eq('id', item.id)
          .eq('user_id', userId),
      );
      const results = await Promise.all(updates);
      const error = results.find((r) => r.error);
      if (error) throw error.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['split-day-exercises'] });
    },
  });
}

// ── Workout Sessions ─────────────────────────────────────────

export function useStartWorkout() {
  const queryClient = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: async (options: { dayId: string }) => {
      if (!userId) throw new Error('Not authenticated');

      const { data: session, error: sessionError } = await supabase
        .from('workout_sessions')
        .insert([{ day_id: options.dayId }])
        .select()
        .single();
      if (sessionError) throw sessionError;

      const { data: dayExercises, error: deErr } = await supabase
        .from('split_day_exercises')
        .select('*')
        .eq('day_id', options.dayId)
        .order('display_order', { ascending: true });
      if (deErr) throw deErr;

      if (dayExercises && dayExercises.length > 0) {
        const sessionExercises = dayExercises.map((de, index) => ({
          session_id: session.id,
          exercise_id: de.exercise_id,
          display_order: index,
          target_sets: de.target_sets,
          target_reps_min: de.target_reps_min,
          target_reps_max: de.target_reps_max,
          rest_seconds: de.rest_seconds,
          notes: de.notes,
        }));
        const { error: insertErr } = await supabase
          .from('workout_session_exercises')
          .insert(sessionExercises);
        if (insertErr) throw insertErr;

        const setRows: {
          session_id: string;
          exercise_id: string;
          set_number: number;
          weight: number;
          reps: number;
          is_warmup: boolean;
          is_failure: boolean;
          rpe: null;
          rest_seconds: null;
          notes: string;
        }[] = [];
        for (const de of dayExercises) {
          for (let s = 1; s <= de.target_sets; s++) {
            setRows.push({
              session_id: session.id,
              exercise_id: de.exercise_id,
              set_number: s,
              weight: 0,
              reps: 0,
              is_warmup: false,
              is_failure: false,
              rpe: null,
              rest_seconds: null,
              notes: '',
            });
          }
        }
        if (setRows.length > 0) {
          const { error: setsErr } = await supabase
            .from('workout_sets')
            .insert(setRows);
          if (setsErr) throw setsErr;
        }
      }

      return session as WorkoutSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['active-session'] });
    },
  });
}

export function useSessionExercises(sessionId: string | null) {
  const userId = useUserId();
  return useQuery({
    queryKey: ['session-exercises', sessionId, userId],
    enabled: !!userId && !!sessionId,
    queryFn: async (): Promise<(WorkoutSessionExercise & { exercise: Exercise })[]> => {
      const { data, error } = await supabase
        .from('workout_session_exercises')
        .select('*, exercise:exercises(*)')
        .eq('session_id', sessionId!)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return (data ?? []) as (WorkoutSessionExercise & { exercise: Exercise })[];
    },
  });
}

export function useAddSessionExercise() {
  const queryClient = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: async (input: {
      session_id: string;
      exercise_id: string;
      display_order?: number;
      target_sets?: number;
      target_reps_min?: number;
      target_reps_max?: number;
      rest_seconds?: number;
    }) => {
      if (!userId) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('workout_session_exercises')
        .insert([{
          session_id: input.session_id,
          exercise_id: input.exercise_id,
          display_order: input.display_order ?? 0,
          target_sets: input.target_sets ?? 3,
          target_reps_min: input.target_reps_min ?? 8,
          target_reps_max: input.target_reps_max ?? 12,
          rest_seconds: input.rest_seconds ?? 90,
        }])
        .select('*, exercise:exercises(*)')
        .single();
      if (error) throw error;
      return data as WorkoutSessionExercise & { exercise: Exercise };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['session-exercises', variables.session_id, userId],
      });
    },
  });
}

export function useActiveSession() {
  const userId = useUserId();
  return useQuery({
    queryKey: ['active-session', userId],
    enabled: !!userId,
    queryFn: async (): Promise<WorkoutSession | null> => {
      const { data, error } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', userId)
        .is('completed_at', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as WorkoutSession | null;
    },
  });
}

export function useCompleteSession() {
  const queryClient = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      if (!userId) throw new Error('Not authenticated');
      const now = new Date().toISOString();
      const { data: session, error: fetchErr } = await supabase
        .from('workout_sessions')
        .select('started_at')
        .eq('id', id)
        .single();
      if (fetchErr) throw fetchErr;

      const duration = Math.round(
        (new Date(now).getTime() - new Date(session.started_at).getTime()) / 1000,
      );

      const { data, error } = await supabase
        .from('workout_sessions')
        .update({ completed_at: now, duration_seconds: duration, notes: notes ?? '' })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw error;
      return data as WorkoutSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workout-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['active-session'] });
      queryClient.invalidateQueries({ queryKey: ['exercise-history'] });
    },
  });
}

export function useWorkoutSessions(limit: number = 50) {
  const userId = useUserId();
  return useQuery({
    queryKey: ['workout-sessions', userId, limit],
    enabled: !!userId,
    queryFn: async (): Promise<WorkoutSession[]> => {
      const { data, error } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', userId)
        .not('completed_at', 'is', null)
        .order('started_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as WorkoutSession[];
    },
  });
}

export function useSessionWithSets(sessionId: string | null) {
  const userId = useUserId();
  return useQuery({
    queryKey: ['session-sets', sessionId, userId],
    enabled: !!userId && !!sessionId,
    queryFn: async () => {
      const { data: session, error: sErr } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('id', sessionId!)
        .single();
      if (sErr) throw sErr;

      const { data: sets, error: setErr } = await supabase
        .from('workout_sets')
        .select('*, exercise:exercises(*)')
        .eq('session_id', sessionId!)
        .order('exercise_id', { ascending: true })
        .order('set_number', { ascending: true });
      if (setErr) throw setErr;

      const { data: sessionExercises, error: seErr } = await supabase
        .from('workout_session_exercises')
        .select('*, exercise:exercises(*)')
        .eq('session_id', sessionId!)
        .order('display_order', { ascending: true });
      if (seErr) throw seErr;

      let split: Split | null = null;
      let day: SplitDay | null = null;
      if (session.day_id) {
        const { data: dayData } = await supabase
          .from('split_days')
          .select('*')
          .eq('id', session.day_id)
          .single();
        if (dayData) {
          day = dayData as SplitDay;
          const { data: splitData } = await supabase
            .from('splits')
            .select('*')
            .eq('id', dayData.split_id)
            .single();
          if (splitData) split = splitData as Split;
        }
      }

      return {
        session: session as WorkoutSession,
        sets: (sets ?? []) as (WorkoutSet & { exercise: Exercise })[],
        session_exercises: (sessionExercises ?? []) as (WorkoutSessionExercise & { exercise: Exercise })[],
        split,
        day,
      };
    },
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();
  const userId = useUserId();
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const performRealDelete = useCallback(async (id: string) => {
    if (!userId) return;
    await supabase.from('workout_sets').delete().eq('session_id', id);
    await supabase.from('exercise_history').delete().eq('session_id', id);
    await supabase.from('workout_session_exercises').delete().eq('session_id', id);
    await supabase.from('workout_sessions').delete().eq('id', id).eq('user_id', userId);
    queryClient.invalidateQueries({ queryKey: ['workout-sessions'] });
  }, [userId, queryClient]);

  const deleteSession = useCallback(
    (session: WorkoutSession) => {
      queryClient.setQueryData<WorkoutSession[]>(['workout-sessions', userId], (old) =>
        old ? old.filter((s) => s.id !== session.id) : [],
      );
      const timer = setTimeout(() => {
        timersRef.current.delete(session.id);
        performRealDelete(session.id);
      }, 5000);
      timersRef.current.set(session.id, timer);
    },
    [queryClient, userId, performRealDelete],
  );

  const undoDelete = useCallback(
    (session: WorkoutSession) => {
      const timer = timersRef.current.get(session.id);
      if (timer) {
        clearTimeout(timer);
        timersRef.current.delete(session.id);
      }
      queryClient.setQueryData<WorkoutSession[]>(['workout-sessions', userId], (old) => {
        if (!old) return [session];
        if (old.some((s) => s.id === session.id)) return old;
        return [...old, session].sort((a, b) => b.started_at.localeCompare(a.started_at));
      });
    },
    [queryClient, userId],
  );

  return { deleteSession, undoDelete };
}

// ── Workout Sets ─────────────────────────────────────────────

export function useAddSet() {
  const queryClient = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: async (input: { session_id: string; exercise_id: string; set_number: number; weight?: number; reps?: number; is_warmup?: boolean; is_failure?: boolean; rpe?: number | null; rest_seconds?: number | null; notes?: string }) => {
      if (!userId) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('workout_sets')
        .insert([{
          session_id: input.session_id,
          exercise_id: input.exercise_id,
          set_number: input.set_number,
          weight: input.weight ?? 0,
          reps: input.reps ?? 0,
          is_warmup: input.is_warmup ?? false,
          is_failure: input.is_failure ?? false,
          rpe: input.rpe ?? null,
          rest_seconds: input.rest_seconds ?? null,
          notes: input.notes ?? '',
        }])
        .select('*, exercise:exercises(*)')
        .single();
      if (error) throw error;
      return data as WorkoutSet & { exercise: Exercise };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-sets'] });
    },
  });
}

export function useUpdateSet() {
  const queryClient = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string; weight?: number; reps?: number; is_warmup?: boolean; is_failure?: boolean; rpe?: number | null; rest_seconds?: number | null; notes?: string }) => {
      if (!userId) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('workout_sets')
        .update(input)
        .eq('id', id)
        .eq('user_id', userId)
        .select('*, exercise:exercises(*)')
        .single();
      if (error) throw error;
      return data as WorkoutSet & { exercise: Exercise };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-sets'] });
    },
  });
}

export function useDeleteSet() {
  const queryClient = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!userId) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('workout_sets')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['session-sets'] });
    },
  });
}

// ── Exercise History ─────────────────────────────────────────

export function useExerciseHistory(exerciseId: string | null) {
  const userId = useUserId();
  return useQuery({
    queryKey: ['exercise-history', exerciseId, userId],
    enabled: !!userId && !!exerciseId,
    queryFn: async (): Promise<ExerciseHistory[]> => {
      const { data, error } = await supabase
        .from('exercise_history')
        .select('*')
        .eq('exercise_id', exerciseId!)
        .eq('user_id', userId)
        .order('workout_date', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ExerciseHistory[];
    },
  });
}

export function useAllExerciseHistory() {
  const userId = useUserId();
  return useQuery({
    queryKey: ['all-exercise-history', userId],
    enabled: !!userId,
    queryFn: async (): Promise<ExerciseHistory[]> => {
      const { data, error } = await supabase
        .from('exercise_history')
        .select('*')
        .eq('user_id', userId)
        .order('workout_date', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ExerciseHistory[];
    },
  });
}

// ── Habit Auto-Complete ──────────────────────────────────────

export function useCompleteGymHabit() {
  const queryClient = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: async (workoutDate: string) => {
      if (!userId) throw new Error('Not authenticated');

      const { data: habits, error: hErr } = await supabase
        .from('habits')
        .select('id')
        .eq('user_id', userId)
        .eq('archived', false)
        .or('category.ilike.%fitness%,category.ilike.%gym%,category.ilike.%fuerza%,name.ilike.%gym%,name.ilike.%fuerza%');
      if (hErr) throw hErr;

      if (!habits || habits.length === 0) return { completed: false };

      const habitId = habits[0].id;

      const existing = await supabase
        .from('habit_completions')
        .select('id')
        .eq('habit_id', habitId)
        .eq('user_id', userId)
        .gte('completed_at', `${workoutDate}T00:00:00Z`)
        .lt('completed_at', `${workoutDate}T23:59:59Z`)
        .maybeSingle();
      if (existing.error) throw existing.error;
      if (existing.data) return { completed: true, already: true };

      const { error: insertErr } = await supabase
        .from('habit_completions')
        .insert([{ habit_id: habitId, user_id: userId, completed_at: `${workoutDate}T12:00:00Z` }]);
      if (insertErr) throw insertErr;

      queryClient.invalidateQueries({ queryKey: ['completions'] });
      return { completed: true, already: false };
    },
  });
}
