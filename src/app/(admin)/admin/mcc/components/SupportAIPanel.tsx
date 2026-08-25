'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BotMessageSquare,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ArrowUpRight,
  ChevronDown,
  AlertOctagon,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { authedFetch } from '@/lib/client/authedFetch';
import { toError } from '@/lib/toError';
import { cn } from '@/lib/ui.foundations';

type Severity = 'critical' | 'high' | 'medium' | 'low';

interface DiagnosticResult {
  severity: Severity;
  category: string;
  probableCause: string;
  recommendedFix: string;
  escalate: boolean;
}

interface DiagnoseResponse {
  ticketId: string;
  diagnostic: DiagnosticResult;
  createdAt: string;
}

interface LiveTicket {
  id: string;
  tenantId: string;
  source: string;
  description: string;
  status: string;
  createdAt: number;
  draft?: {
    suggestedResponse?: string;
    solution?: string;
  };
}

const SEVERITY_STYLES: Record<Severity, { label: string; cls: string }> = {
  critical: { label: 'Critique',  cls: 'text-status-danger border-red-400/30 bg-red-400/10' },
  high:     { label: 'Élevée',    cls: 'text-orange-400 border-orange-400/30 bg-orange-400/10' },
  medium:   { label: 'Moyenne',   cls: 'text-action-primary border-amber-400/30 bg-action-primary/10' },
  low:      { label: 'Faible',    cls: 'text-status-success border-emerald-400/30 bg-emerald-400/10' },
};

export function SupportAIPanel() {
  const [tenantId, setTenantId] = useState('');
  const [description, setDescription] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DiagnoseResponse | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Live incoming tickets queue
  const [incomingTickets, setIncomingTickets] = useState<LiveTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  // Dynamic provider label from MCCAIRegistry
  const [providerLabel, setProviderLabel] = useState("IA");

  useEffect(() => {
    authedFetch("/api/admin/fleet/support-ai/provider-info")
      .then(res => res.ok ? res.json() : null)
      .then((data: { activeProvider?: string; activeModel?: string } | null) => {
        if (data?.activeProvider) {
          const name = data.activeProvider.charAt(0).toUpperCase() + data.activeProvider.slice(1);
          setProviderLabel(data.activeModel ? `${name} (${data.activeModel})` : name);
        }
      })
      .catch(() => {});
  }, []);

  const fetchLiveTickets = useCallback(async () => {
    setLoadingTickets(true);
    try {
      const res = await authedFetch('/api/admin/fleet/support-ai/drafts');
      if (res.ok) {
        const data = await res.json() as { tickets: LiveTicket[] };
        setIncomingTickets(data.tickets || []);
      }
    } catch {
      // Silencieux si hors connexion
    } finally {
      setLoadingTickets(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveTickets();
    const timer = setInterval(fetchLiveTickets, 15000);
    return () => clearInterval(timer);
  }, [fetchLiveTickets]);

  const handleSelectIncoming = (ticket: LiveTicket) => {
    setTenantId(ticket.tenantId);
    setDescription(ticket.description);
    toast.info(`Ticket #${ticket.id.slice(0, 8)} chargé pour analyse`);
  };

  const handleDiagnose = async () => {
    if (!tenantId.trim() || !description.trim()) return;
    setIsLoading(true);
    setResult(null);
    try {
      const res = await authedFetch('/api/admin/fleet/support-ai/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenantId.trim(),
          description: description.trim(),
          ...(screenshotUrl.trim() ? { screenshotUrl: screenshotUrl.trim() } : {}),
        }),
      });
      if (!res.ok) {
        const err = await res.json() as { error?: string };
        throw new Error(err.error ?? String(res.status));
      }
      setResult(await res.json() as DiagnoseResponse);
      fetchLiveTickets();
    } catch (err) {
      toast.error(`Erreur diagnostic : ${toError(err).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEscalate = async () => {
    if (!result) return;
    try {
      const res = await authedFetch('/api/admin/fleet/support-ai/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: result.ticketId, diagnostic: result.diagnostic, tenantId, description }),
      });
      if (res.ok) {
        toast.success(`Ticket ${result.ticketId.slice(0, 8)}… transmis en L1`);
      } else {
        toast.error('Échec de l\'escalade');
      }
    } catch {
      toast.error('Erreur réseau lors de l\'escalade');
    }
  };

  const d = result?.diagnostic;
  const sevStyle = d ? (SEVERITY_STYLES[d.severity] ?? SEVERITY_STYLES.low) : null;

  return (
    <div className="bg-surface-card backdrop-blur-md border border-border-subtle rounded-3xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-action-primary/10 border border-action-primary/20 flex items-center justify-center">
            <BotMessageSquare className="w-5 h-5 text-brand" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-text-primary">SAV L0 — IA & SOS Caisse</h3>
            <p className="text-xs text-secondary">Diagnostic automatique en service • {providerLabel}</p>
          </div>
        </div>

        <button
          onClick={fetchLiveTickets}
          disabled={loadingTickets}
          className="p-2 rounded-xl bg-surface-bg border border-border hover:bg-bg-tertiary text-text-muted transition-all active:scale-95"
          title="Actualiser la file"
        >
          <RefreshCw className={cn('w-4 h-4', loadingTickets && 'animate-spin')} />
        </button>
      </div>

      {/* Live Incoming SOS Queue */}
      {incomingTickets.length > 0 && (
        <div className="space-y-2 p-4 rounded-2xl bg-red-500/5 border border-red-500/20">
          <div className="flex items-center gap-2 text-red-500 font-bold text-xs uppercase tracking-wider">
            <AlertOctagon className="w-4 h-4 animate-pulse" />
            <span>Alertes Tenants en Attente ({incomingTickets.length})</span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto elegant-scrollbar pr-1">
            {incomingTickets.map(t => (
              <div
                key={t.id}
                onClick={() => handleSelectIncoming(t)}
                className="p-3 rounded-xl bg-surface-card border border-border/50 hover:border-red-500/40 cursor-pointer flex items-center justify-between gap-3 transition-all"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-text-primary">[{t.tenantId}]</span>
                    <span className="text-nano text-text-muted flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-text-muted truncate mt-0.5">{t.description}</p>
                </div>

                <button className="px-2.5 py-1 text-nano font-black uppercase tracking-wider rounded-lg bg-action-primary/10 text-brand border border-focus/20 shrink-0">
                  Charger
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Diagnostic Form */}
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Tenant ID (ex: brasserie-du-port)"
          value={tenantId}
          onChange={e => setTenantId(e.target.value)}
          className="w-full bg-surface-bg border border-subtle rounded-xl py-2.5 px-4 text-sm font-mono text-text-primary focus:outline-none focus:border-focus/50 transition-all placeholder:text-muted"
        />
        <textarea
          rows={3}
          placeholder="Décrivez le problème signalé par l'opérateur restaurant…"
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="w-full bg-surface-bg border border-subtle rounded-xl py-2.5 px-4 text-sm text-text-primary resize-none focus:outline-none focus:border-focus/50 transition-all placeholder:text-muted"
        />

        {/* Advanced (screenshot URL) */}
        <button
          onClick={() => setShowAdvanced(v => !v)}
          className="flex items-center gap-1.5 text-nano font-bold uppercase tracking-widest text-muted hover:text-secondary transition-colors"
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          Options avancées
        </button>
        {showAdvanced && (
          <input
            type="url"
            placeholder="URL screenshot (optionnel)"
            value={screenshotUrl}
            onChange={e => setScreenshotUrl(e.target.value)}
            className="w-full bg-surface-bg border border-subtle rounded-xl py-2.5 px-4 text-sm font-mono text-text-primary focus:outline-none focus:border-focus/50 transition-all placeholder:text-muted"
          />
        )}

        <button
          onClick={handleDiagnose}
          disabled={!tenantId.trim() || !description.trim() || isLoading}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-action-primary/20 text-brand border border-focus/30 text-chip-label disabled:opacity-40 transition-all hover:bg-action-primary/30 active:scale-[0.98]"
        >
          {isLoading ? (
            <><Loader2 className="w-4 h-4 animate-spin" />Analyse en cours…</>
          ) : (
            <><BotMessageSquare className="w-4 h-4" />Diagnostiquer avec IA</>
          )}
        </button>
      </div>

      {/* Result */}
      {result && d && sevStyle && (
        <div className="space-y-4 border-t border-border-subtle pt-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-chip-label ${sevStyle.cls}`}>
              {d.severity === 'critical' || d.severity === 'high'
                ? <AlertTriangle className="w-3.5 h-3.5" />
                : <CheckCircle2 className="w-3.5 h-3.5" />}
              {sevStyle.label}
            </span>
            <span className="text-xs text-secondary font-semibold">{d.category}</span>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-nano font-black uppercase tracking-[0.2em] text-muted mb-1.5">Cause probable</p>
              <p className="text-sm text-text-primary/80 leading-relaxed">{d.probableCause}</p>
            </div>
            <div>
              <p className="text-nano font-black uppercase tracking-[0.2em] text-muted mb-1.5">Résolution recommandée</p>
              <p className="text-sm text-text-primary/80 leading-relaxed whitespace-pre-wrap">{d.recommendedFix}</p>
            </div>
          </div>

          {d.escalate && (
            <button
              onClick={handleEscalate}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-status-danger/10 text-status-danger border border-red-500/20 text-chip-label hover:bg-status-danger/20 transition-colors"
            >
              <ArrowUpRight className="w-4 h-4" />
              Escalader en L1
            </button>
          )}

          <p className="text-nano text-muted text-right font-mono">Ticket #{result.ticketId.slice(0, 8)}</p>
        </div>
      )}
    </div>
  );
}
