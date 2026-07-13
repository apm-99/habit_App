'use client';

import { useMemo } from 'react';
import { startOfWeek, addDays, format, isSameDay, isToday } from 'date-fns';
import type { Habit } from '@repo/db';

interface WeeklyRingsProps {
  habits: Habit[];
  completionsByDate: Record<string, string[]>;
  selectedDate?: Date;
  onSelectDay?: (date: Date) => void;
  size?: 'default' | 'compact';
}

const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const SIZES = {
  default: { ring: 42, svg: 36, r: 17, stroke: 2.5, fontSize: 12, gap: 18, labelSize: 11 },
  compact: { ring: 30, svg: 26, r: 11, stroke: 2, fontSize: 9, gap: 10, labelSize: 9 },
} as const;

export function WeeklyRings({ habits, completionsByDate, selectedDate, onSelectDay, size = 'default' }: WeeklyRingsProps) {
  const s = SIZES[size];

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

  const circumference = 2 * Math.PI * s.r;

  return (
    <div className={size === 'compact' ? 'py-1 mb-2' : 'py-2 mb-6'}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: s.gap }}>
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
              className="flex flex-col items-center gap-[4px] bg-transparent border-none p-0 cursor-pointer active:opacity-60 transition-opacity"
            >
              <div
                style={{ width: s.ring, height: s.ring }}
                className="relative flex items-center justify-center"
              >
                {isSelected && (
                  <div className="absolute inset-0 rounded-full bg-accent/15 border border-accent/40 pointer-events-none" />
                )}
                {dayIsToday && (
                  <div className="absolute inset-0 rounded-full border-2 border-accent pointer-events-none" style={isSelected ? { borderColor: '#FF6B4A' } : undefined} />
                )}
                {pct > 0 ? (
                  <svg width={s.svg} height={s.svg} viewBox={`0 0 ${s.ring} ${s.ring}`}>
                    <circle cx={s.ring / 2} cy={s.ring / 2} r={s.r} fill="none" stroke="#38383A" strokeWidth={s.stroke} />
                    <circle
                      cx={s.ring / 2} cy={s.ring / 2} r={s.r} fill="none"
                      stroke="#FF6B4A" strokeWidth={s.stroke}
                      strokeLinecap="round"
                      strokeDasharray={`${circumference}`}
                      strokeDashoffset={`${circumference * (1 - Math.min(pct, 1))}`}
                      transform={`rotate(-90 ${s.ring / 2} ${s.ring / 2})`}
                      style={{ transition: 'stroke-dashoffset 0.4s var(--ease-smooth)' }}
                    />
                    <text x={s.ring / 2} y={s.ring / 2} textAnchor="middle" dominantBaseline="central" fill="#FF6B4A" fontSize={s.fontSize} fontWeight="600" fontFamily="-apple-system, system-ui, sans-serif">
                      {Math.round(pct * 100)}
                    </text>
                  </svg>
                ) : (
                  <div
                    style={{ width: s.svg, height: s.svg }}
                    className="rounded-full border-[1.5px] border-border flex items-center justify-center"
                  >
                    <span className="text-muted text-[8px]">&bull;</span>
                  </div>
                )}
              </div>
              <span
                style={{ fontSize: s.labelSize }}
                className={`text-center transition-colors duration-150 ${dayIsToday ? 'font-semibold text-accent' : isSelected ? 'font-medium text-text-secondary' : 'text-muted'}`}
              >
                {dayLabels[i]}
              </span>
            </button>
          );
        })}
      </div>
      {size === 'default' && (
        <div className="flex items-center justify-center gap-1.5 mt-[10px]">
          <div className="h-[3px] flex-1 max-w-[120px] rounded-full bg-border overflow-hidden">
            <div className="h-full rounded-full bg-accent transition-all duration-500 ease-smooth" style={{ width: `${weekPct}%` }} />
          </div>
          <span className="text-[11px] font-medium text-text-secondary">{weekPct}%</span>
        </div>
      )}
    </div>
  );
}
