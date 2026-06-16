import { AppShell } from '@/components/AppShell';

export default function TodayPage() {
  return (
    <AppShell>
      <div className="px-6 pt-10">
        <h1 className="text-xl font-semibold text-text-primary">Today</h1>
        <p className="text-sm text-text-secondary mt-1">Your habits for today</p>
      </div>
    </AppShell>
  );
}
