'use client';

import { useState } from 'react';
import { format, subMonths, addMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMonthlyData } from '@/hooks/useStats';

function getIntensityColor(completed: number, total: number): string {
  if (total === 0 || completed === 0) return 'bg-[#2C2C2E]/50';
  const ratio = completed / total;
  if (ratio === 1) return 'bg-[#34C759]';
  if (ratio >= 0.66) return 'bg-[#34C759]/70';
  if (ratio >= 0.33) return 'bg-[#007AFF]/50';
  return 'bg-[#007AFF]/25';
}

export function MonthlyCalendar() {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysData = useMonthlyData(year, month);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const today = new Date();

  return (
    <div className="rounded-xl bg-[#1C1C1E] p-4">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setCurrentDate((d) => subMonths(d, 1))} className="w-7 h-7 rounded-full flex items-center justify-center active:bg-[#2C2C2E] transition-colors">
          <ChevronLeft size={16} className="text-text-secondary" />
        </button>
        <h3 className="text-[13px] font-semibold text-text-primary">{format(currentDate, 'MMMM yyyy')}</h3>
        <button onClick={() => setCurrentDate((d) => addMonths(d, 1))} className="w-7 h-7 rounded-full flex items-center justify-center active:bg-[#2C2C2E] transition-colors">
          <ChevronRight size={16} className="text-text-secondary" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-[2px] mb-[2px]">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d) => (
          <div key={d} className="text-center text-[11px] text-text-secondary font-semibold py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-[2px]">
        {days.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} />;
          const date = new Date(year, month, day);
          const data = daysData?.find((d) => d.date.getDate() === day && d.date.getMonth() === month);
          const completed = data?.completed ?? 0;
          const total = data?.total ?? 0;
          const isToday = date.toDateString() === today.toDateString();

          return (
            <div
              key={day}
              className={`aspect-square rounded-md flex items-center justify-center text-[12px] ${getIntensityColor(completed, total)} ${isToday ? 'ring-[1.5px] ring-[#007AFF]' : ''}`}
            >
              <span className={`font-medium ${total > 0 ? 'text-white' : 'text-[#48484A]'}`}>{day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
