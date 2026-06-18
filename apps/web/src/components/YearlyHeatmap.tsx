'use client';

import { useState } from 'react';
import { format, getDay, startOfYear, eachDayOfInterval, endOfYear, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useYearlyData } from '@/hooks/useStats';

function getHeatmapColor(completed: number, total: number): string {
  if (total === 0 || completed === 0) return 'bg-[#2C2C2E]/40';
  const ratio = completed / total;
  if (ratio === 1) return 'bg-[#34C759]';
  if (ratio >= 0.66) return 'bg-[#34C759]/60';
  if (ratio >= 0.33) return 'bg-[#007AFF]/40';
  return 'bg-[#007AFF]/20';
}

export function YearlyHeatmap() {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const daysData = useYearlyData(year);

  const yearStart = startOfYear(new Date(year, 0));
  const yearEnd = endOfYear(yearStart);
  const allDays = eachDayOfInterval({ start: yearStart, end: yearEnd });

  const weeks: (Date | null)[][] = [];
  let currentWeek: (Date | null)[] = [];
  const padding = getDay(yearStart);
  for (let i = 0; i < padding; i++) currentWeek.push(null);
  for (const day of allDays) {
    currentWeek.push(day);
    if (currentWeek.length === 7) { weeks.push(currentWeek); currentWeek = []; }
  }
  while (currentWeek.length < 7) currentWeek.push(null);
  if (currentWeek.length > 0) weeks.push(currentWeek);

  const today = new Date();

  return (
    <div className="rounded-xl bg-[#1C1C1E] p-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setYear((y) => y - 1)} className="w-7 h-7 rounded-full flex items-center justify-center active:bg-[#2C2C2E] transition-colors">
          <ChevronLeft size={16} className="text-text-secondary" />
        </button>
        <h3 className="text-[13px] font-semibold text-text-primary">{year}</h3>
        <button onClick={() => setYear((y) => y + 1)} className="w-7 h-7 rounded-full flex items-center justify-center active:bg-[#2C2C2E] transition-colors">
          <ChevronRight size={16} className="text-text-secondary" />
        </button>
      </div>

      <div className="flex gap-[2px]">
        <div className="flex flex-col gap-[2px] mr-1 justify-between">
          {['Mon', '', 'Wed', '', 'Fri', '', ''].map((l, i) => (
            <div key={i} className="text-[8px] text-[#48484A] h-[10px] leading-[10px]">{l}</div>
          ))}
        </div>
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-[2px]">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[2px]">
                {week.map((day, di) => {
                  if (!day) return <div key={`e-${di}`} className="w-[10px] h-[10px]" />;
                  const data = daysData?.find((d) => isSameDay(d.date, day));
                  const completed = data?.completed ?? 0;
                  const total = data?.total ?? 0;
                  return (
                    <div
                      key={di}
                      className={`w-[10px] h-[10px] rounded-[2px] ${getHeatmapColor(completed, total)} ${isSameDay(day, today) ? 'ring-[1px] ring-[#007AFF]' : ''}`}
                      title={`${format(day, 'MMM d, yyyy')}: ${completed}/${total}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-[3px] mt-2">
        <span className="text-[9px] text-[#48484A]">Less</span>
        <div className="w-[10px] h-[10px] rounded-[2px] bg-[#2C2C2E]/40" />
        <div className="w-[10px] h-[10px] rounded-[2px] bg-[#007AFF]/20" />
        <div className="w-[10px] h-[10px] rounded-[2px] bg-[#007AFF]/40" />
        <div className="w-[10px] h-[10px] rounded-[2px] bg-[#34C759]/60" />
        <div className="w-[10px] h-[10px] rounded-[2px] bg-[#34C759]" />
        <span className="text-[9px] text-[#48484A]">More</span>
      </div>
    </div>
  );
}
