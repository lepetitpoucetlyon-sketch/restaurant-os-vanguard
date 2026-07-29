"use client";

import React, { useState } from 'react';
import { ShieldAlert, DatabaseBackup, ActivitySquare, Loader2, RotateCcw } from 'lucide-react';
import { useFleet } from '@/shared/contexts/FleetContext';
import { toast } from 'sonner';

export function DisasterRecoveryPanel() {
  const { instances } = useFleet();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const toggleShadowMode = async (tenantId: string) => {
    setLoadingAction(`shadow-${tenantId}`);
    try {
      // Pour la démo, on bascule en 'local_survival' (Offline Cloud)
      const res = await fetch('/api/admin/fleet/shadow-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, mode: 'local_survival' })
      });
      if (!res.ok) throw new Error('Shadow mode error');
      toast.success(`Shadow Mode activé pour ${tenantId} (Local Survival)`);
    } catch (e) {
      toast.error('Erreur lors de la bascule en Shadow Mode');
    } finally {
      setLoadingAction(null);
    }
  };

  const triggerGlobalBackup = async () => {
    setLoadingAction('backup');
    try {
      const res = await fetch('/api/admin/fleet/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}) // Vide = toute la flotte
      });
      if (!res.ok) throw new Error('Backup error');
      const data = await res.json();
      toast.success(`Sauvegarde globale déclenchée (${data.succeeded} succès)`);
    } catch (e) {
      toast.error('Erreur lors du déclenchement de la sauvegarde');
    } finally {
      setLoadingAction(null);
    }
  };

  const triggerRestore = async (tenantId: string) => {
    // Dans la vraie vie on demanderait l'heure cible et la raison. Pour la démo :
    const targetTimestamp = new Date(Date.now() - 3600 * 1000).toISOString(); // Il y a 1h
    const reason = 'PRA Automatique (1-Click Restore)';
    const operatorId = 'mcc_operator_1';

    if (!confirm(`Restauration PITR pour ${tenantId} ? (Attention, annule les écritures depuis 1h)`)) {
      return;
    }

    setLoadingAction(`restore-${tenantId}`);
    try {
      const res = await fetch('/api/admin/fleet/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, targetTimestamp, reason, operatorId })
      });
      if (!res.ok) throw new Error('Restore error');
      toast.success(`Restauration initiée pour ${tenantId}`);
    } catch (e) {
      toast.error('Erreur lors de la restauration');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="p-6 bg-surface-card backdrop-blur-md border border-rose-500/30 rounded-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <ShieldAlert className="w-48 h-48 text-rose-500" />
      </div>

      <div className="flex items-center justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-500/10 rounded-xl border border-rose-500/20 text-rose-500">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-text-primary">Plan de Reprise d'Activité (PRA)</h3>
            <p className="text-xs text-secondary">Restauration Firestore PITR & Sauvegarde Globale</p>
          </div>
        </div>

        <button 
          onClick={triggerGlobalBackup}
          disabled={loadingAction === 'backup'}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors disabled:opacity-50"
        >
          {loadingAction === 'backup' ? <Loader2 className="w-4 h-4 animate-spin" /> : <DatabaseBackup className="w-4 h-4" />}
          Sauvegarde Globale
        </button>
      </div>

      <div className="space-y-3 relative z-10">
        {instances.map(inst => (
          <div key={inst.id} className="flex items-center justify-between p-4 bg-surface-card border border-border-subtle rounded-xl">
            <div className="flex items-center gap-3">
              <ActivitySquare className="w-5 h-5 text-secondary" />
              <div>
                <div className="text-sm font-bold">{inst.name || inst.id}</div>
                <div className="text-[10px] text-secondary font-mono">ID: {inst.id}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleShadowMode(inst.id)}
                disabled={loadingAction === `shadow-${inst.id}`}
                className="px-3 py-1.5 flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-[10px] font-black uppercase tracking-widest rounded-lg border border-amber-500/20 transition-colors disabled:opacity-50"
              >
                {loadingAction === `shadow-${inst.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                Mode Survie
              </button>
              <button
                onClick={() => triggerRestore(inst.id)}
                disabled={loadingAction === `restore-${inst.id}`}
                className="px-3 py-1.5 flex items-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-[10px] font-black uppercase tracking-widest rounded-lg border border-rose-500/20 transition-colors disabled:opacity-50"
              >
                {loadingAction === `restore-${inst.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                Restauration 1-Clic
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
