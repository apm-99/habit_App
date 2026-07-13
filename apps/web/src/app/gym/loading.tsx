export default function GymLoading() {
  return (
    <div className="px-5 pt-14 pb-24">
      <div className="h-9 w-20 rounded bg-surface-card animate-pulse mb-2" />
      <div className="h-4 w-32 rounded bg-surface-card animate-pulse mb-5" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[80px] rounded-2xl bg-surface-card animate-pulse" />
        ))}
      </div>
    </div>
  );
}
