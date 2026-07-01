'use client';

import { useDailyRates, useStreaks } from '@/hooks/useStats';

export function StreakChart() {
  const dailyRates = useDailyRates(30);
  const streaks = useStreaks();

  if (!dailyRates || !streaks) return null;

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
  const svgHeight = 32;
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
    <div className="rounded-xl bg-surface-card border border-surface-border px-4 py-3.5 mb-5">
      <div className="flex items-center justify-between gap-4">
        <div className="shrink-0">
          <p className="text-[22px] font-[600] text-text-primary leading-none tracking-[-0.02em]">
            {overallRate30}%
          </p>
          <p className="text-[10px] text-tertiary uppercase tracking-[0.06em] font-medium mt-1">
            30-day rate
          </p>
        </div>

        <div className="flex-1 min-w-0 self-center">
          {points.length > 1 && (
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-7"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="sparkline-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FF6B4A" stopOpacity={0.06} />
                  <stop offset="100%" stopColor="#FF6B4A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <path d={areaPath} fill="url(#sparkline-fill)" />
              <path d={linePath} fill="none" stroke="#FF6B4A" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>

        {maxStreak > 0 && (
          <div className="shrink-0 text-right">
            <span className="text-[13px] text-text-secondary font-medium">{maxStreak}d streak</span>
          </div>
        )}
      </div>
    </div>
  );
}
