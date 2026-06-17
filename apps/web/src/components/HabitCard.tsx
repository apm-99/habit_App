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
}

const SWIPE_THRESHOLD = 80;

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

export const HabitCard = memo(function HabitCard({ habit, completed, onToggle, onClick, showToggle, onDelete }: HabitCardProps) {
  const emoji = getHabitEmoji(habit);
  const color = getHabitColor(habit);
  const scheduleText = getWeeklyScheduleDescription(habit);
  const [x, setX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [animState, setAnimState] = useState<'idle' | 'completing'>('idle');
  const [localCompleted, setLocalCompleted] = useState<boolean | null>(null);
  const animTimeout = useRef<ReturnType<typeof setTimeout>>();
  const currentX = useRef(0);

  const isCompleted = localCompleted ?? completed;

  useEffect(() => {
    return () => clearTimeout(animTimeout.current);
  }, []);

  useEffect(() => {
    if (completed !== undefined) {
      setLocalCompleted(null);
    }
  }, [completed]);

  const handleToggle = useCallback(() => {
    const next = !isCompleted;
    setLocalCompleted(next);
    if (next) {
      setAnimState('completing');
      clearTimeout(animTimeout.current);
      animTimeout.current = setTimeout(() => setAnimState('idle'), 400);
    }
    onToggle?.();
  }, [isCompleted, onToggle]);

  const bind = useDrag(
    ({ movement: [mx], active, direction: [dx], cancel }) => {
      if (showToggle && dx > 0 && mx > SWIPE_THRESHOLD && !active) {
        handleToggle();
        cancel?.();
        setX(0);
        return;
      }
      if (onDelete && dx < 0 && mx < -SWIPE_THRESHOLD && !active) {
        setShowDelete(true);
        setX(0);
        return;
      }
      if (active) {
        currentX.current = mx;
        setSwiping(true);
        if (onDelete && mx < 0) {
          setX(Math.max(mx, -SWIPE_THRESHOLD));
        } else {
          setX(0);
        }
      } else {
        setSwiping(false);
        if (onDelete && mx < -SWIPE_THRESHOLD / 2) {
          setShowDelete(true);
        }
        setX(0);
      }
    },
    { axis: 'x', filterTaps: true },
  );

  const handleDeleteTap = useCallback(() => {
    onDelete?.();
    setShowDelete(false);
  }, [onDelete]);

  const handleClick = useCallback(() => {
    if (currentX.current !== 0) return;
    if (showToggle) {
      handleToggle();
    } else {
      onClick?.();
    }
  }, [showToggle, handleToggle, onClick]);

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
        className="relative flex items-center gap-3 py-3.5 pr-4 bg-card rounded-[10px] select-none touch-pan-y"
        style={{
          paddingLeft: '20px',
          transform: `translateX(${x}px)`,
          transition: swiping ? 'none' : 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
        onContextMenu={(e) => { e.preventDefault(); onClick?.(); }}
        onClick={handleClick}
        {...bind()}
      >
        <span className="text-lg shrink-0 pointer-events-none">{emoji}</span>
        <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full pointer-events-none"
          style={{ backgroundColor: isCompleted ? '#30D158' : color, opacity: isCompleted ? 0.15 : 0.6 }}
        />
        <div className="flex-1 min-w-0 pointer-events-none ml-3">
          <span className={`block text-[17px] font-normal leading-tight transition-colors duration-200 ${isCompleted ? 'text-text-secondary' : 'text-text-primary'}`}>
            {habit.name}
          </span>
          {scheduleText && (
            <span className={`block text-[13px] text-muted mt-[2px] font-normal transition-colors duration-200 ${isCompleted ? 'opacity-40' : ''}`}>
              {scheduleText}
            </span>
          )}
        </div>
        {showToggle && (
          <div
            onClick={(e) => { e.stopPropagation(); handleToggle(); }}
            className="shrink-0 w-[26px] h-[26px] rounded-full border-[1.5px] flex items-center justify-center transition-all duration-200 cursor-pointer"
            style={{
              borderColor: isCompleted ? '#30D158' : '#636366',
              backgroundColor: isCompleted ? '#30D158' : 'transparent',
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
      {animState === 'completing' && (
        <div className="absolute inset-0 rounded-[10px] bg-[#30D158]/[0.18] animate-[greenFlash_0.35s_ease-out] pointer-events-none" />
      )}
      {isCompleted && animState === 'idle' && (
        <div className="absolute inset-0 rounded-[10px] bg-[#30D158]/[0.06] pointer-events-none" />
      )}
    </div>
  );
});
