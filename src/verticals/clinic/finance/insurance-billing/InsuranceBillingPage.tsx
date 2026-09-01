'use client';

import { useSovereignCollection } from '@/kernel/hooks/useSovereignCollection';
import React, { useState } from 'react';
import { FileText, CheckCircle2, AlertTriangle, Clock, Euro, ShieldCheck, Send, Search } from 'lucide-react';
import { useTenant } from '@/shared/hooks/useTenant';

interface FSEClaim {
  id: string; // FSE-2026-XXXX
  patientName: string;
  nirMasked: string;
  practitioner: string;
  actCode: string; // Ex: C, CS, CCAM
  totalAmountInMicrounits: number;
  partAmoInMicrounits: number; // Régime Obligatoire (ex: 70%)
  partAmcInMicrounits: number; // Mutuelle / Complémentaire (ex: 30%)
  transmissionDate: string;
  status: 'TRANSMITTED' | 'ACKNOWLEDGED' | 'PAID' | 'REJECTED';
  rejectionReason?: string;
}



export function InsuranceBillingPage() {
  const { activeTenantId } = useTenant();
  const {
    data: claims,
    isLoading,
    update,
    refresh,
  } = useSovereignCollection<FSEClaim>('insuranceClaims', { tenantId: activeTenantId ?? undefined });
  const [search, setSearch] = useState('');

  const filtered = claims.filter(c =>
    c.patientName.toLowerCase().includes(search.toLowerCase()) ||
    c.id.toLowerCase().includes(search.toLowerCase()) ||
    c.nirMasked.includes(search)
  );

  const totalAmoMu = claims.reduce((s, c) => s + c.partAmoInMicrounits, 0);
  const totalAmcMu = claims.reduce((s, c) => s + c.partAmcInMicrounits, 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{"💳"}</span>
            <h1 className="text-xl font-bold font-serif">{"Facturation Tiers-Payant & Télétransmission (SESAM-Vitale / NOEMIE)"}</h1>
          </div>
          <p className="text-xs text-text-muted mt-1">
            {"Feuilles de Soins Électroniques (FSE), télétransmission CPAM (AMO) et flux retours NOEMIE mutuelles (AMC)."}
          </p>
        </div>

        <button
          onClick={() => alert("Télétransmission du lot de télétransmission SESAM-Vitale...")}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <Send className="w-4 h-4" />
          {"Télétransmettre le lot FSE"}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-emerald-500" />
            {"FSE générées"}
          </p>
          <p className="text-2xl font-bold font-mono text-emerald-600">{claims.length}</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <Euro className="w-3.5 h-3.5 text-blue-500" />
            {"Part Sécurité Sociale (AMO)"}
          </p>
          <p className="text-2xl font-bold font-mono text-blue-600">
            {((totalAmoMu / 1_000_000)).toFixed(2)} {"€"}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <Euro className="w-3.5 h-3.5 text-purple-500" />
            {"Part Mutuelle (AMC)"}
          </p>
          <p className="text-2xl font-bold font-mono text-purple-600">
            {((totalAmcMu / 1_000_000)).toFixed(2)} {"€"}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            {"Taux d'acquittement NOEMIE"}
          </p>
          <p className="text-2xl font-bold font-mono text-emerald-600">{"98.5 %"}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-text-muted" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par N° FSE, nom de patient ou NIR..."
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-surface-card text-xs focus:border-emerald-500 focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-surface-base/60 text-text-muted uppercase font-medium border-b border-border text-[10px]">
              <tr>
                <th className="py-3 px-4">{"N° FSE"}</th>
                <th className="py-3 px-4">{"Patient & NIR"}</th>
                <th className="py-3 px-4">{"Praticien / Acte"}</th>
                <th className="py-3 px-4 text-right">{"Total TTC"}</th>
                <th className="py-3 px-4 text-right">{"Part AMO (Sécu)"}</th>
                <th className="py-3 px-4 text-right">{"Part AMC (Mutuelle)"}</th>
                <th className="py-3 px-4 text-center">{"Statut Télétrans."}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.map(claim => {
                const totalEur = (claim.totalAmountInMicrounits / 1_000_000).toFixed(2);
                const amoEur = (claim.partAmoInMicrounits / 1_000_000).toFixed(2);
                const amcEur = (claim.partAmcInMicrounits / 1_000_000).toFixed(2);

                const statusBadge = {
                  TRANSMITTED: { label: 'Lot émis CPAM', bg: 'bg-blue-500/10 text-blue-600' },
                  ACKNOWLEDGED: { label: 'Accusé ARL reçu', bg: 'bg-purple-500/10 text-purple-600' },
                  PAID: { label: 'Règlement viré NOEMIE', bg: 'bg-emerald-500/10 text-emerald-600 font-bold' },
                  REJECTED: { label: 'Rejet télétrans.', bg: 'bg-rose-500/10 text-rose-600 font-bold' },
                }[claim.status];

                return (
                  <tr key={claim.id} className="hover:bg-surface-hover/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-text-primary">{claim.id}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-text-primary block">{claim.patientName}</span>
                      <span className="font-mono text-[10px] text-text-muted">{claim.nirMasked}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-text-primary block font-medium">{claim.practitioner}</span>
                      <span className="text-[10px] text-text-muted">{claim.actCode}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">{totalEur} {"€"}</td>
                    <td className="py-3 px-4 text-right font-mono text-blue-600 dark:text-blue-400">{amoEur} {"€"}</td>
                    <td className="py-3 px-4 text-right font-mono text-purple-600 dark:text-purple-400">{amcEur} {"€"}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium ${statusBadge.bg}`}>
                        {statusBadge.label}
                      </span>
                      {claim.rejectionReason && (
                        <p className="text-[10px] text-rose-600 mt-1">{claim.rejectionReason}</p>
                      )}
                    </td>
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
