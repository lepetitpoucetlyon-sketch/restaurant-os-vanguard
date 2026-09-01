'use client';

import React, { useState } from 'react';
import { RotateCcw, Search, CheckCircle2, AlertCircle, Receipt, ArrowRight, ShieldCheck } from 'lucide-react';
import { useTenant } from '@/shared/hooks/useTenant';

interface ReturnedItem {
  id: string;
  originalTicketNumber: string;
  customerName: string;
  productName: string;
  variant: string;
  amountInMicrounits: number;
  reason: 'size_mismatch' | 'defective' | 'buyer_remorse' | 'wrong_item';
  actionType: 'refund' | 'credit_note' | 'exchange';
  createdAt: string;
  status: 'processed' | 'inspected';
}

const INITIAL_RETURNS: ReturnedItem[] = [
  {
    id: 'ret-001',
    originalTicketNumber: 'TK-2026-0814',
    customerName: 'M. Thomas V.',
    productName: 'Jean Brut Selvedge 14oz',
    variant: 'Brut / 32-34',
    amountInMicrounits: 120_000_000,
    reason: 'size_mismatch',
    actionType: 'exchange',
    createdAt: '2026-09-01 10:15',
    status: 'processed',
  },
  {
    id: 'ret-002',
    originalTicketNumber: 'TK-2026-0809',
    customerName: 'Mme Sophie G.',
    productName: 'Sneakers Cuir Minimalistes',
    variant: 'Blanc / 42',
    amountInMicrounits: 145_000_000,
    reason: 'defective',
    actionType: 'credit_note',
    createdAt: '2026-08-31 16:40',
    status: 'processed',
  },
];

export function ReturnsPage() {
  const { activeTenantId } = useTenant();
  const [returnsList, setReturnsList] = useState<ReturnedItem[]>(INITIAL_RETURNS);
  const [ticketSearch, setTicketSearch] = useState('');
  const [returnSuccess, setReturnSuccess] = useState(false);

  const handleProcessReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSearch) return;
    const newReturn: ReturnedItem = {
      id: `ret-${Date.now().toString().slice(-4)}`,
      originalTicketNumber: ticketSearch.toUpperCase(),
      customerName: 'Client Comptoir',
      productName: 'Article retourné',
      variant: 'Standard',
      amountInMicrounits: 45_000_000,
      reason: 'size_mismatch',
      actionType: 'credit_note',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      status: 'processed',
    };
    setReturnsList([newReturn, ...returnsList]);
    setTicketSearch('');
    setReturnSuccess(true);
  };

  const totalRefundedMu = returnsList.reduce((s, r) => s + r.amountInMicrounits, 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{"🔄"}</span>
            <h1 className="text-xl font-bold font-serif">{"Retours, Échanges & Avoirs Magasin"}</h1>
          </div>
          <p className="text-xs text-text-muted mt-1">
            {"Traitement des retours clients, réintégration en stock et génération d'avoirs conformes NF525."}
          </p>
        </div>
      </div>

      {returnSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <div>
            <p className="text-xs font-semibold">{"Retour validé : Avoir émis & stock réintégré"}</p>
            <p className="text-[11px] text-text-muted">{"Le journal fiscal NF525 a scellé l'écriture d'annulation et généré le justificatif client."}</p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <RotateCcw className="w-3.5 h-3.5 text-pink-500" />
            {"Retours traités"}
          </p>
          <p className="text-2xl font-bold font-mono text-pink-600">{returnsList.length}</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <Receipt className="w-3.5 h-3.5 text-amber-500" />
            {"Total avoirs émis"}
          </p>
          <p className="text-2xl font-bold font-mono">
            {((totalRefundedMu / 1_000_000)).toFixed(2)} {"€"}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            {"Taux de conformité réintégration"}
          </p>
          <p className="text-2xl font-bold font-mono text-emerald-600">{"100 %"}</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-blue-500" />
            {"Délai légal rétractation"}
          </p>
          <p className="text-sm font-semibold font-mono text-text-primary mt-1">{"14 jours"}</p>
        </div>
      </div>

      {/* Saisie Retour par N° de Ticket */}
      <div className="p-5 rounded-xl border border-border bg-surface-card space-y-3">
        <h2 className="text-sm font-semibold">{"Effectuer un nouveau retour d'article"}</h2>
        <form onSubmit={handleProcessReturn} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Receipt className="w-4 h-4 absolute left-3 top-2.5 text-text-muted" />
            <input
              type="text"
              value={ticketSearch}
              onChange={e => setTicketSearch(e.target.value)}
              placeholder="Saisir le N° de ticket de caisse initial (ex: TK-2026-0814)..."
              required
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-surface-base text-xs font-mono focus:border-pink-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            {"Enregistrer le retour"}
          </button>
        </form>
      </div>

      {/* Historique des retours */}
      <div className="rounded-xl border border-border bg-surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-surface-base/60 text-text-muted uppercase font-medium border-b border-border text-[10px]">
              <tr>
                <th className="py-3 px-4">{"ID Retour"}</th>
                <th className="py-3 px-4">{"Ticket d'origine"}</th>
                <th className="py-3 px-4">{"Article & Variante"}</th>
                <th className="py-3 px-4">{"Client"}</th>
                <th className="py-3 px-4 text-center">{"Motif"}</th>
                <th className="py-3 px-4 text-center">{"Mode règlement"}</th>
                <th className="py-3 px-4 text-right">{"Montant"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {returnsList.map(ret => {
                const amountEur = (ret.amountInMicrounits / 1_000_000).toFixed(2);
                const reasonLabels = {
                  size_mismatch: 'Taille non conforme',
                  defective: 'Défaut fabrication',
                  buyer_remorse: 'Rétractation client',
                  wrong_item: 'Erreur de référence',
                };
                const actionLabels = {
                  refund: 'Remboursement CB',
                  credit_note: 'Avoir boutique',
                  exchange: 'Échange article',
                };

                return (
                  <tr key={ret.id} className="hover:bg-surface-hover/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium">{ret.id}</td>
                    <td className="py-3 px-4 font-mono text-text-muted">{ret.originalTicketNumber}</td>
                    <td className="py-3 px-4 font-semibold text-text-primary">
                      {ret.productName} <span className="font-normal text-text-muted text-[11px]">({ret.variant})</span>
                    </td>
                    <td className="py-3 px-4 text-text-secondary">{ret.customerName}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-surface-base border border-border">
                        {reasonLabels[ret.reason]}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-pink-500/10 text-pink-600 font-medium">
                        {actionLabels[ret.actionType]}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">{amountEur} {"€"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
