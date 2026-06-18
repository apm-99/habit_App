'use client';

import { useRef, useCallback, useState, useEffect, memo } from 'react';
import { useDrag } from '@use-gesture/react';
import { Trash2 } from 'lucide-react';
import type { Habit } from '@repo/db';
import { getWeeklyScheduleDescription } from '@/lib/schedule';

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
  health: '#FF453A',
  fitness: '#FF9F0A',
  learning: '#FFD60A',
  mindfulness: '#30D158',
  work: '#64D2FF',
  social: '#0A84FF',
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
    el.addEventListener('pointermove', onUp);
    el.addEventListener('touchmove', onUp, { passive: true });

    return () => {
      clearTimeout(longPressTimer.current);
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      el.removeEventListener('pointermove', onUp);
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
    <div className="relative rounded-[10px] overflow-hidden">
      {showDelete && (
        <button
          onClick={handleDeleteTap}
          className="absolute inset-y-0 right-0 w-[80px] bg-[#FF453A] flex items-center justify-center rounded-[10px] active:opacity-80 transition-opacity"
        >
          <Trash2 size={20} className="text-white" />
        </button>
      )}
      <div
        ref={cardRef}
        className="relative flex items-center gap-3 py-3.5 pr-4 bg-card rounded-[10px] select-none touch-pan-y cursor-pointer"
        style={{
          paddingLeft: '20px',
          transform: `translateX(${x}px)`,
          transition: swiping ? 'none' : 'transform 0.3s var(--ease-spring)',
        }}
        {...bind()}
        onClick={handleClick}
        onContextMenu={(e) => { e.preventDefault(); onClick?.(); }}
      >
        <span className="text-lg shrink-0 pointer-events-none">{emoji}</span>
        <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full pointer-events-none transition-all duration-300 ease-decelerate"
          style={{ backgroundColor: isCompleted ? '#30D158' : color, opacity: isCompleted ? 0.2 : 0.6 }}
        />
        <div className="flex-1 min-w-0 pointer-events-none ml-3">
          <span className={`block text-[17px] font-normal leading-tight transition-all duration-200 ease-decelerate ${isCompleted ? 'text-text-secondary' : 'text-text-primary'}`}>
            {habit.name}
          </span>
          {scheduleText && (
            <span className={`block text-[13px] text-muted mt-[2px] font-normal transition-all duration-200 ease-decelerate ${isCompleted ? 'opacity-40' : ''}`}>
              {scheduleText}
            </span>
          )}
          {weeklyProgress && weeklyProgress.target > 0 && showToggle && (
            <span className="block text-[12px] text-text-secondary/70 mt-[1px] font-normal">
              {weeklyProgress.completed} of {weeklyProgress.target} this week
            </span>
          )}
        </div>
        {showToggle && (
          <div
            onClick={(e) => { e.stopPropagation(); clearTimeout(longPressTimer.current); swiped.current = false; handleToggle(); }}
            className="shrink-0 w-[26px] h-[26px] rounded-full border-[1.5px] flex items-center justify-center transition-all duration-200 ease-decelerate cursor-pointer"
            style={{
              borderColor: isCompleted ? '#30D158' : '#636366',
              backgroundColor: isCompleted ? '#30D158' : 'transparent',
              boxShadow: isCompleted ? '0 0 10px rgba(48, 209, 88, 0.25)' : 'none',
            }}
          >
            {isCompleted ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path className="check-path" d="M2 7l3.5 3.5L12 3" />
              </svg>
            ) : (
              <div className="w-full h-full rounded-full border-[1.5px] border-[#636366]" />
            )}
          </div>
        )}
      </div>
      <div
        className="absolute inset-0 rounded-[10px] pointer-events-none transition-opacity duration-300 ease-decelerate"
        style={{ backgroundColor: 'rgba(48, 209, 88, 0.08)', opacity: isCompleted ? 1 : 0 }}
      />
    </div>
  );
});
