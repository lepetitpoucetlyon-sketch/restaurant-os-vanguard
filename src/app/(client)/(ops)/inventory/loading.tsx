export default function InventoryLoading() {
  return (
    <div className="min-h-screen bg-surface-bg p-6 animate-pulse">
      <div className="h-10 w-56 rounded bg-surface-card mb-6" />
      <div className="grid grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-surface-card h-24" />
        ))}
      </div>
      <div className="rounded-2xl bg-surface-card">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b border-border-default last:border-0">
            <div className="w-12 h-12 rounded-lg bg-surface-bg" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/3 rounded bg-surface-bg" />
              <div className="h-3 w-1/5 rounded bg-surface-bg" />
            </div>
            <div className="h-8 w-20 rounded bg-surface-bg" />
          </div>
        ))}
      </div>
    </div>
  );
}
