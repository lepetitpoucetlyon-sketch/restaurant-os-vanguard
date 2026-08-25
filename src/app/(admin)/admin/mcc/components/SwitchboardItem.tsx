import React from 'react';

export function SwitchboardItem({ label, active, onToggle }: { label: string, active: boolean, onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-nano font-bold text-secondary uppercase tracking-widest">{label}</span>
      <div className="flex items-center gap-3">
        <span className={`text-nano font-black uppercase tracking-tighter ${active ? 'text-status-success' : 'text-status-danger'}`}>
          {active ? 'EN LIGNE' : 'HORS LIGNE'}
        </span>
        <button
          onClick={onToggle}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${active ? 'bg-status-success/20 border border-emerald-500/50' : 'bg-status-danger/20 border border-red-500/50'}`}
        >
          <span className={`inline-block h-3 w-3 transform rounded-full transition-transform ${active ? 'translate-x-5 bg-status-success' : 'translate-x-1 bg-status-danger'}`} />
        </button>
      </div>
    </div>
  );
}
