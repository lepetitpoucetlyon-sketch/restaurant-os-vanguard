export default function PosLoading() {
  return (
    <div className="min-h-screen bg-surface-bg animate-pulse">
      <div className="flex h-screen">
        <div className="flex-1 p-6 space-y-4">
          <div className="h-12 w-64 rounded-lg bg-surface-card" />
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-surface-card" />
            ))}
          </div>
        </div>
        <aside className="w-96 border-l border-border-default p-6 space-y-3">
          <div className="h-8 w-32 rounded bg-surface-card" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-surface-card" />
          ))}
          <div className="h-12 rounded-lg bg-action-primary/30 mt-6" />
        </aside>
      </div>
    </div>
  );
}
