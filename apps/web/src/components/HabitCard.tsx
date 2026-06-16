'use client';

import { useState } from 'react';
import { getCategoryColor } from '@/hooks/useHabits';
import { Check, Circle } from 'lucide-react';
import type { Habit } from '@repo/db';

interface HabitCardProps {
  habit: Habit;
  completed?: boolean;
  onToggle?: () => void;
  onClick?: () => void;
  showToggle?: boolean;
}

export function HabitCard({ habit, completed, onToggle, onClick, showToggle }: HabitCardProps) {
  const categoryColor = getCategoryColor(habit.category);
  const [swiped, setSwiped] = useState(false);
  const [startX, setStartX] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const endX = e.changedTouches[0].clientX;
    const diff = startX - endX;
    if (diff > 60 && onToggle) {
      setSwiped(true);
      onToggle();
      setTimeout(() => setSwiped(false), 300);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-lg">
      <div
        className={`absolute inset-0 rounded-lg transition-opacity duration-300 ${swiped ? 'opacity-100' : 'opacity-0'}`}
        style={{ backgroundColor: categoryColor }}
      />
      <button
        onClick={onClick}
        onTouchStart={showToggle ? handleTouchStart : undefined}
        onTouchEnd={showToggle ? handleTouchEnd : undefined}
        className={`relative w-full flex items-center gap-4 p-4 card transition-all duration-200 active:scale-[0.98] ${completed ? 'opacity-60' : ''}`}
      >
        {showToggle ? (
          <button
            onClick={(e) => { e.stopPropagation(); onToggle?.(); }}
            className={`shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
              completed
                ? 'bg-success border-success'
                : 'border-text-secondary'
            }`}
          >
            {completed && <Check size={14} className="text-background" strokeWidth={3} />}
          </button>
        ) : (
          <Circle size={10} fill={categoryColor} color={categoryColor} className="shrink-0" />
        )}
        <div className="flex-1 text-left min-w-0">
          <span className="block text-sm font-medium text-text-primary truncate">
            {habit.name}
          </span>
          {habit.description && (
            <span className="block text-xs text-text-secondary truncate mt-0.5">
              {habit.description}
            </span>
          )}
        </div>
      </button>
    </div>
  );
}
