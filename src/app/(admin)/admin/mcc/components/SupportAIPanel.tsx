'use client';

import { useState } from 'react';
import { BotMessageSquare, AlertTriangle, CheckCircle2, Loader2, ArrowUpRight, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { authedFetch } from '@/lib/client/authedFetch';
import { toError } from "@/lib/toError";

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
    <div className="bg-surface-card backdrop-blur-md border border-border-subtle rounded-3xl p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-action-primary/10 border border-action-primary/20 flex items-center justify-center">
          <BotMessageSquare className="w-5 h-5 text-brand" />
        </div>
        <div>
          <h3 className="text-sm font-black uppercase tracking-[0.2em] text-text-primary">SAV L0 — IA</h3>
          <p className="text-xs text-secondary">Diagnostic automatique • Gemini Flash</p>
        </div>
      </div>

      {/* Form */}
      <div className="space-y-3">
        <input
          type="text"
          placeholder="Tenant ID (ex: brasserie-du-port)"
          value={tenantId}
          onChange={e => setTenantId(e.target.value)}
          className="w-full bg-surface-bg border border-subtle rounded-xl py-2.5 px-4 text-sm font-mono text-text-primary focus:outline-none focus:border-focus/50 transition-all placeholder:text-muted"
        />
        <textarea
          rows={4}
          placeholder="Décrivez le problème signalé par l'opérateur restaurant…"
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="w-full bg-surface-bg border border-subtle rounded-xl py-2.5 px-4 text-sm text-text-primary resize-none focus:outline-none focus:border-focus/50 transition-all placeholder:text-muted"
        />

        {/* Advanced (screenshot URL) */}
        <button
          onClick={() => setShowAdvanced(v => !v)}
          className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted hover:text-secondary transition-colors"
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
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-action-primary/20 text-brand border border-focus/30 text-[10px] font-black uppercase tracking-widest disabled:opacity-40 transition-all hover:bg-action-primary/30 active:scale-[0.98]"
        >
          {isLoading ? (
            <><Loader2 className="w-4 h-4 animate-spin" />Analyse en cours…</>
          ) : (
            <><BotMessageSquare className="w-4 h-4" />Diagnostiquer</>
          )}
        </button>
      </div>

      {/* Result */}
      {result && d && sevStyle && (
        <div className="space-y-4 border-t border-border-subtle pt-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${sevStyle.cls}`}>
              {d.severity === 'critical' || d.severity === 'high'
                ? <AlertTriangle className="w-3.5 h-3.5" />
                : <CheckCircle2 className="w-3.5 h-3.5" />}
              {sevStyle.label}
            </span>
            <span className="text-xs text-secondary font-semibold">{d.category}</span>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted mb-1.5">Cause probable</p>
              <p className="text-sm text-text-primary/80 leading-relaxed">{d.probableCause}</p>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted mb-1.5">Résolution recommandée</p>
              <p className="text-sm text-text-primary/80 leading-relaxed whitespace-pre-wrap">{d.recommendedFix}</p>
            </div>
          </div>

          {d.escalate && (
            <button
              onClick={handleEscalate}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-status-danger/10 text-status-danger border border-red-500/20 text-[10px] font-black uppercase tracking-widest hover:bg-status-danger/20 transition-colors"
            >
              <ArrowUpRight className="w-4 h-4" />
              Escalader en L1
            </button>
          )}

          <p className="text-[9px] text-muted text-right font-mono">Ticket #{result.ticketId.slice(0, 8)}</p>
        </div>
      )}
    </div>
  );
}
