'use client';

import React from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { MCCWidgetSkeleton } from '@nexus/guards/admin/mcc/MCCWidgetSkeleton';

const DeviceManager = dynamic(
  () => import('@nexus/guards/admin/mcc/DeviceManager').then(mod => mod.DeviceManager),
  { loading: () => <MCCWidgetSkeleton /> }
);

/**
 * 🧩 MCC Dashboard — sous-composants présentationnels
 * Extraits de page.tsx (dette-1) pour réduire le god file et isoler l'UI pure.
 */

export function StatCard({ label, value, icon, trend, isWarning = false }: { label: string, value: string, icon: React.ReactNode, trend: string, isWarning?: boolean }) {
  return (
    <div className={`p-6 bg-white/5 backdrop-blur-md border ${isWarning ? 'border-amber-500/20' : 'border-white/10'} rounded-2xl relative overflow-hidden group hover:border-white/20 transition-all`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 group-hover:bg-white/10 transition-all" />
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="p-3 bg-white/5 rounded-xl group-hover:bg-white/10 transition-all">
          {icon}
        </div>
        {isWarning && <div className="w-2.5 h-2.5 rounded-full bg-status-warning shadow-[0_0_10px_rgba(245,158,11,0.5)]" />}
      </div>
      <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1 relative z-10">{label}</h3>
      <div className="text-3xl font-bold mb-2 tracking-tight text-white relative z-10">{value}</div>
      <p className="text-[10px] font-medium text-slate-500 uppercase tracking-tighter relative z-10">{trend}</p>
    </div>
  );
}

// mcc-users-6 — DeviceManager accessible depuis l'onglet Intelligence
export function DeviceManagerPanel() {
  const [uid, setUid] = React.useState('');
  const [submitted, setSubmitted] = React.useState('');
  return (
    <div className="bg-[#0f0f11] border border-white/5 rounded-3xl p-6 space-y-4">
      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted">Device Management</h3>
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="User UID…"
          value={uid}
          onChange={e => setUid(e.target.value)}
          className="flex-1 bg-slate-950 border border-subtle rounded-xl py-2.5 px-4 text-sm font-mono focus:outline-none focus:border-focus/50 transition-all text-white"
        />
        <button
          onClick={() => setSubmitted(uid.trim())}
          disabled={!uid.trim()}
          className="px-4 py-2.5 bg-action-primary/20 text-brand border border-focus/30 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-40 transition-all hover:bg-action-primary/30"
        >
          Inspecter
        </button>
      </div>
      {submitted && <DeviceManager uid={submitted} />}
    </div>
  );
}

export function TabButton({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`pb-4 px-2 flex items-center gap-2 border-b-2 transition-all ${active ? 'border-focus text-white' : 'border-transparent text-secondary hover:text-muted'}`}
    >
      <div className={`${active ? 'text-brand' : 'text-secondary'}`}>
        {icon}
      </div>
      <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
      {active && <motion.div layoutId="activeTabDot" className="w-1 h-1 rounded-full bg-action-primary" />}
    </button>
  );
}

export function StatusItem({ label, status, color }: { label: string, status: string, color: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-black text-white uppercase tracking-tighter">{status}</span>
        <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
      </div>
    </div>
  );
}

export function SwitchboardItem({ label, active, onToggle }: { label: string, active: boolean, onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">{label}</span>
      <div className="flex items-center gap-3">
        <span className={`text-[10px] font-black uppercase tracking-tighter ${active ? 'text-status-success' : 'text-status-danger'}`}>
          {active ? 'ONLINE' : 'OFFLINE'}
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
