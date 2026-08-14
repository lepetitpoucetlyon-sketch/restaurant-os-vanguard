export default function KdsLoading() {
  return (
    <div className="min-h-screen bg-surface-bg p-6 animate-pulse">
      <div className="h-10 w-48 rounded bg-surface-card mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-surface-card p-4 space-y-3">
            <div className="h-6 w-24 rounded bg-surface-bg" />
            <div className="h-4 w-32 rounded bg-surface-bg" />
            <div className="space-y-2 mt-4">
              <div className="h-3 rounded bg-surface-bg" />
              <div className="h-3 w-5/6 rounded bg-surface-bg" />
              <div className="h-3 w-4/6 rounded bg-surface-bg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
