import React from 'react';

export function StatCard({ label, value, icon, trend, isWarning = false }: { label: string, value: string, icon: React.ReactNode, trend: string, isWarning?: boolean }) {
  return (
    <div className={`p-6 bg-surface-card backdrop-blur-md border ${isWarning ? 'border-action-primary/20' : 'border-border-subtle'} rounded-2xl relative overflow-hidden group hover:border-border-subtle transition-all`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-surface-card rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-surface-hover transition-all" />
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="p-3 bg-surface-card rounded-xl group-hover:bg-surface-hover transition-all">
          {icon}
        </div>
        {isWarning && <div className="w-2.5 h-2.5 rounded-full bg-status-warning shadow-[0_0_10px_rgba(245,158,11,0.5)]" />}
      </div>
      <h3 className="text-text-secondary text-[10px] font-black uppercase tracking-widest mb-1 relative z-10">{label}</h3>
      <div className="text-3xl font-bold mb-2 tracking-tight text-text-primary relative z-10">{value}</div>
      <p className="text-[10px] font-medium text-text-muted uppercase tracking-tighter relative z-10">{trend}</p>
    </div>
  );
}
