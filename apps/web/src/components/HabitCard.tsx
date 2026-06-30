'use client';

import { useRef, useCallback, useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import { useDrag } from '@use-gesture/react';
import { Trash2 } from 'lucide-react';
import type { Habit } from '@repo/db';
import { getWeeklyScheduleDescription } from '@/lib/schedule';
import { CompletionCheck } from './CompletionCheck';

interface HabitCardProps {
  habit: Habit;
  completed?: boolean;
  onToggle?: () => void;
  onClick?: () => void;
  showToggle?: boolean;
  onDelete?: () => void;
  weeklyProgress?: { completed: number; target: number };
}

const SWIPE_THRESHOLD = 80;
const LONG_PRESS_MS = 500;

const CATEGORY_EMOJI: Record<string, string> = {
  health: '\u{2764}\u{FE0F}',
  fitness: '\u{1F3C3}',
  learning: '\u{1F4D6}',
  mindfulness: '\u{1F9D8}',
  work: '\u{1F4BB}',
  social: '\u{1F91D}',
  finance: '\u{1F4B0}',
  other: '\u{1F4CB}',
};

const CATEGORY_COLORS: Record<string, string> = {
  health: '#FF5C5C',
  fitness: '#FF9F0A',
  learning: '#FFD60A',
  mindfulness: '#3DD68C',
  work: '#FF6482',
  social: '#AF52DE',
  finance: '#BF5AF2',
  other: '#8E8E93',
};

function getHabitEmoji(habit: Habit): string {
  return CATEGORY_EMOJI[habit.category?.toLowerCase()] || CATEGORY_EMOJI.other;
}

function getHabitColor(habit: Habit): string {
  return CATEGORY_COLORS[habit.category?.toLowerCase()] || CATEGORY_COLORS.other;
}

export const HabitCard = memo(function HabitCard({ habit, completed, onToggle, onClick, showToggle, onDelete, weeklyProgress }: HabitCardProps) {
  const emoji = getHabitEmoji(habit);
  const color = getHabitColor(habit);
  const scheduleText = getWeeklyScheduleDescription(habit);
  const [x, setX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [localCompleted, setLocalCompleted] = useState<boolean | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const swiped = useRef(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout>>();

  const isCompleted = localCompleted ?? completed;

  useEffect(() => {
    if (completed !== undefined) {
      setLocalCompleted(null);
    }
  }, [completed]);

  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const onDown = () => {
      swiped.current = false;
      clearTimeout(longPressTimer.current);
      longPressTimer.current = setTimeout(() => {
        onClick?.();
      }, LONG_PRESS_MS);
    };

    const onUp = () => {
      clearTimeout(longPressTimer.current);
    };

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    el.addEventListener('touchmove', onUp, { passive: true });

    return () => {
      clearTimeout(longPressTimer.current);
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      el.removeEventListener('touchmove', onUp);
    };
  }, [onClick]);

  const handleToggle = useCallback(() => {
    const next = !isCompleted;
    setLocalCompleted(next);
    onToggle?.();
  }, [isCompleted, onToggle]);

  const bind = useDrag(
    ({ movement: [mx], active, direction: [dx], cancel }) => {
      if (active) {
        swiped.current = true;
        setSwiping(true);
        if (mx > 0) {
          setX(Math.min(mx, SWIPE_THRESHOLD));
        } else if (onDelete) {
          setX(Math.max(mx, -SWIPE_THRESHOLD));
        } else {
          setX(0);
        }
        return;
      }

      setSwiping(false);
      setX(0);

      if (dx > 0 && mx > SWIPE_THRESHOLD && showToggle) {
        handleToggle();
        cancel?.();
        return;
      }
      if (dx < 0 && mx < -SWIPE_THRESHOLD && onDelete) {
        setShowDelete(true);
        return;
      }
    },
    { axis: 'x' },
  );

  const handleClick = useCallback(() => {
    clearTimeout(longPressTimer.current);
    if (swiped.current) return;
    if (showToggle) {
      handleToggle();
    } else {
      onClick?.();
    }
  }, [showToggle, handleToggle, onClick]);

  const handleDeleteTap = useCallback(() => {
    onDelete?.();
    setShowDelete(false);
  }, [onDelete]);

  return (
    <div className="relative rounded-2xl overflow-hidden border border-surface-border">
      {showDelete && (
        <button
          onClick={handleDeleteTap}
          className="absolute inset-y-0 right-0 w-[80px] bg-destructive flex items-center justify-center rounded-2xl active:opacity-80 transition-opacity"
        >
          <Trash2 size={20} className="text-white" />
        </button>
      )}
      <motion.div
        layout
        animate={{
          opacity: isCompleted ? 0.55 : 1,
        }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <div
          ref={cardRef}
          className="relative flex items-center gap-3 p-4 bg-surface-card rounded-2xl select-none touch-pan-y cursor-pointer border border-surface-border"
          style={{
            transform: `translateX(${x}px)`,
            transition: swiping ? 'none' : 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
          {...bind()}
          onClick={handleClick}
          onContextMenu={(e) => { e.preventDefault(); onClick?.(); }}
        >
        <span className="text-lg shrink-0 pointer-events-none">{emoji}</span>
        <div className="flex-1 min-w-0 pointer-events-none">
          <span className={`block text-base font-medium leading-tight text-text-primary transition-all duration-200 ${isCompleted ? 'line-through opacity-60' : ''}`}>
            {habit.name}
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            {scheduleText && (
              <>
                <span
                  className="w-[5px] h-[5px] rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className={`text-[13px] text-tertiary font-normal ${isCompleted ? 'opacity-40' : ''}`}>
                  {scheduleText}
                  {weeklyProgress && weeklyProgress.target > 0 && showToggle
                    ? ` \u00B7 ${weeklyProgress.completed}/${weeklyProgress.target} this week`
                    : ''}
                </span>
              </>
            )}
          </div>
        </div>
        {showToggle && (
          <div onClick={(e) => e.stopPropagation()}>
            <CompletionCheck
              done={isCompleted}
              onToggle={() => {
                clearTimeout(longPressTimer.current);
                swiped.current = false;
                handleToggle();
              }}
            />
          </div>
        )}
        </div>
      </motion.div>
    </div>
  );
});
