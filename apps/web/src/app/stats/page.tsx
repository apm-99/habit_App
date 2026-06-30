'use client';

import { AppShell } from '@/components/AppShell';
import { useHabits } from '@/hooks/useHabits';
import { SummaryCards } from '@/components/SummaryCards';
import { StreakChart } from '@/components/StreakChart';
import { MonthlyCalendar } from '@/components/MonthlyCalendar';
import { YearlyHeatmap } from '@/components/YearlyHeatmap';

export default function StatsPage() {
  const { data: habits, isLoading } = useHabits();

  return (
    <AppShell>
      <div className="px-5 pt-14 pb-24">
        <h1 className="text-[36px] font-[500] tracking-[-0.02em] text-text-primary leading-tight">Statistics</h1>
        <p className="text-[15px] text-text-secondary mt-0.5 mb-6">Your progress at a glance</p>

        {isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-[10px] bg-card animate-pulse" />
              ))}
            </div>
            <div className="h-64 rounded-[10px] bg-card animate-pulse" />
            <div className="h-40 rounded-[10px] bg-card animate-pulse" />
          </div>
        ) : !habits || habits.length === 0 ? (
          <div className="text-center pt-20">
            <h2 className="text-[22px] font-[400] tracking-[-0.01em] text-text-primary">No data yet</h2>
            <p className="text-[15px] text-text-secondary mt-2.5">Start completing habits to see your stats.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <StreakChart />
            <SummaryCards />
            <MonthlyCalendar />
            <YearlyHeatmap />
          </div>
        )}
      </div>
    </AppShell>
  );
}
