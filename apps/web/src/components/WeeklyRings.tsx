'use client';

import { useMemo } from 'react';
import { startOfWeek, addDays, format, isSameDay } from 'date-fns';
import type { Habit } from '@repo/db';

interface WeeklyRingsProps {
  habits: Habit[];
  completionsByDate: Record<string, string[]>;
  selectedDate?: Date;
  onSelectDay?: (date: Date) => void;
}

function ringPath(pct: number): string {
  const r = 17, cx = 21, cy = 21;
  const circ = 2 * Math.PI * r;
  const p = Math.min(pct, 1);
  const len = circ * p;
  const dashoffset = circ - len;

  return [
    `<svg class="w-[40px] h-[40px]" viewBox="0 0 42 42">`,
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#38383A" stroke-width="2.5"/>`,
    p > 0 ? `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#3E6AE1" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${dashoffset}" transform="rotate(-90 ${cx} ${cy})"/>` : '',
    p > 0 ? `<text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central" fill="#3E6AE1" font-size="12" font-weight="600" font-family="-apple-system, system-ui, sans-serif">${Math.round(p * 100)}</text>` : '',
    `</svg>`,
  ].join('');
}

export function WeeklyRings({ habits, completionsByDate, selectedDate, onSelectDay }: WeeklyRingsProps) {
  const weekDays = useMemo(() => {
    const base = selectedDate || new Date();
    const monday = startOfWeek(base, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  }, [selectedDate]);

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = new Date();

  return (
    <div className="flex justify-center gap-[18px] py-2 mb-6">
      {weekDays.map((day, i) => {
        const key = format(day, 'yyyy-MM-dd');
        const isCurrentDay = selectedDate ? isSameDay(day, selectedDate) : isSameDay(day, today);
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
            className="flex flex-col items-center gap-[6px] animate-[ringFadeUp_0.3s_cubic-bezier(0.16,1,0.3,1)_both] bg-transparent border-none p-0 cursor-pointer active:opacity-60 transition-opacity" style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div
              dangerouslySetInnerHTML={{ __html: isCurrentDay ? ringPath(pct) : `<div class="w-[40px] h-[40px] rounded-full border-[1.5px] ${pct > 0 ? 'border-muted' : 'border-border'} flex items-center justify-center"><span class="text-muted text-[10px]">${pct > 0 ? '•' : ''}</span></div>` }}
            />
            <span className="text-[11px] text-muted text-center">{dayLabels[i]}</span>
          </button>
        );
      })}
    </div>
  );
}
