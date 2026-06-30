'use client';

import { useMemo } from 'react';
import { startOfWeek, addDays, format, isSameDay, isToday } from 'date-fns';

interface DateHeaderProps {
  selectedDate: Date;
  onSelectDay: (date: Date) => void;
  completedCount: number;
  totalCount: number;
}

const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function DateHeader({ selectedDate, onSelectDay, completedCount, totalCount }: DateHeaderProps) {
  const weekDays = useMemo(() => {
    const monday = startOfWeek(selectedDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  }, [selectedDate]);

  const weekPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-text-secondary font-[450]">
          {weekPct}% &middot; {completedCount}/{totalCount}
        </span>
        <span className="text-sm text-tertiary font-[450]">
          Week of {format(weekDays[0], 'MMM d')}
        </span>
      </div>
      <div className="flex justify-between">
        {weekDays.map((day, i) => {
          const isSel = isSameDay(day, selectedDate);
          const today = isToday(day);
          return (
            <button
              key={i}
              onClick={() => onSelectDay(day)}
              className="flex flex-col items-center gap-0.5 bg-transparent border-none p-0 cursor-pointer active:opacity-60 transition-opacity min-w-0"
            >
              <span className={`text-xs leading-tight ${isSel ? 'text-text-primary font-semibold' : today ? 'text-text-secondary font-medium' : 'text-tertiary'}`}>
                {dayLabels[i]}
              </span>
              <span className={`text-[11px] leading-tight ${isSel ? 'text-text-primary' : 'text-tertiary'}`}>
                {format(day, 'd')}
              </span>
              <div className={`h-0.5 w-6 rounded-full mt-0.5 transition-colors duration-150 ${isSel ? 'bg-accent' : 'bg-transparent'}`} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
