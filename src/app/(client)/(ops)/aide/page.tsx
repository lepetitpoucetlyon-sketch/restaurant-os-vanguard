'use client';

import React from 'react';
import { HelpCircle, Sparkles, CheckCircle2, Clock, AlertTriangle, ShieldAlert, RefreshCw } from 'lucide-react';
import { useSupportTickets } from '@/shared/components/support/useSupportTickets';
import { withPageGuard } from '@/shared/components/rbac/PageGuard';
import { PageShell } from '@/shared/components/ui/PageShell';

function TenantAidePage() {
  const { tickets, loading, refresh } = useSupportTickets();

  return (
    <PageShell
      kicker="Support"
      title="Centre d'Aide & Support IA"
      subtitle="Suivi de vos demandes de support et diagnostics intelligents."
      icon={HelpCircle}
      breadcrumbs={[{ label: 'Opérations' }, { label: 'Aide' }]}
      actions={
        <PageShell.CTA onClick={refresh}>
          <RefreshCw className="w-[15px] h-[15px]" /> <span>Actualiser</span>
        </PageShell.CTA>
      }
    >
      {loading ? (
        <div className="py-16 text-center text-xs text-text-secondary flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
          Chargement de vos tickets...
        </div>
      ) : tickets.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-subtle rounded-3xl space-y-3">
          <HelpCircle className="w-10 h-10 text-text-tertiary mx-auto" />
          <p className="text-sm font-semibold text-text-secondary">Aucun ticket de support trouvé</p>
          <p className="text-xs text-text-tertiary max-w-md mx-auto">
            Utilisez le widget d&apos;aide en bas à droite de votre écran pour poser une question ou signaler un problème à l&apos;IA.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map(ticket => (
            <div key={ticket.id} className="bg-surface-card border border-subtle rounded-2xl p-5 space-y-3 shadow-sm hover:border-amber-500/30 transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-text-tertiary tabular-nums"># {ticket.id}</span>
                  <h3 className="text-sm font-medium text-text-primary tracking-tight">{ticket.description}</h3>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {ticket.escalated && (
                    <span className="px-2.5 py-1 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-full text-[11px] font-medium tracking-tight flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Escaladé MCC
                    </span>
                  )}
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-medium tracking-tight flex items-center gap-1 capitalize ${
                    ticket.status === 'draft_ready' || ticket.status === 'approved' || ticket.status === 'applied'
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      : ticket.status === 'analyzing'
                      ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      : 'bg-slate-500/10 text-text-muted border border-slate-500/20'
                  }`}>
                    {ticket.status === 'draft_ready' && <CheckCircle2 className="w-3 h-3" />}
                    {ticket.status === 'analyzing' && <Clock className="w-3 h-3" />}
                    {ticket.status}
                  </span>
                </div>
              </div>

              {/* Draft Resolution Details if ready */}
              {ticket.draft && (
                <div className="bg-surface-bg border border-subtle rounded-xl p-4 space-y-2 mt-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <h4 className="text-xs font-bold text-amber-500">{ticket.draft.title}</h4>
                  </div>
                  <p className="text-xs text-text-secondary">{ticket.draft.summary}</p>
                  {ticket.draft.rootCause && (
                    <p className="text-[11px] text-text-tertiary italic">
                      Cause racine identifiée : {ticket.draft.rootCause}
                    </p>
                  )}
                </div>
              )}

              {ticket.analysisError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Erreur d&apos;analyse : {ticket.analysisError}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}

export default withPageGuard(TenantAidePage, "operations");
