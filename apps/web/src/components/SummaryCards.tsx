'use client';

import { useStreaks, useCompletionRate } from '@/hooks/useStats';

export function SummaryCards() {
  const streaks = useStreaks();
  const rateData = useCompletionRate(1);

  const currentStreak = streaks?.reduce((max, s) => Math.max(max, s.currentStreak), 0) ?? 0;
  const longestStreak = streaks?.reduce((max, s) => Math.max(max, s.longestStreak), 0) ?? 0;
  const overallRate = rateData?.overall ?? 0;

  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="rounded-[10px] bg-card p-4 text-center">
        <p className="text-[22px] font-bold text-[#5AC8FA]">{currentStreak}</p>
        <p className="text-[11px] text-text-secondary mt-1 font-medium">Current</p>
      </div>
      <div className="rounded-[10px] bg-card p-4 text-center">
        <p className="text-[22px] font-bold text-[#30D158]">{longestStreak}</p>
        <p className="text-[11px] text-text-secondary mt-1 font-medium">Best</p>
      </div>
      <div className="rounded-[10px] bg-card p-4 text-center">
        <p className="text-[22px] font-bold text-[#3E6AE1]">{overallRate}%</p>
        <p className="text-[11px] text-text-secondary mt-1 font-medium">Rate</p>
      </div>
    </div>
  );
}
