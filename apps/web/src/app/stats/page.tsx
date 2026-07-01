'use client';

import { AppShell } from '@/components/AppShell';
import { useHabits } from '@/hooks/useHabits';
import { SummaryCards } from '@/components/SummaryCards';
import { MonthlyCalendar } from '@/components/MonthlyCalendar';
import { YearlyHeatmap } from '@/components/YearlyHeatmap';
import { EmptyState } from '@/components/EmptyState';
import { BarChart3 } from 'lucide-react';

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
                <div key={i} className="h-20 rounded-[10px] bg-surface-card animate-pulse" />
              ))}
            </div>
            <div className="h-64 rounded-[10px] bg-surface-card animate-pulse" />
            <div className="h-40 rounded-[10px] bg-surface-card animate-pulse" />
          </div>
        ) : !habits || habits.length === 0 ? (
          <EmptyState
            icon={<BarChart3 size={28} className="text-accent" />}
            title="No data yet"
            description="Start completing habits to see your stats."
          />
        ) : (
          <div className="space-y-6">
            <SummaryCards />
            <MonthlyCalendar />
            <YearlyHeatmap />
          </div>
        )}
      </div>
    </AppShell>
  );
}
