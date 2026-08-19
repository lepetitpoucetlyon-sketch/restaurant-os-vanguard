'use client';

import { useCallback, useEffect, useState } from 'react';
import { authedFetch } from '@/lib/client/authedFetch';
import { AlertTriangle, RefreshCw, Play, Trash2 } from 'lucide-react';

/**
 * MCC DLQ Dashboard — voir et rejouer les événements en Dead Letter Queue.
 *
 * @see Chantier I du PLAN_CONSOLIDATION (silence killer : DLQ existe mais aucune UI)
 * @see /api/admin/dlq/list — liste server-side
 * @see /api/admin/dlq/replay — rejeu manuel
 */

interface DLQEntry {
  id: string;
  eventName: string;
  handlerId: string;
  tenantId: string;
  attempts: number;
  status: 'retry' | 'quarantine';
  nextRetryAt: number;
  failedAt: number;
  error: string;
  payload: Record<string, unknown>;
}

export default function DLQDashboard() {
  const [entries, setEntries] = useState<DLQEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'' | 'retry' | 'quarantine'>('');
  const [tenantFilter, setTenantFilter] = useState('');
  const [replaying, setReplaying] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (tenantFilter.trim()) params.set('tenantId', tenantFilter.trim());
      const res = await authedFetch(`/api/admin/dlq/list?${params.toString()}`);
      if (res.ok) {
        const data = (await res.json()) as { entries: DLQEntry[] };
        setEntries(data.entries ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, tenantFilter]);

  useEffect(() => { load(); }, [load]);

  const handleReplay = async (entry: DLQEntry) => {
    if (!confirm(`Rejouer ${entry.eventName} pour ${entry.tenantId} ?`)) return;
    setReplaying(entry.id);
    try {
      const res = await authedFetch('/api/admin/dlq/replay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: entry.tenantId, eventId: entry.id }),
      });
      if (res.ok) {
        await load();
      } else {
        const err = (await res.json()) as { error?: string };
        alert(`Replay échoué : ${err.error ?? 'inconnu'}`);
      }
    } finally {
      setReplaying(null);
    }
  };

  const alertLevel = entries.length > 100 ? 'critical' : entries.length > 10 ? 'warning' : 'ok';

  return (
    <div className="p-8 min-h-screen bg-surface-bg text-text-primary">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-status-warning" />
            Dead Letter Queue
          </h1>
          <p className="text-secondary text-sm mt-1">
            Événements en échec après {5} tentatives. Rejouer via IdempotencyGuard (safe).
          </p>
        </div>

        <div className={`px-4 py-2 rounded-xl border text-xs font-black uppercase tracking-widest ${
          alertLevel === 'critical' ? 'bg-status-danger/10 border-red-500/30 text-red-400' :
          alertLevel === 'warning'  ? 'bg-status-warning/10 border-amber-500/30 text-amber-400' :
                                       'bg-status-success/10 border-emerald-500/30 text-emerald-400'
        }`}>
          {entries.length} événement{entries.length !== 1 ? 's' : ''} en DLQ
        </div>
      </header>

      <div className="mb-6 flex flex-wrap gap-3 items-center bg-surface-card p-4 rounded-2xl border border-border-subtle">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as '' | 'retry' | 'quarantine')}
          className="bg-surface-bg border border-border-subtle rounded-xl py-2 px-4 text-sm"
        >
          <option value="">Tous les statuts</option>
          <option value="retry">Retry (en attente)</option>
          <option value="quarantine">Quarantine (échec définitif)</option>
        </select>

        <input
          type="text"
          placeholder="Filtrer par tenantId"
          value={tenantFilter}
          onChange={(e) => setTenantFilter(e.target.value)}
          className="bg-surface-bg border border-border-subtle rounded-xl py-2 px-4 text-sm font-mono"
        />

        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 bg-surface-bg border border-border-subtle px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-surface-hover disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Rafraîchir
        </button>
      </div>

      <div className="rounded-2xl border border-border-subtle overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-card text-xs font-bold uppercase tracking-widest text-secondary">
            <tr>
              <th className="text-left px-4 py-3">Event</th>
              <th className="text-left px-4 py-3">Tenant</th>
              <th className="text-left px-4 py-3">Handler</th>
              <th className="text-center px-4 py-3">Tentatives</th>
              <th className="text-center px-4 py-3">Statut</th>
              <th className="text-left px-4 py-3">Dernière erreur</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-secondary italic">
                  {loading ? 'Chargement…' : 'Aucun événement en DLQ 🎉'}
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry.id} className="border-t border-border-subtle hover:bg-surface-hover">
                  <td className="px-4 py-3 font-mono text-xs">{entry.eventName}</td>
                  <td className="px-4 py-3 font-mono text-xs">{entry.tenantId}</td>
                  <td className="px-4 py-3 font-mono text-xs text-secondary">{entry.handlerId}</td>
                  <td className="px-4 py-3 text-center font-mono">{entry.attempts} / 5</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                      entry.status === 'quarantine' ? 'bg-status-danger/20 text-red-400' : 'bg-status-warning/20 text-amber-400'
                    }`}>
                      {entry.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-secondary truncate max-w-md" title={entry.error}>
                    {entry.error}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleReplay(entry)}
                      disabled={replaying === entry.id}
                      className="inline-flex items-center gap-1.5 bg-status-success/10 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-status-success/20 disabled:opacity-50"
                    >
                      <Play className="w-3 h-3" />
                      Rejouer
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <footer className="mt-8 text-xs text-secondary italic text-center">
        Chantier I du PLAN_CONSOLIDATION — silence killer résolu. Les alertes threshold (β-4) suivront.
      </footer>
    </div>
  );
}
