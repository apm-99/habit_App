'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { EmptyState } from '@/components/EmptyState';
import { UndoToast } from '@/components/UndoToast';
import {
  useWorkoutSessions,
  useSessionWithSets,
  useDeleteSession,
} from '@/hooks/useGym';
import { formatDuration, totalVolume, formatWeight } from '@/lib/workout';
import { ArrowLeft, History, ChevronRight, Clock, Dumbbell } from 'lucide-react';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import type { WorkoutSession, WorkoutSet } from '@repo/db';

export default function HistoryPage() {
  const router = useRouter();
  const { data: sessions, isLoading } = useWorkoutSessions(100);
  const { deleteSession, undoDelete } = useDeleteSession();
  const [deletedSession, setDeletedSession] = useState<WorkoutSession | undefined>(undefined);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const groupedSessions = useMemo(() => {
    if (!sessions) return [];
    const groups = new Map<string, WorkoutSession[]>();
    for (const session of sessions) {
      const date = format(parseISO(session.started_at), 'yyyy-MM-dd');
      if (!groups.has(date)) groups.set(date, []);
      groups.get(date)!.push(session);
    }
    return Array.from(groups.entries()).map(([date, items]) => ({
      date,
      label: isToday(parseISO(date))
        ? 'Today'
        : isYesterday(parseISO(date))
          ? 'Yesterday'
          : format(parseISO(date), 'EEEE, MMMM d'),
      sessions: items,
    }));
  }, [sessions]);

  const handleDelete = useCallback(
    (session: WorkoutSession) => {
      setDeletedSession(session);
      deleteSession(session);
    },
    [deleteSession],
  );

  const handleUndoDelete = useCallback(() => {
    if (deletedSession) {
      undoDelete(deletedSession);
      setDeletedSession(undefined);
    }
  }, [deletedSession, undoDelete]);

  return (
    <>
      <div className="px-5 pt-14 pb-24">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => router.push('/gym')} className="active:opacity-50 transition-opacity">
            <ArrowLeft size={22} className="text-text-primary" />
          </button>
          <h1 className="text-[24px] font-[500] tracking-[-0.02em] text-text-primary">
            History
          </h1>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[80px] rounded-2xl bg-surface-card animate-pulse" />
            ))}
          </div>
        ) : groupedSessions.length === 0 ? (
          <EmptyState
            icon={<History size={28} className="text-accent" />}
            title="No workouts yet"
            description="Complete a workout to see it here."
          />
        ) : (
          <div className="space-y-6">
            {groupedSessions.map((group) => (
              <div key={group.date}>
                <p className="text-[13px] font-medium text-text-secondary mb-2">{group.label}</p>
                <div className="space-y-2">
                  {group.sessions.map((session) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      expanded={expandedId === session.id}
                      onToggle={() => setExpandedId(expandedId === session.id ? null : session.id)}
                      onDelete={() => handleDelete(session)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {deletedSession && (
        <UndoToast
          message="Workout deleted"
          onUndo={handleUndoDelete}
          onDismiss={() => setDeletedSession(undefined)}
        />
      )}
    </>
  );
}

function SessionCard({
  session,
  expanded,
  onToggle,
  onDelete,
}: {
  session: WorkoutSession;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const { data } = useSessionWithSets(session.id);
  const sets = data?.sets ?? [];

  const time = format(parseISO(session.started_at), 'h:mm a');
  const duration = session.duration_seconds ? formatDuration(session.duration_seconds) : null;
  const vol = totalVolume(sets as WorkoutSet[]);
  const exerciseCount = new Set(sets.map((s) => s.exercise_id)).size;
  const workingSets = sets.filter((s) => !s.is_warmup).length;

  return (
    <motion.div
      layout
      className="rounded-2xl bg-surface-card border border-surface-border overflow-hidden"
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 active:bg-surface-cardHover transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
          <Dumbbell size={18} className="text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-medium text-text-primary">
            {exerciseCount} exercises, {workingSets} sets
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[13px] text-text-secondary flex items-center gap-1">
              <Clock size={11} />
              {time}
            </span>
            {duration && (
              <span className="text-[13px] text-text-secondary">{duration}</span>
            )}
            {vol > 0 && (
              <span className="text-[13px] text-text-secondary">
                {vol >= 1000 ? `${(vol / 1000).toFixed(1)}k` : vol} vol
              </span>
            )}
          </div>
        </div>
        <ChevronRight
          size={18}
          className={`text-text-secondary transition-transform ${expanded ? 'rotate-90' : ''}`}
        />
      </button>

      <AnimatePresence>
        {expanded && data && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2 border-t border-surface-border pt-3">
              {sets.map((set) => (
                <div key={set.id} className="flex items-center justify-between text-[14px]">
                  <span className="text-text-secondary">{set.exercise.name}</span>
                  <span className="text-text-primary tabular-nums">
                    {set.is_warmup ? 'W: ' : ''}
                    {formatWeight(set.weight)} kg × {set.reps}
                  </span>
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(); }}
                  className="flex-1 py-2 rounded-[10px] bg-elevated text-[13px] font-medium text-destructive active:opacity-70 transition-opacity"
                >
                  Delete Workout
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
