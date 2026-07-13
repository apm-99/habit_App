'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useExerciseHistory, useExercises } from '@/hooks/useGym';
import {
  getPersonalRecord,
  estimated1RM,
  totalVolume,
  formatWeight,
  formatSetSummary,
  formatVolume,
  calculateWeeklyVolumes,
} from '@/lib/workout';
import { ArrowLeft, Trophy, TrendingUp, Dumbbell, Flame, BarChart3, Activity } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function ExerciseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const exerciseId = params.id as string;

  const { data: exercises } = useExercises();
  const { data: history, isLoading } = useExerciseHistory(exerciseId);

  const exercise = useMemo(
    () => exercises?.find((e) => e.id === exerciseId),
    [exercises, exerciseId],
  );

  const pr = useMemo(() => (history ? getPersonalRecord(history) : null), [history]);

  const weeklyVolumes = useMemo(
    () => (history ? calculateWeeklyVolumes(history, exercises ?? [], 12) : []),
    [history, exercises],
  );

  // Last workout
  const lastWorkout = useMemo(() => {
    if (!history || history.length === 0) return null;
    const working = history.filter((h) => !h.is_warmup);
    if (working.length === 0) return null;
    const lastDate = working[0].workout_date;
    return working.filter((h) => h.workout_date === lastDate);
  }, [history]);

  // Unique workout dates
  const workoutDates = useMemo(() => {
    if (!history) return [];
    return [...new Set(history.filter((h) => !h.is_warmup).map((h) => h.workout_date))].sort(
      (a, b) => b.localeCompare(a),
    );
  }, [history]);

  // Volume per week for chart
  const maxWeeklyVolume = useMemo(
    () => Math.max(...weeklyVolumes.map((w) => w.total_volume), 1),
    [weeklyVolumes],
  );

  // Weight progression data
  const weightProgression = useMemo(() => {
    if (!history) return [];
    const working = history
      .filter((h) => !h.is_warmup && h.weight > 0)
      .sort((a, b) => a.workout_date.localeCompare(b.workout_date));
    
    const byDate = new Map<string, number>();
    for (const h of working) {
      const current = byDate.get(h.workout_date) ?? 0;
      if (h.weight > current) byDate.set(h.workout_date, h.weight);
    }
    return Array.from(byDate.entries()).map(([date, weight]) => ({ date, weight }));
  }, [history]);

  const maxWeight = useMemo(
    () => Math.max(...weightProgression.map((p) => p.weight), 1),
    [weightProgression],
  );

  if (isLoading) {
    return (
        <div className="px-5 pt-14 pb-24">
          <div className="h-8 w-40 rounded bg-surface-card animate-pulse mb-6" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[80px] rounded-2xl bg-surface-card animate-pulse" />
            ))}
          </div>
        </div>
    );
  }

  if (!exercise) {
    return (
        <div className="px-5 pt-14 pb-24 text-center">
          <p className="text-text-secondary">Exercise not found.</p>
          <button onClick={() => router.back()} className="mt-4 text-accent text-[15px] font-[500]">
            Go Back
          </button>
        </div>
    );
  }

  return (
      <div className="px-5 pt-14 pb-24">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => router.back()} className="active:opacity-50 transition-opacity">
            <ArrowLeft size={22} className="text-text-primary" />
          </button>
          <div>
            <h1 className="text-[24px] font-[500] tracking-[-0.02em] text-text-primary">
              {exercise.name}
            </h1>
            <p className="text-[13px] text-text-secondary">{exercise.primary_muscle}</p>
          </div>
        </div>

        {/* PR Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard
            icon={<Trophy size={16} className="text-accent" />}
            label="Max Weight"
            value={pr ? `${formatWeight(pr.max_weight)} kg` : '—'}
          />
          <StatCard
            icon={<Flame size={16} className="text-success" />}
            label="Max Reps"
            value={pr ? pr.max_reps.toString() : '—'}
          />
          <StatCard
            icon={<TrendingUp size={16} className="text-[#FFD60A]" />}
            label="Est. 1RM"
            value={pr ? `${formatWeight(pr.max_estimated_1rm)} kg` : '—'}
          />
          <StatCard
            icon={<Activity size={16} className="text-[#AF52DE]" />}
            label="Total Volume"
            value={pr ? formatVolume(pr.total_volume) : '—'}
          />
        </div>

        {/* Last Workout */}
        {lastWorkout && (
          <div className="mb-6">
            <h2 className="text-[13px] font-medium text-text-secondary uppercase tracking-wide mb-2">
              Last Workout
            </h2>
            <div className="rounded-2xl bg-surface-card border border-surface-border p-4">
              <p className="text-[13px] text-text-secondary mb-2">
                {format(parseISO(lastWorkout[0].workout_date), 'MMM d, yyyy')}
              </p>
              <div className="space-y-1.5">
                {lastWorkout.map((set, i) => (
                  <div key={set.id} className="flex items-center justify-between">
                    <span className="text-[14px] text-text-secondary">Set {i + 1}</span>
                    <span className="text-[14px] text-text-primary tabular-nums">
                      {formatSetSummary(set.weight, set.reps)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Weight Progression Chart */}
        {weightProgression.length > 1 && (
          <div className="mb-6">
            <h2 className="text-[13px] font-medium text-text-secondary uppercase tracking-wide mb-3">
              Weight Progression
            </h2>
            <div className="rounded-2xl bg-surface-card border border-surface-border p-4">
              <WeightChart data={weightProgression} maxWeight={maxWeight} />
            </div>
          </div>
        )}

        {/* Weekly Volume Chart */}
        {weeklyVolumes.some((w) => w.total_volume > 0) && (
          <div className="mb-6">
            <h2 className="text-[13px] font-medium text-text-secondary uppercase tracking-wide mb-3">
              Weekly Volume
            </h2>
            <div className="rounded-2xl bg-surface-card border border-surface-border p-4">
              <VolumeChart data={weeklyVolumes} maxVolume={maxWeeklyVolume} />
            </div>
          </div>
        )}

        {/* Workout Log */}
        {workoutDates.length > 0 && (
          <div>
            <h2 className="text-[13px] font-medium text-text-secondary uppercase tracking-wide mb-2">
              Workout Log ({workoutDates.length} sessions)
            </h2>
            <div className="space-y-1.5">
              {workoutDates.slice(0, 20).map((date) => {
                const daySets = history!.filter(
                  (h) => h.workout_date === date && !h.is_warmup,
                );
                const dayVol = daySets.reduce((sum, s) => sum + s.weight * s.reps, 0);
                const dayMax = Math.max(...daySets.map((s) => s.weight), 0);
                return (
                  <div
                    key={date}
                    className="flex items-center justify-between py-2.5 px-3 rounded-[10px] bg-surface-card"
                  >
                    <span className="text-[14px] text-text-primary">
                      {format(parseISO(date), 'MMM d')}
                    </span>
                    <div className="flex items-center gap-3 text-[13px] text-text-secondary">
                      <span>{daySets.length} sets</span>
                      <span>{formatWeight(dayMax)} kg max</span>
                      <span>{formatVolume(dayVol)} vol</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-surface-card border border-surface-border p-4">
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon}
        <span className="text-[11px] text-muted uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-[20px] font-semibold text-text-primary tabular-nums">{value}</p>
    </div>
  );
}

function WeightChart({
  data,
  maxWeight,
}: {
  data: { date: string; weight: number }[];
  maxWeight: number;
}) {
  const width = 320;
  const height = 120;
  const padding = { top: 10, right: 10, bottom: 20, left: 10 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const points = data.map((d, i) => ({
    x: padding.left + (i / Math.max(data.length - 1, 1)) * chartW,
    y: padding.top + chartH - (d.weight / maxWeight) * chartH,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1]?.x ?? 0} ${padding.top + chartH} L ${points[0]?.x ?? 0} ${padding.top + chartH} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      <defs>
        <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF6B4A" stopOpacity={0.3} />
          <stop offset="100%" stopColor="#FF6B4A" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#weightGrad)" />
      <path d={linePath} fill="none" stroke="#FF6B4A" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill="#FF6B4A" />
      ))}
    </svg>
  );
}

function VolumeChart({
  data,
  maxVolume,
}: {
  data: { week_start: string; total_volume: number }[];
  maxVolume: number;
}) {
  const visible = data.filter((d) => d.total_volume > 0).slice(-8);
  if (visible.length === 0) return null;

  const barWidth = 24;
  const gap = 8;
  const height = 120;
  const padding = { top: 10, bottom: 20 };
  const chartH = height - padding.top - padding.bottom;

  return (
    <div className="flex items-end justify-center gap-2" style={{ height }}>
      {visible.map((d, i) => {
        const barH = maxVolume > 0 ? (d.total_volume / maxVolume) * chartH : 0;
        return (
          <div key={i} className="flex flex-col items-center gap-1">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: Math.max(barH, 2) }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="rounded-t-[4px] bg-accent/70"
              style={{ width: barWidth }}
            />
            <span className="text-[10px] text-muted tabular-nums">
              {format(parseISO(d.week_start), 'M/d')}
            </span>
          </div>
        );
      })}
    </div>
  );
}
