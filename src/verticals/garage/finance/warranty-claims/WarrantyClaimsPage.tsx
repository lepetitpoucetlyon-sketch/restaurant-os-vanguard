'use client';

import React, { useState } from 'react';
import { ShieldCheck, FileText, CheckCircle2, Clock, Euro, AlertTriangle, Plus, Search } from 'lucide-react';
import { useTenant } from '@/shared/hooks/useTenant';

interface WarrantyClaim {
  id: string; // CLM-2026-XXXX
  repairOrderId: string;
  vehicle: string;
  manufacturerOrInsurer: string;
  claimType: 'MANUFACTURER_WARRANTY' | 'EXTENDED_WARRANTY' | 'INSURANCE_ACCIDENT';
  amountClaimedInMicrounits: number;
  amountApprovedInMicrounits: number;
  submissionDate: string;
  status: 'SUBMITTED' | 'APPROVED' | 'PAID' | 'REJECTED';
}

const INITIAL_CLAIMS: WarrantyClaim[] = [
  { id: 'CLM-2026-0045', repairOrderId: 'OR-2026-0780', vehicle: 'Peugeot 3008 (GH-452-KL)', manufacturerOrInsurer: 'Stellantis Garantie FR', claimType: 'MANUFACTURER_WARRANTY', amountClaimedInMicrounits: 850_000_000, amountApprovedInMicrounits: 850_000_000, submissionDate: '2026-08-20', status: 'PAID' },
  { id: 'CLM-2026-0046', repairOrderId: 'OR-2026-0802', vehicle: 'Renault Clio V (AB-891-CD)', manufacturerOrInsurer: 'Opteven Extension', claimType: 'EXTENDED_WARRANTY', amountClaimedInMicrounits: 420_000_000, amountApprovedInMicrounits: 420_000_000, submissionDate: '2026-08-25', status: 'APPROVED' },
  { id: 'CLM-2026-0047', repairOrderId: 'OR-2026-0813', vehicle: 'Volkswagen Golf 8 (EF-123-GH)', manufacturerOrInsurer: 'Allianz IARD Sinistres', claimType: 'INSURANCE_ACCIDENT', amountClaimedInMicrounits: 1_250_000_000, amountApprovedInMicrounits: 0, submissionDate: '2026-08-30', status: 'SUBMITTED' },
];

export function WarrantyClaimsPage() {
  const { activeTenantId } = useTenant();
  const [claims, setClaims] = useState<WarrantyClaim[]>(INITIAL_CLAIMS);
  const [search, setSearch] = useState('');

  const filtered = claims.filter(c =>
    c.id.toLowerCase().includes(search.toLowerCase()) ||
    c.vehicle.toLowerCase().includes(search.toLowerCase()) ||
    c.manufacturerOrInsurer.toLowerCase().includes(search.toLowerCase())
  );

  const totalClaimedMu = claims.reduce((s, c) => s + c.amountClaimedInMicrounits, 0);
  const totalApprovedMu = claims.reduce((s, c) => s + c.amountApprovedInMicrounits, 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{"🛡️"}</span>
            <h1 className="text-xl font-bold font-serif">{"Prises en Charge Garantie Constructeur & Assurances"}</h1>
          </div>
          <p className="text-xs text-text-muted mt-1">
            {"Dossiers de remboursement garantie pièces/MO, barèmes constructeurs TEMPARIO et tiers-payant assurance."}
          </p>
        </div>

        <button
          onClick={() => alert("Création d'un dossier de prise en charge...")}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          {"Nouveau dossier garantie"}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-orange-500" />
            {"Dossiers actifs"}
          </p>
          <p className="text-2xl font-bold font-mono text-orange-600">{claims.length}</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <Euro className="w-3.5 h-3.5 text-blue-500" />
            {"Montants déclarés"}
          </p>
          <p className="text-2xl font-bold font-mono">
            {((totalClaimedMu / 1_000_000)).toFixed(2)} {"€"}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            {"Montants accordés"}
          </p>
          <p className="text-2xl font-bold font-mono text-emerald-600">
            {((totalApprovedMu / 1_000_000)).toFixed(2)} {"€"}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
            {"Taux d'acceptation"}
          </p>
          <p className="text-2xl font-bold font-mono text-purple-600">{"96.5 %"}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-text-muted" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par N° dossier, véhicule ou organisme garant..."
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-surface-card text-xs focus:border-orange-500 focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-surface-base/60 text-text-muted uppercase font-medium border-b border-border text-[10px]">
              <tr>
                <th className="py-3 px-4">{"Dossier"}</th>
                <th className="py-3 px-4">{"Véhicule & Réf. OR"}</th>
                <th className="py-3 px-4">{"Organisme / Constructeur"}</th>
                <th className="py-3 px-4 text-center">{"Type"}</th>
                <th className="py-3 px-4 text-right">{"Montant Réclamé"}</th>
                <th className="py-3 px-4 text-right">{"Montant Accordé"}</th>
                <th className="py-3 px-4 text-center">{"Statut"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.map(claim => {
                const claimedEur = (claim.amountClaimedInMicrounits / 1_000_000).toFixed(2);
                const approvedEur = (claim.amountApprovedInMicrounits / 1_000_000).toFixed(2);

                const statusBadge = {
                  SUBMITTED: { label: 'En cours d\'instruction', bg: 'bg-zinc-500/10 text-zinc-600' },
                  APPROVED: { label: 'Accordé / En attente virement', bg: 'bg-blue-500/10 text-blue-600 font-medium' },
                  PAID: { label: 'Remboursé & Lettré', bg: 'bg-emerald-500/10 text-emerald-600 font-bold' },
                  REJECTED: { label: 'Refusé', bg: 'bg-rose-500/10 text-rose-600' },
                }[claim.status];

                return (
                  <tr key={claim.id} className="hover:bg-surface-hover/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-text-primary">{claim.id}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-text-primary block">{claim.vehicle}</span>
                      <span className="font-mono text-[10px] text-text-muted">{claim.repairOrderId}</span>
                    </td>
                    <td className="py-3 px-4 font-medium text-text-secondary">{claim.manufacturerOrInsurer}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-surface-base border border-border">
                        {claim.claimType === 'MANUFACTURER_WARRANTY' ? 'Garantie Constructeur' : claim.claimType === 'EXTENDED_WARRANTY' ? 'Extension Garantie' : 'Assurance Sinistre'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono">{claimedEur} {"€"}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">{approvedEur} {"€"}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium ${statusBadge.bg}`}>
                        {statusBadge.label}
                      </span>
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
