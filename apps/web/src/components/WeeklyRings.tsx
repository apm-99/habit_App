'use client';

import { useMemo } from 'react';
import { startOfWeek, addDays, format, isSameDay, isToday } from 'date-fns';
import type { Habit } from '@repo/db';

interface WeeklyRingsProps {
  habits: Habit[];
  completionsByDate: Record<string, string[]>;
  selectedDate?: Date;
  onSelectDay?: (date: Date) => void;
}

const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function WeeklyRings({ habits, completionsByDate, selectedDate, onSelectDay }: WeeklyRingsProps) {
  const weekDays = useMemo(() => {
    const base = selectedDate || new Date();
    const monday = startOfWeek(base, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  }, [selectedDate]);

  const weekPct = useMemo(() => {
    let totalScheduled = 0;
    let totalCompleted = 0;
    for (const day of weekDays) {
      const key = format(day, 'yyyy-MM-dd');
      const activeHabits = habits.filter((h) => {
        const dayIdx = day.getDay();
        if (h.frequency_type === 'daily') return true;
        if (h.frequency_type === 'custom_days') return h.custom_days?.includes(dayIdx) ?? false;
        return true;
      });
      const completed = completionsByDate[key] || [];
      totalScheduled += activeHabits.length;
      totalCompleted += Math.min(completed.length, activeHabits.length);
    }
    return totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0;
  }, [habits, completionsByDate, weekDays]);

  return (
    <div className="py-2 mb-6">
      <div className="flex justify-center gap-[18px]">
        {weekDays.map((day, i) => {
          const key = format(day, 'yyyy-MM-dd');
          const dayIsToday = isToday(day);
          const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
          const activeHabits = habits.filter((h) => {
            const dayIdx = day.getDay();
            if (h.frequency_type === 'daily') return true;
            if (h.frequency_type === 'custom_days') return h.custom_days?.includes(dayIdx) ?? false;
            return true;
          });
          const completed = completionsByDate[key] || [];
          const pct = activeHabits.length > 0 ? completed.length / activeHabits.length : 0;

          return (
            <button
              key={i}
              onClick={() => onSelectDay?.(day)}
              className="flex flex-col items-center gap-[6px] animate-[ringFadeUp_0.3s_cubic-bezier(0.16,1,0.3,1)_both] bg-transparent border-none p-0 cursor-pointer active:opacity-60 transition-opacity"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="relative w-[42px] h-[42px] flex items-center justify-center">
                {isSelected && (
                  <div className="absolute inset-0 rounded-full bg-accent/15 border border-accent/40 pointer-events-none transition-all duration-200 ease-decelerate" />
                )}
                {dayIsToday && (
                  <div className="absolute inset-0 rounded-full border-2 border-accent pointer-events-none transition-all duration-200 ease-decelerate" style={isSelected ? { borderColor: '#FF6B4A' } : undefined} />
                )}
                {pct > 0 ? (
                  <svg className="w-[36px] h-[36px]" viewBox="0 0 42 42">
                    <circle cx="21" cy="21" r="17" fill="none" stroke="#38383A" strokeWidth="2.5" />
                    <circle
                      cx="21" cy="21" r="17" fill="none"                       stroke="#FF6B4A" strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 17}`}
                      strokeDashoffset={`${2 * Math.PI * 17 * (1 - Math.min(pct, 1))}`}
                      transform="rotate(-90 21 21)"
                      style={{ transition: 'stroke-dashoffset 0.4s var(--ease-smooth)' }}
                    />
                    <text x="21" y="21" textAnchor="middle" dominantBaseline="central" fill="#FF6B4A" fontSize="12" fontWeight="600" fontFamily="-apple-system, system-ui, sans-serif">
                      {Math.round(pct * 100)}
                    </text>
                  </svg>
                ) : (
                  <div className="w-[36px] h-[36px] rounded-full border-[1.5px] border-border flex items-center justify-center">
                    <span className="text-muted text-[10px]">&bull;</span>
                  </div>
                )}
              </div>
              <span className={`text-[11px] text-center transition-colors duration-150 ${dayIsToday ? 'font-semibold text-accent' : isSelected ? 'font-medium text-text-secondary' : 'text-muted'}`}>
                {dayLabels[i]}
              </span>
            </button>
          );
        })}
      </div>
        <div className="flex items-center justify-center gap-1.5 mt-[10px]">
          <div className="h-[3px] flex-1 max-w-[120px] rounded-full bg-border overflow-hidden">
            <div className="h-full rounded-full bg-accent transition-all duration-500 ease-smooth" style={{ width: `${weekPct}%` }} />
          </div>
          <span className="text-[11px] font-medium text-text-secondary">{weekPct}%</span>
        </div>
    </div>
  );
}
