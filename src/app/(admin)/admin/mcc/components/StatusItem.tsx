import React from 'react';

export function StatusItem({ label, status, color }: { label: string, status: string, color: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-black text-text-primary uppercase tracking-tighter">{status}</span>
        <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
      </div>
    </div>
  );
}
