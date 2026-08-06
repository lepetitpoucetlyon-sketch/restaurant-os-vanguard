'use client';

export function VerticalPageStub({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-center p-8">
      <p className="text-2xl">🚧</p>
      <p className="text-sm font-black uppercase tracking-widest text-secondary">{title}</p>
      <p className="text-xs text-muted">Module en cours de développement</p>
    </div>
  );
}
