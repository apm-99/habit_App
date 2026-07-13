export default function StatsLoading() {
  return (
    <div className="px-5 pt-14 pb-24">
      <div className="h-9 w-32 rounded bg-surface-card animate-pulse mb-2" />
      <div className="h-4 w-44 rounded bg-surface-card animate-pulse mb-6" />
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-[10px] bg-surface-card animate-pulse" />
          ))}
        </div>
        <div className="h-64 rounded-[10px] bg-surface-card animate-pulse" />
        <div className="h-40 rounded-[10px] bg-surface-card animate-pulse" />
      </div>
    </div>
  );
}
