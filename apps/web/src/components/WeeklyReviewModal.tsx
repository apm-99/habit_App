'use client';

import { useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, Minus, Trophy, Target, AlertCircle, ChevronRight } from 'lucide-react';
import { format, parseISO, addDays } from 'date-fns';
import type { WeeklyReview } from '@repo/db';
import { getScoreLabel, getScoreColor, getHabitColor } from '@/lib/weekly-review';
import { WeeklyRings } from '@/components/WeeklyRings';
import type { Habit } from '@repo/db';

interface WeeklyReviewModalProps {
  review: WeeklyReview | null;
  habits: Habit[];
  weekCompletions: Record<string, string[]>;
  open: boolean;
  onClose: () => void;
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring' as const, damping: 30, stiffness: 300 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: 0.2, ease: 'easeIn' as const },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, damping: 30, stiffness: 300 },
  },
};

function Confetti() {
  const particles = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.3,
      size: Math.random() * 4 + 2,
      color: ['#FF6B4A', '#3DD68C', '#FFD60A', '#FF9F0A', '#BF5AF2'][Math.floor(Math.random() * 5)],
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[200]">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: -10,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
          }}
          initial={{ y: -10, opacity: 1 }}
          animate={{
            y: typeof window !== 'undefined' ? window.innerHeight + 10 : 800,
            opacity: 0,
            x: (Math.random() - 0.5) * 100,
          }}
          transition={{
            duration: 1.2,
            delay: p.delay,
            ease: 'easeIn',
          }}
        />
      ))}
    </div>
  );
}

export function WeeklyReviewModal({ review, habits, weekCompletions, open, onClose }: WeeklyReviewModalProps) {
  const weekStart = useMemo(() => (review ? parseISO(review.week_start) : new Date()), [review]);
  const weekEnd = useMemo(() => (review ? parseISO(review.week_end) : new Date()), [review]);

  const dateRange = useMemo(() => {
    if (!review) return '';
    return `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d')}`;
  }, [review, weekStart, weekEnd]);

  const scoreLabel = useMemo(() => (review ? getScoreLabel(review.overall_score) : ''), [review]);
  const scoreColor = useMemo(() => (review ? getScoreColor(review.overall_score) : '#636366'), [review]);

  const needsAttention = useMemo(
    () => review?.habit_breakdown.filter((h) => h.percentage < 70) ?? [],
    [review],
  );

  const showConfetti = (review?.overall_score ?? 0) > 90;

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // Build weekCompletions for the review week snapshot
  const snapshotCompletions = useMemo(() => {
    const byDate: Record<string, string[]> = {};
    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      const key = format(day, 'yyyy-MM-dd');
      byDate[key] = weekCompletions[key] || [];
    }
    return byDate;
  }, [weekStart, weekCompletions]);

  if (!review) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/70 z-[100]"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={handleClose}
          />
          {showConfetti && <Confetti />}
          <motion.div
            className="fixed inset-0 bg-background z-[101] flex flex-col overflow-hidden"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="flex-1 overflow-y-auto overscroll-none">
              <div className="px-5 pt-14 pb-8 min-h-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-1">
                  <h1 className="text-[28px] font-[500] tracking-[-0.02em] text-text-primary leading-tight">
                    Weekly Review
                  </h1>
                  <button
                    onClick={handleClose}
                    className="w-[32px] h-[32px] rounded-full bg-surface-card border border-surface-border flex items-center justify-center active:opacity-50 transition-opacity"
                  >
                    <X size={16} className="text-text-secondary" />
                  </button>
                </div>
                <p className="text-[15px] text-text-secondary mb-6">{dateRange}</p>

                {/* Overall Score */}
                <motion.div
                  className="text-center mb-8"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring' as const, damping: 20, stiffness: 200, delay: 0.15 }}
                >
                  <div className="text-[56px] font-[600] tracking-[-0.03em] leading-none" style={{ color: scoreColor }}>
                    {review.overall_score}%
                  </div>
                  <p className="text-[15px] text-text-secondary mt-2 font-medium">{scoreLabel}</p>
                </motion.div>

                <motion.div variants={staggerContainer} initial="hidden" animate="visible">
                  {/* Weekly Goal */}
                  <motion.div variants={staggerItem} className="mb-6">
                    <div className="rounded-2xl bg-surface-card border border-surface-border p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-[26px] h-[26px] rounded-full bg-accent/15 flex items-center justify-center">
                          <Target size={14} className="text-accent" />
                        </div>
                        <p className="text-[15px] font-medium text-text-primary">Weekly Goal</p>
                      </div>
                      <p className="text-[14px] text-text-secondary mb-1.5">
                        {review.total_completed >= review.total_scheduled
                          ? 'You achieved your weekly goal.'
                          : 'You fell short of your weekly goal.'}
                      </p>
                      <p className="text-[13px] text-muted">
                        {review.total_completed} / {review.total_scheduled} scheduled completions
                      </p>
                    </div>
                  </motion.div>

                  {/* Habit Breakdown */}
                  <motion.div variants={staggerItem} className="mb-6">
                    <p className="text-[13px] font-[500] text-text-secondary uppercase tracking-[0.06em] mb-3">
                      Habit Breakdown
                    </p>
                    <div className="space-y-2">
                      {review.habit_breakdown.map((habit, i) => (
                        <motion.div
                          key={habit.habit_id}
                          className="rounded-2xl bg-surface-card border border-surface-border p-4"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ type: 'spring' as const, damping: 30, stiffness: 300, delay: 0.2 + i * 0.06 }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-[15px] font-medium text-text-primary truncate">{habit.habit_name}</p>
                              <p className="text-[13px] text-text-secondary mt-0.5">
                                {habit.completed} / {habit.scheduled}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-[40px] h-[3px] rounded-full bg-border overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500 ease-smooth"
                                  style={{
                                    width: `${habit.percentage}%`,
                                    backgroundColor: getHabitColor(habit.percentage),
                                  }}
                                />
                              </div>
                              <span
                                className="text-[15px] font-semibold tabular-nums min-w-[36px] text-right"
                                style={{ color: getHabitColor(habit.percentage) }}
                              >
                                {habit.percentage}%
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Needs Attention */}
                  <motion.div variants={staggerItem} className="mb-6">
                    <p className="text-[13px] font-[500] text-text-secondary uppercase tracking-[0.06em] mb-3">
                      Needs Attention
                    </p>
                    {needsAttention.length === 0 ? (
                      <div className="rounded-2xl bg-surface-card border border-surface-border p-4">
                        <p className="text-[14px] text-success font-medium">Every habit stayed on track this week.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {needsAttention.map((habit) => (
                          <div
                            key={habit.habit_id}
                            className="rounded-2xl bg-surface-card border border-surface-border p-4"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <AlertCircle size={14} className="text-destructive" />
                                <p className="text-[15px] font-medium text-text-primary">{habit.habit_name}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-[13px] text-text-secondary">
                                  {habit.completed} / {habit.scheduled}
                                </span>
                                <span className="text-[14px] font-semibold text-destructive tabular-nums">
                                  {habit.percentage}%
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>

                  {/* Comparison with Previous Week */}
                  {review.score_difference !== null && (
                    <motion.div variants={staggerItem} className="mb-6">
                      <p className="text-[13px] font-[500] text-text-secondary uppercase tracking-[0.06em] mb-3">
                        Compared to Last Week
                      </p>
                      <div className="rounded-2xl bg-surface-card border border-surface-border p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[14px] text-text-secondary">Overall Score</span>
                          <div className="flex items-center gap-1.5">
                            {review.score_difference > 0 ? (
                              <TrendingUp size={14} className="text-success" />
                            ) : review.score_difference < 0 ? (
                              <TrendingDown size={14} className="text-destructive" />
                            ) : (
                              <Minus size={14} className="text-muted" />
                            )}
                            <span
                              className="text-[14px] font-semibold tabular-nums"
                              style={{
                                color:
                                  review.score_difference > 0
                                    ? '#3DD68C'
                                    : review.score_difference < 0
                                      ? '#FF5C5C'
                                      : '#636366',
                              }}
                            >
                              {review.score_difference > 0 ? '+' : ''}
                              {review.score_difference}%
                            </span>
                          </div>
                        </div>
                        {review.completed_difference !== null && (
                          <div className="flex items-center justify-between">
                            <span className="text-[14px] text-text-secondary">Completed Habits</span>
                            <span
                              className="text-[14px] font-semibold tabular-nums"
                              style={{
                                color:
                                  review.completed_difference > 0
                                    ? '#3DD68C'
                                    : review.completed_difference < 0
                                      ? '#FF5C5C'
                                      : '#636366',
                              }}
                            >
                              {review.completed_difference > 0 ? '+' : ''}
                              {review.completed_difference}
                            </span>
                          </div>
                        )}
                        <div className="border-t border-surface-border pt-3 space-y-2">
                          {review.week_comparison.map((comp) => (
                            <div key={comp.habit_id} className="flex items-center justify-between">
                              <span className="text-[13px] text-text-secondary">{comp.habit_name}</span>
                              <span
                                className="text-[13px] font-medium tabular-nums"
                                style={{
                                  color:
                                    comp.difference > 0 ? '#3DD68C' : comp.difference < 0 ? '#FF5C5C' : '#636366',
                                }}
                              >
                                {comp.difference > 0 ? '+' : ''}
                                {comp.difference}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Weekly Snapshot */}
                  {habits.length > 0 && (
                    <motion.div variants={staggerItem} className="mb-6">
                      <p className="text-[13px] font-[500] text-text-secondary uppercase tracking-[0.06em] mb-3">
                        Weekly Snapshot
                      </p>
                      <div className="rounded-2xl bg-surface-card border border-surface-border p-4">
                        <WeeklyRings
                          habits={habits}
                          completionsByDate={snapshotCompletions}
                          selectedDate={weekStart}
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Achievements */}
                  {review.achievements.length > 0 && (
                    <motion.div variants={staggerItem} className="mb-8">
                      <p className="text-[13px] font-[500] text-text-secondary uppercase tracking-[0.06em] mb-3">
                        Achievements
                      </p>
                      <div className="space-y-2">
                        {review.achievements.map((achievement) => (
                          <div
                            key={achievement.id}
                            className="rounded-2xl bg-surface-card border border-surface-border p-4 flex items-center gap-3"
                          >
                            <div className="w-[26px] h-[26px] rounded-full bg-accent/15 flex items-center justify-center">
                              <Trophy size={14} className="text-accent" />
                            </div>
                            <div>
                              <p className="text-[15px] font-medium text-text-primary">{achievement.name}</p>
                              <p className="text-[13px] text-text-secondary">{achievement.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {review.achievements.length === 0 && (
                    <motion.div variants={staggerItem} className="mb-8" />
                  )}
                </motion.div>
              </div>
            </div>

            {/* Closing button */}
            <div className="px-5 pb-8 pt-2">
              <button
                onClick={handleClose}
                className="w-full py-3.5 rounded-[14px] bg-accent text-white text-[15px] font-semibold active:scale-[0.98] transition-transform"
              >
                Start New Week
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
