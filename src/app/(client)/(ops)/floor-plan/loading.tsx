export default function FloorPlanLoading() {
  return (
    <div className="min-h-screen bg-surface-bg p-6 animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="h-10 w-48 rounded bg-surface-card" />
        <div className="flex gap-2">
          <div className="h-10 w-24 rounded bg-surface-card" />
          <div className="h-10 w-24 rounded bg-surface-card" />
        </div>
      </div>
      <div className="rounded-2xl bg-surface-card h-[70vh] relative overflow-hidden">
        <div className="absolute inset-0 grid grid-cols-6 gap-6 p-8">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="rounded-full bg-surface-bg aspect-square" />
          ))}
        </div>
      </div>
    </div>
  );
}
