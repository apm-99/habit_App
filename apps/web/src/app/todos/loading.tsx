export default function TodosLoading() {
  return (
    <div className="px-5 pt-14 pb-24">
      <div className="h-9 w-20 rounded bg-surface-card animate-pulse mb-2" />
      <div className="h-4 w-40 rounded bg-surface-card animate-pulse mb-5" />
      <div className="h-[44px] rounded-[10px] bg-surface-card animate-pulse mb-6" />
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[52px] rounded-2xl bg-surface-card animate-pulse" />
        ))}
      </div>
    </div>
  );
}
