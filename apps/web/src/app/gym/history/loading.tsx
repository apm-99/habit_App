export default function GymHistoryLoading() {
  return (
    <div className="px-5 pt-14 pb-24">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-[22px] h-[22px] rounded bg-surface-card animate-pulse" />
        <div className="h-6 w-20 rounded bg-surface-card animate-pulse" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[80px] rounded-2xl bg-surface-card animate-pulse" />
        ))}
      </div>
    </div>
  );
}
