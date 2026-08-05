'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { BrainCircuit, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface AIPatch {
  id: string;
  ticketId: string;
  description: string;
  codeDiff: string;
  confidenceScore: number;
  status: 'PENDING' | 'DEPLOYED' | 'REJECTED';
  createdAt?: string;
}

const STATUS_STYLES: Record<AIPatch['status'], string> = {
  PENDING:  'bg-status-warning/10 text-status-warning border-action-primary/30',
  DEPLOYED: 'bg-status-success/10 text-status-success border-emerald-500/30',
  REJECTED: 'bg-status-danger/10 text-status-danger border-rose-500/30',
};

export const AIWorkshop: React.FC = () => {
  const [patches, setPatches] = useState<AIPatch[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPatches = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await Nexus.adapter.query<AIPatch>('mcc/aiPatches');
      setPatches(raw ?? []);
    } catch (err) {
      logger.warn('[AIWorkshop] Failed to load patches', String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPatches(); }, [loadPatches]);

  const updateStatus = async (patch: AIPatch, status: 'DEPLOYED' | 'REJECTED') => {
    try {
      await Nexus.adapter.set(`mcc/aiPatches/${patch.id}`, { status }, { merge: true });
      empireAudit.log({
        module: 'system',
        action: status === 'DEPLOYED' ? 'AI_PATCH_DEPLOYED' : 'AI_PATCH_REJECTED',
        severity: 'medium',
        details: { patchId: patch.id, ticketId: patch.ticketId } as unknown as import('@/shared/nexus-contract').SovereignData,
        timestamp: new Date(),
      });
      setPatches(prev => prev.map(p => p.id === patch.id ? { ...p, status } : p));
    } catch (err) {
      logger.error('[AIWorkshop] Status update failed', err);
    }
  };

  return (
    <div className="bg-surface-card border border-border-subtle rounded-3xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-action-primary/10 rounded-xl flex items-center justify-center border border-focus/20">
            <BrainCircuit className="w-5 h-5 text-brand" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted">NAM Workshop</h3>
            <p className="text-sm font-bold text-text-primary">Neural Patches</p>
          </div>
        </div>
        <button
          onClick={loadPatches}
          className="p-2 bg-surface-card hover:bg-surface-hover rounded-xl border border-border-subtle transition-all"
          title="Rafraîchir"
        >
          <RefreshCw className={`w-4 h-4 text-secondary ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-secondary text-xs font-bold uppercase tracking-widest">Chargement…</div>
      ) : patches.length === 0 ? (
        <div className="text-center py-8 border border-dashed border-border-subtle rounded-2xl">
          <p className="text-secondary text-xs italic">Aucun patch NAM en attente.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {patches.map(patch => (
            <div key={patch.id} className="border border-border-subtle rounded-2xl p-4 bg-surface-card space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono text-brand">{patch.ticketId}</span>
                  <p className="text-sm font-bold text-text-primary mt-0.5">{patch.description}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border tracking-widest ${STATUS_STYLES[patch.status]}`}>
                    {patch.status}
                  </span>
                  <span className="text-[10px] text-secondary font-mono">
                    {(patch.confidenceScore * 100).toFixed(0)}% confidence
                  </span>
                </div>
              </div>
              <div className="overflow-x-auto rounded-xl bg-surface-card p-3 border border-border-subtle">
                <pre className="text-[10px] font-mono text-status-success whitespace-pre-wrap">{patch.codeDiff}</pre>
              </div>
              {patch.status === 'PENDING' && (
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => updateStatus(patch, 'DEPLOYED')}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-status-success/10 hover:bg-status-success/20 text-status-success border border-emerald-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Deploy
                  </button>
                  <button
                    onClick={() => updateStatus(patch, 'REJECTED')}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-status-danger/10 hover:bg-status-danger/20 text-status-danger border border-rose-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
