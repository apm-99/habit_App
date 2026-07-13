export default function TodayLoading() {
  return (
    <div className="px-5 pt-14 pb-24">
      <div className="h-9 w-24 rounded bg-surface-card animate-pulse mb-2" />
      <div className="h-4 w-40 rounded bg-surface-card animate-pulse mb-5" />
      <div className="rounded-xl bg-surface-card border border-surface-border px-4 py-3.5 mb-5">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-6 w-12 rounded bg-elevated animate-pulse" />
            <div className="h-2.5 w-16 rounded bg-elevated animate-pulse" />
          </div>
          <div className="h-7 w-28 rounded bg-elevated animate-pulse" />
          <div className="h-4 w-14 rounded bg-elevated animate-pulse" />
        </div>
      </div>
      <div className="flex justify-center gap-[18px] mb-5">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <div className="w-[42px] h-[42px] rounded-full bg-surface-card animate-pulse" />
            <div className="h-2.5 w-6 rounded bg-surface-card animate-pulse" />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[52px] rounded-2xl bg-surface-card animate-pulse" />
        ))}
      </div>
    </div>
  );
}
