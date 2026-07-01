'use client';

import { useRef, useCallback, useState, useEffect, memo } from 'react';
import { motion } from 'framer-motion';
import { useDrag } from '@use-gesture/react';
import { Flag } from 'lucide-react';
import type { Todo } from '@repo/db';
import { CompletionCheck } from './CompletionCheck';

interface TodoCardProps {
  todo: Todo;
  onToggle?: () => void;
  onClick?: () => void;
  onDelete?: () => void;
}

const SWIPE_THRESHOLD = 80;
const LONG_PRESS_MS = 500;

const PRIORITY_COLORS: Record<number, string> = {
  0: 'transparent',
  1: '#FFD60A',
  2: '#FF9F0A',
  3: '#FF5C5C',
};

const CATEGORY_DOT_COLORS: Record<string, string> = {
  health: '#FF5C5C',
  fitness: '#FF9F0A',
  learning: '#FFD60A',
  mindfulness: '#3DD68C',
  work: '#FF6482',
  social: '#AF52DE',
  finance: '#BF5AF2',
  other: '#8E8E93',
};

function getCategoryColor(category: string): string | null {
  return CATEGORY_DOT_COLORS[category.toLowerCase()] ?? null;
}

export const TodoCard = memo(function TodoCard({ todo, onToggle, onClick, onDelete }: TodoCardProps) {
  const [x, setX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const swiped = useRef(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout>>();

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

  const bind = useDrag(
    ({ movement: [mx], active, direction: [dx], cancel }) => {
      if (active) {
        swiped.current = true;
        setSwiping(true);
        if (mx > 0) {
          setX(Math.min(mx, SWIPE_THRESHOLD));
        } else {
          setX(0);
        }
        return;
      }

      setSwiping(false);
      setX(0);

      if (dx > 0 && mx > SWIPE_THRESHOLD && onDelete) {
        onDelete();
        cancel?.();
        return;
      }
    },
    { axis: 'x' },
  );

  const handleClick = useCallback(() => {
    clearTimeout(longPressTimer.current);
    if (swiped.current) return;
    onClick?.();
  }, [onClick]);

  const priorityColor = PRIORITY_COLORS[todo.priority] ?? PRIORITY_COLORS[0];
  const categoryColor = todo.category ? getCategoryColor(todo.category) : null;

  return (
    <div className="relative rounded-2xl overflow-hidden border border-surface-border">
      <motion.div
        layout
        animate={{
          opacity: todo.completed ? 0.55 : 1,
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
          <div onClick={(e) => e.stopPropagation()}>
            <CompletionCheck
              done={todo.completed}
              onToggle={() => {
                clearTimeout(longPressTimer.current);
                swiped.current = false;
                onToggle?.();
              }}
            />
          </div>
          <div className="flex-1 min-w-0 pointer-events-none">
            <span
              className={`block text-base font-medium leading-tight text-text-primary transition-all duration-200 ${
                todo.completed ? 'line-through opacity-60' : ''
              }`}
            >
              {todo.title}
            </span>
            {(todo.notes || todo.category || todo.priority > 0) && (
              <div className="flex items-center gap-1.5 mt-0.5">
                {todo.priority > 0 && (
                  <Flag size={11} style={{ color: priorityColor }} className="shrink-0" />
                )}
                {categoryColor && (
                  <span
                    className="w-[5px] h-[5px] rounded-full shrink-0"
                    style={{ backgroundColor: categoryColor }}
                  />
                )}
                {todo.notes && (
                  <span className="text-[13px] text-tertiary font-normal truncate max-w-[200px]">
                    {todo.notes}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
});
