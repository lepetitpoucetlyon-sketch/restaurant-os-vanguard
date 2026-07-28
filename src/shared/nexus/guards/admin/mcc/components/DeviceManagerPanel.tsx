import React from 'react';
import dynamic from 'next/dynamic';
import { MCCWidgetSkeleton } from '../MCCWidgetSkeleton';

const DeviceManager = dynamic(
  () => import('@nexus/guards/admin/mcc/DeviceManager').then(mod => mod.DeviceManager),
  { loading: () => <MCCWidgetSkeleton /> }
);

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
          className="flex-1 bg-surface-bg border border-subtle rounded-xl py-2.5 px-4 text-sm font-mono focus:outline-none focus:border-focus/50 transition-all text-text-primary"
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
