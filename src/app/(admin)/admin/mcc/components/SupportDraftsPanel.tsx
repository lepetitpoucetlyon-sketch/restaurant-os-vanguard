"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FileEdit, CheckCircle2, XCircle, RefreshCw, ChevronDown, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/ui.foundations';
import { authedFetch } from '@/lib/client/authedFetch';
import type { SupportTicket, SupportDraft, SupportTicketStatus } from '@/domain/schemas';

const STATUS_META: Record<SupportTicketStatus, { label: string; color: string }> = {
  new:              { label: 'Nouveau',       color: 'text-text-secondary bg-slate-500/10 border-slate-500/30' },
  analyzing:        { label: 'Analyse…',      color: 'text-blue-400 bg-status-info/10 border-blue-500/30' },
  draft_ready:      { label: 'À valider',     color: 'text-action-primary bg-action-primary/10 border-action-primary/30' },
  analysis_failed:  { label: 'Échec IA',      color: 'text-status-danger bg-status-danger/10 border-red-500/30' },
  approved:         { label: 'Approuvé',      color: 'text-status-success bg-status-success/10 border-emerald-500/30' },
  rejected:         { label: 'Refusé',        color: 'text-status-danger bg-status-danger/10 border-red-500/30' },
  applied:          { label: 'Appliqué',      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' },
};

const RISK_COLOR: Record<SupportDraft['riskLevel'], string> = {
  low:    'text-status-success bg-status-success/10 border-emerald-500/30',
  medium: 'text-action-primary bg-action-primary/10 border-action-primary/30',
  high:   'text-status-danger bg-status-danger/10 border-red-500/30',
};

interface EditState {
  title: string;
  summary: string;
  rootCause: string;
  codeBrief: string;
  proposedPatchText: string;
}

function draftToEditState(draft: SupportDraft): EditState {
  return {
    title: draft.title,
    summary: draft.summary,
    rootCause: draft.rootCause ?? '',
    codeBrief: draft.codeBrief ?? '',
    proposedPatchText: draft.proposedPatch ? JSON.stringify(draft.proposedPatch, null, 2) : '',
  };
}

export function SupportDraftsPanel() {
  const [tickets, setTickets]   = useState<SupportTicket[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [edits, setEdits]       = useState<Record<string, EditState>>({});
  const [applyPatch, setApplyPatch] = useState<Record<string, boolean>>({});
  const [busy, setBusy]         = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await authedFetch('/api/admin/fleet/support-ai/drafts');
      const data = await res.json() as { tickets?: SupportTicket[] };
      setTickets(data.tickets ?? []);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleExpand = (ticket: SupportTicket) => {
    const willOpen = expanded !== ticket.id;
    setExpanded(willOpen ? ticket.id : null);
    if (willOpen && ticket.draft && !edits[ticket.id]) {
      setEdits(prev => ({ ...prev, [ticket.id]: draftToEditState(ticket.draft as SupportDraft) }));
    }
  };

  const updateEdit = (ticketId: string, field: keyof EditState, value: string) => {
    setEdits(prev => ({ ...prev, [ticketId]: { ...prev[ticketId], [field]: value } }));
  };

  const postAction = async (ticket: SupportTicket, body: Record<string, unknown>) => {
    setBusy(ticket.id);
    try {
      const res  = await authedFetch('/api/admin/fleet/support-ai/drafts', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ticketId: ticket.id, ...body }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (!res.ok || !data.success) throw new Error(data.error ?? String(res.status));
      return true;
    } catch (err) {
      toast.error(`Erreur : ${String(err)}`);
      return false;
    } finally {
      setBusy(null);
    }
  };

  const clearEdit = (ticketId: string) =>
    setEdits(prev => { const next = { ...prev }; delete next[ticketId]; return next; });

  const handleApprove = async (ticket: SupportTicket) => {
    const ok = await postAction(ticket, { action: 'approve', applyPatch: !!applyPatch[ticket.id] });
    if (ok) { clearEdit(ticket.id); toast.success(`Ticket ${ticket.id.slice(0, 8)}… approuvé`); load(); }
  };

  const handleReject = async (ticket: SupportTicket) => {
    const ok = await postAction(ticket, { action: 'reject' });
    if (ok) { clearEdit(ticket.id); toast.info(`Ticket ${ticket.id.slice(0, 8)}… refusé`); load(); }
  };

  const handleCorrect = async (ticket: SupportTicket) => {
    const draft = ticket.draft as SupportDraft;
    const edit  = edits[ticket.id];
    if (!edit) return;

    let proposedPatch: Record<string, unknown> | undefined;
    if (edit.proposedPatchText.trim()) {
      try {
        proposedPatch = JSON.parse(edit.proposedPatchText) as Record<string, unknown>;
      } catch {
        toast.error('proposedPatch : JSON invalide');
        return;
      }
    }

    const correctedDraft: SupportDraft = {
      ...draft,
      title: edit.title,
      summary: edit.summary,
      rootCause: edit.rootCause || undefined,
      codeBrief: edit.codeBrief || undefined,
      proposedPatch,
    };

    const ok = await postAction(ticket, { action: 'correct', correctedDraft });
    if (ok) { clearEdit(ticket.id); toast.success('Brouillon corrigé'); load(); }
  };

  const draftReadyCount = tickets.filter(t => t.status === 'draft_ready').length;

  return (
    <div className="p-6 bg-surface-card border border-border-subtle rounded-3xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-action-primary/10 flex items-center justify-center border border-action-primary/20">
            <Wand2 className="w-5 h-5 text-action-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-muted">Brouillons SAV IA</h3>
            <p className="text-[10px] font-bold text-secondary uppercase tracking-tighter">
              {draftReadyCount > 0 ? `${draftReadyCount} en attente de validation` : 'Requêtes tenant → brouillon → review'}
            </p>
          </div>
        </div>
        <button onClick={load} disabled={isLoading} className="p-2 rounded-lg bg-bg-primary/30 border border-border-subtle text-secondary hover:text-muted transition-all">
          <RefreshCw className={cn('w-3.5 h-3.5', isLoading && 'animate-spin')} />
        </button>
      </div>

      {/* List */}
      <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
        {isLoading && (
          <div className="py-8 text-center text-secondary text-xs animate-pulse">Chargement...</div>
        )}
        {!isLoading && tickets.length === 0 && (
          <div className="py-8 text-center text-secondary text-xs">Aucun ticket en file</div>
        )}
        {!isLoading && tickets.map(ticket => {
          const meta   = STATUS_META[ticket.status];
          const isOpen = expanded === ticket.id;
          const draft  = ticket.draft;
          const edit   = edits[ticket.id];
          const isBusy = busy === ticket.id;

          return (
            <motion.div
              key={ticket.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-bg-primary/30 border border-border-subtle rounded-xl"
            >
              <div className="flex items-start justify-between gap-2 cursor-pointer" onClick={() => toggleExpand(ticket)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn('px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border', meta.color)}>
                      {meta.label}
                    </span>
                    <span className="text-[9px] text-secondary font-mono truncate">{ticket.tenantId}</span>
                    {draft && (
                      <span className={cn('px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border', RISK_COLOR[draft.riskLevel])}>
                        Risque {draft.riskLevel}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted font-medium mt-1 line-clamp-1">
                    {draft?.title ?? ticket.description}
                  </p>
                  {ticket.status === 'analysis_failed' && ticket.analysisError && (
                    <p className="text-[9px] text-status-danger/80 mt-0.5">{ticket.analysisError}</p>
                  )}
                </div>
                <ChevronDown className={cn('w-3.5 h-3.5 text-secondary shrink-0 mt-1 transition-transform', isOpen && 'rotate-180')} />
              </div>

              {isOpen && draft && edit && (
                <div className="mt-3 pt-3 border-t border-border-subtle space-y-3" onClick={e => e.stopPropagation()}>
                  <p className="text-[9px] text-secondary">
                    <span className="text-text-primary/30">Requête originale : </span>{ticket.description}
                  </p>

                  <div className="space-y-2">
                    <label className="block">
                      <span className="text-[8px] font-black uppercase tracking-wider text-secondary">Titre</span>
                      <input
                        value={edit.title}
                        onChange={e => updateEdit(ticket.id, 'title', e.target.value)}
                        disabled={ticket.status !== 'draft_ready'}
                        className="w-full mt-1 bg-surface-bg border border-subtle rounded-lg py-1.5 px-2.5 text-xs text-text-primary focus:outline-none focus:border-focus/50 disabled:opacity-50"
                      />
                    </label>
                    <label className="block">
                      <span className="text-[8px] font-black uppercase tracking-wider text-secondary">Résumé</span>
                      <textarea
                        rows={3}
                        value={edit.summary}
                        onChange={e => updateEdit(ticket.id, 'summary', e.target.value)}
                        disabled={ticket.status !== 'draft_ready'}
                        className="w-full mt-1 bg-surface-bg border border-subtle rounded-lg py-1.5 px-2.5 text-xs text-text-primary resize-none focus:outline-none focus:border-focus/50 disabled:opacity-50"
                      />
                    </label>
                    <label className="block">
                      <span className="text-[8px] font-black uppercase tracking-wider text-secondary">Cause probable</span>
                      <textarea
                        rows={2}
                        value={edit.rootCause}
                        onChange={e => updateEdit(ticket.id, 'rootCause', e.target.value)}
                        disabled={ticket.status !== 'draft_ready'}
                        className="w-full mt-1 bg-surface-bg border border-subtle rounded-lg py-1.5 px-2.5 text-xs text-text-primary resize-none focus:outline-none focus:border-focus/50 disabled:opacity-50"
                      />
                    </label>
                    {draft.kind === 'config_patch' && (
                      <label className="block">
                        <span className="text-[8px] font-black uppercase tracking-wider text-secondary">Patch proposé (JSON overrides)</span>
                        <textarea
                          rows={4}
                          value={edit.proposedPatchText}
                          onChange={e => updateEdit(ticket.id, 'proposedPatchText', e.target.value)}
                          disabled={ticket.status !== 'draft_ready'}
                          className="w-full mt-1 bg-surface-bg border border-subtle rounded-lg py-1.5 px-2.5 text-[10px] font-mono text-text-primary resize-none focus:outline-none focus:border-focus/50 disabled:opacity-50"
                        />
                      </label>
                    )}
                    {draft.kind !== 'config_patch' && (
                      <label className="block">
                        <span className="text-[8px] font-black uppercase tracking-wider text-secondary">Brief développeur</span>
                        <textarea
                          rows={4}
                          value={edit.codeBrief}
                          onChange={e => updateEdit(ticket.id, 'codeBrief', e.target.value)}
                          disabled={ticket.status !== 'draft_ready'}
                          className="w-full mt-1 bg-surface-bg border border-subtle rounded-lg py-1.5 px-2.5 text-xs text-text-primary resize-none focus:outline-none focus:border-focus/50 disabled:opacity-50"
                        />
                      </label>
                    )}
                  </div>

                  {ticket.status === 'draft_ready' && (
                    <div className="space-y-2 pt-1">
                      {draft.kind === 'config_patch' && draft.autoApplicable && (
                        <label className="flex items-center gap-2 text-[10px] text-secondary">
                          <input
                            type="checkbox"
                            checked={!!applyPatch[ticket.id]}
                            onChange={e => setApplyPatch(prev => ({ ...prev, [ticket.id]: e.target.checked }))}
                          />
                          Appliquer au tenant à l&apos;approbation
                        </label>
                      )}
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => handleCorrect(ticket)}
                          disabled={isBusy}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-status-info/10 text-blue-400 border border-blue-500/20 text-[10px] font-black uppercase tracking-widest hover:bg-status-info/20 transition-colors disabled:opacity-40"
                        >
                          <FileEdit className="w-3.5 h-3.5" />Corriger
                        </button>
                        <button
                          onClick={() => handleApprove(ticket)}
                          disabled={isBusy}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-status-success/10 text-status-success border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest hover:bg-status-success/20 transition-colors disabled:opacity-40"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />Approuver
                        </button>
                        <button
                          onClick={() => handleReject(ticket)}
                          disabled={isBusy}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-status-danger/10 text-status-danger border border-red-500/20 text-[10px] font-black uppercase tracking-widest hover:bg-status-danger/20 transition-colors disabled:opacity-40"
                        >
                          <XCircle className="w-3.5 h-3.5" />Refuser
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
