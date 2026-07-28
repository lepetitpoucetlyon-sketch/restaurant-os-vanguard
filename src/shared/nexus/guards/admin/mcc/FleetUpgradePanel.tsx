"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, AlertTriangle, CheckCircle2, AlertCircle, Globe, Target } from 'lucide-react';
import { cn } from '@/lib/ui.foundations';
import { authedFetch } from '@/lib/client/authedFetch';
import { useNexusFleet } from '@/modules/intelligence/fleet';

type TargetState = 'stable' | 'beta' | 'bleeding-edge';

const STATE_META: Record<TargetState, { label: string; color: string }> = {
  'stable':        { label: 'Stable',        color: 'text-status-success border-emerald-500/30 bg-status-success/10' },
  'beta':          { label: 'Beta',          color: 'text-action-primary   border-action-primary/30   bg-action-primary/10'   },
  'bleeding-edge': { label: 'Bleeding Edge', color: 'text-status-danger     border-red-500/30     bg-status-danger/10'     },
};

export function FleetUpgradePanel() {
  const { instances } = useNexusFleet();

  const [version, setVersion]         = useState('');
  const [targetState, setTargetState] = useState<TargetState>('stable');
  const [otaUrl, setOtaUrl]           = useState('');
  const [notes, setNotes]             = useState('');
  const [breaking, setBreaking]       = useState(false);
  const [scope, setScope]             = useState<'fleet' | 'select'>('fleet');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isPushing, setIsPushing]     = useState(false);
  const [result, setResult]           = useState<{ success: boolean; msg: string; count?: number } | null>(null);

  const toggleId = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handlePush = async () => {
    if (!version.trim()) return;
    setIsPushing(true);
    setResult(null);

    try {
      const body: Record<string, unknown> = {
        version: version.trim(),
        targetState,
        notes:   notes.trim() || undefined,
        breaking,
        otaUrl:  otaUrl.trim() || undefined,
      };
      if (scope === 'select' && selectedIds.size > 0) {
        body.targetIds = Array.from(selectedIds);
      }

      const res  = await authedFetch('/api/admin/fleet/upgrade', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
      const data = await res.json() as { success?: boolean; affectedCount?: number };

      if (data.success) {
        setResult({ success: true, msg: 'Upgrade pushed', count: data.affectedCount });
        setVersion('');
        setNotes('');
        setOtaUrl('');
        setBreaking(false);
        setSelectedIds(new Set());
      } else {
        setResult({ success: false, msg: 'Échec du push' });
      }
    } catch {
      setResult({ success: false, msg: 'Erreur réseau' });
    } finally {
      setIsPushing(false);
    }
  };

  return (
    <div className="p-6 bg-[#161618] border border-white/5 rounded-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-action-primary/10 flex items-center justify-center border border-action-primary/20">
          <Rocket className="w-5 h-5 text-action-primary" />
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-muted">Fleet Upgrade</h3>
          <p className="text-[10px] font-bold text-secondary uppercase tracking-tighter">Push version & release notes</p>
        </div>
      </div>

      {/* Version */}
      <div>
        <label className="text-[9px] font-black uppercase tracking-widest text-secondary block mb-2">Version cible</label>
        <input
          type="text"
          value={version}
          onChange={e => setVersion(e.target.value)}
          placeholder="2.5.0"
          className="w-full bg-bg-primary/50 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-muted focus:outline-none focus:border-white/30"
        />
      </div>

      {/* Target state */}
      <div>
        <label className="text-[9px] font-black uppercase tracking-widest text-secondary block mb-2">Canal</label>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(STATE_META) as TargetState[]).map(s => (
            <button
              key={s}
              onClick={() => setTargetState(s)}
              className={cn(
                'py-2 text-[9px] font-black uppercase tracking-wider rounded-xl border transition-all',
                targetState === s ? STATE_META[s].color : 'bg-bg-primary/30 border-white/5 text-secondary hover:border-white/20'
              )}
            >
              {STATE_META[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Release notes */}
      <div>
        <label className="text-[9px] font-black uppercase tracking-widest text-secondary block mb-2">Release notes</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          placeholder="Ce qui change dans cette version..."
          className="w-full bg-bg-primary/50 border border-white/10 rounded-xl px-4 py-3 text-xs text-muted resize-none focus:outline-none focus:border-white/30"
        />
      </div>

      {/* OTA URL */}
      <div>
        <label className="text-[9px] font-black uppercase tracking-widest text-secondary block mb-2">OTA URL (optionnel)</label>
        <input
          type="text"
          value={otaUrl}
          onChange={e => setOtaUrl(e.target.value)}
          placeholder="https://cdn.example.com/v2.5.0.zip"
          className="w-full bg-bg-primary/50 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-muted focus:outline-none focus:border-white/30"
        />
      </div>

      {/* Breaking change warning */}
      <div
        onClick={() => setBreaking(b => !b)}
        className={cn(
          'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all',
          breaking
            ? 'bg-status-danger/10 border-red-500/30'
            : 'bg-bg-primary/30 border-white/5 hover:border-white/10'
        )}
      >
        <AlertTriangle className={cn('w-4 h-4 shrink-0', breaking ? 'text-status-danger' : 'text-secondary')} />
        <div className="flex-1">
          <p className={cn('text-[10px] font-black uppercase tracking-widest', breaking ? 'text-status-danger' : 'text-secondary')}>
            Breaking change
          </p>
          <p className="text-[9px] text-secondary">Déclenche une alerte critique dans l'audit</p>
        </div>
        <div className={cn(
          'w-4 h-4 rounded border-2 flex items-center justify-center transition-all',
          breaking ? 'bg-status-danger border-red-400' : 'border-white/20'
        )}>
          {breaking && <span className="text-text-primary text-[8px]">✓</span>}
        </div>
      </div>

      {/* Scope selector */}
      <div>
        <label className="text-[9px] font-black uppercase tracking-widest text-secondary block mb-2">Cible</label>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            onClick={() => setScope('fleet')}
            className={cn(
              'flex items-center justify-center gap-2 py-2.5 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all',
              scope === 'fleet' ? 'bg-action-primary/20 border-action-primary/40 text-amber-300' : 'bg-bg-primary/30 border-white/5 text-secondary hover:border-white/20'
            )}
          >
            <Globe className="w-3.5 h-3.5" />
            Toute la flotte ({instances.length})
          </button>
          <button
            onClick={() => setScope('select')}
            className={cn(
              'flex items-center justify-center gap-2 py-2.5 rounded-xl border text-[9px] font-black uppercase tracking-wider transition-all',
              scope === 'select' ? 'bg-action-primary/20 border-action-primary/40 text-amber-300' : 'bg-bg-primary/30 border-white/5 text-secondary hover:border-white/20'
            )}
          >
            <Target className="w-3.5 h-3.5" />
            Sélection
          </button>
        </div>

        {/* Tenant checklist */}
        {scope === 'select' && (
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {instances.map(inst => (
              <button
                key={inst.id}
                onClick={() => toggleId(inst.id)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition-all',
                  selectedIds.has(inst.id)
                    ? 'bg-action-primary/10 border-action-primary/30 text-amber-300'
                    : 'bg-bg-primary/20 border-white/5 text-secondary hover:border-white/10'
                )}
              >
                <div className={cn(
                  'w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0',
                  selectedIds.has(inst.id) ? 'bg-action-primary border-amber-400' : 'border-white/20'
                )}>
                  {selectedIds.has(inst.id) && <span className="text-[7px] text-text-primary">✓</span>}
                </div>
                <span className="truncate">{inst.name ?? inst.id}</span>
                <span className="font-mono text-[9px] text-secondary/60 ml-auto">{inst.id}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Push button */}
      <button
        onClick={handlePush}
        disabled={isPushing || !version.trim() || (scope === 'select' && selectedIds.size === 0)}
        className={cn(
          'w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all',
          'bg-action-primary hover:bg-action-primary text-black',
          'disabled:opacity-40 disabled:cursor-not-allowed',
          isPushing && 'animate-pulse'
        )}
      >
        <Rocket className="w-4 h-4" />
        {isPushing ? 'Push en cours...' : `Push ${version || 'version'}`}
      </button>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={cn(
              'flex items-center gap-2 p-3 rounded-xl border text-[10px] font-black uppercase tracking-widest',
              result.success
                ? 'bg-status-success/10 text-status-success border-emerald-500/20'
                : 'bg-status-danger/10 text-status-danger border-red-500/20'
            )}
          >
            {result.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
            {result.msg}
            {result.count && ` — ${result.count} tenant(s)`}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
