'use client';

import { format, isToday } from 'date-fns';
import { useHabits } from '@/hooks/useHabits';
import { useDailyRates, useStreaks } from '@/hooks/useStats';
import { isScheduledToday } from '@/lib/schedule';

export function StreakChart() {
  const { data: habits } = useHabits();
  const dailyRates = useDailyRates(30);
  const streaks = useStreaks();

  if (!dailyRates || !streaks || !habits) return null;

  const today = new Date();
  const scheduledToday = habits.filter((h) => isScheduledToday(h, today));
  const todayData = dailyRates.find((d) => isToday(d.date));
  const completedToday = todayData?.completed ?? 0;
  const totalToday = todayData?.total ?? 0;

  const overallRate30 = dailyRates.length > 0
    ? Math.round(
        (dailyRates.reduce((sum, d) => sum + d.completed, 0) /
          Math.max(dailyRates.reduce((sum, d) => sum + d.total, 0), 1)) *
          100,
      )
    : 0;

  const maxStreak = streaks.reduce((max, s) => Math.max(max, s.currentStreak), 0);

  const rates = dailyRates.map((d) => d.rate);
  const svgWidth = 140;
  const svgHeight = 36;
  const padding = 0;
  const chartW = svgWidth - padding * 2;
  const chartH = svgHeight - padding * 2;

  const maxRate = Math.max(...rates, 0.01);
  const points = rates.map((rate, i) => {
    const x = padding + (i / Math.max(rates.length - 1, 1)) * chartW;
    const y = svgHeight - padding - (rate / maxRate) * chartH;
    return { x, y, rate };
  });

  const linePath = points.length > 1
    ? points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
    : points.length === 1
      ? `M${points[0].x},${svgHeight} L${points[0].x},${points[0].y}`
      : '';

  const areaPath = points.length > 1
    ? `${linePath} L${points[points.length - 1].x},${svgHeight} L${points[0].x},${svgHeight} Z`
    : '';

  return (
    <div className="rounded-2xl bg-surface-card border border-surface-border p-5">
      <p className="text-xs text-tertiary uppercase tracking-wide font-medium mb-1">
        Routines
      </p>
      <p className="text-sm text-text-secondary mb-4">
        {scheduledToday.length > 0
          ? `${completedToday}/${totalToday} today \u00B7 ${format(today, 'EEEE, MMMM d')}`
          : `No habits today \u00B7 ${format(today, 'EEEE, MMMM d')}`}
      </p>

      <div className="h-px bg-surface-border mb-5" />

      <div className="flex items-end justify-between gap-4">
        <div className="shrink-0">
          <p className="text-4xl font-bold text-text-primary leading-none tracking-tight">
            {overallRate30}%
          </p>
          <p className="text-[11px] text-tertiary uppercase tracking-wide font-medium mt-1.5">
            30-day rate
          </p>
        </div>

        <div className="flex-1 min-w-0 self-center">
          {points.length > 1 && (
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-9"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="sparkline-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF6B4A" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#FF6B4A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <path d={areaPath} fill="url(#sparkline-fill)" />
              <path d={linePath} fill="none" stroke="#FF6B4A" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>

        {maxStreak > 0 && (
          <div className="shrink-0 text-right">
            <span className="text-sm">🔥</span>
            <span className="text-sm text-text-secondary font-medium ml-1">{maxStreak} days</span>
          </div>
        )}
      </div>
    </div>
  );
}
