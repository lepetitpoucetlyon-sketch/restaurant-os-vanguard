'use client';

import { useSovereignCollection } from '@/kernel/hooks/useSovereignCollection';
import React, { useState } from 'react';
import { Landmark, Building, FileText, CheckCircle2, Clock, Euro, ArrowUpRight, Search } from 'lucide-react';
import { useTenant } from '@/shared/hooks/useTenant';

interface CityLedgerAccount {
  id: string;
  companyName: string;
  siret: string;
  accountType: 'CORPORATE' | 'OTA_BOOKING' | 'OTA_EXPEDIA' | 'EVENT_AGENCY';
  outstandingBalanceInMicrounits: number;
  creditLimitInMicrounits: number;
  invoicesCount: number;
  paymentTermsDays: number;
  lastInvoiceDate: string;
  status: 'active' | 'warning_limit' | 'blocked';
}



export function CityLedgerPage() {
  const { activeTenantId } = useTenant();
  const {
    data: accounts,
    isLoading,
    update,
    refresh,
  } = useSovereignCollection<CityLedgerAccount>('cityLedgerAccounts', { tenantId: activeTenantId ?? undefined });
  const [search, setSearch] = useState('');

  const filtered = accounts.filter(acc =>
    acc.companyName.toLowerCase().includes(search.toLowerCase()) ||
    acc.siret.includes(search)
  );

  const totalOutstandingMu = accounts.reduce((s, a) => s + a.outstandingBalanceInMicrounits, 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{"🏛️"}</span>
            <h1 className="text-xl font-bold font-serif">{"City Ledger & Comptes Débiteurs Entreprises / OTA"}</h1>
          </div>
          <p className="text-xs text-text-muted mt-1">
            {"Grand livre des créances différées, facturation consolidée OTA (Booking/Expedia) et contrats Corporate."}
          </p>
        </div>

        <button
          onClick={() => alert("Génération de l'échéancier et relevés de compte...")}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <FileText className="w-4 h-4" />
          {"Éditer relevés de compte"}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-blue-500" />
            {"Comptes ouverts"}
          </p>
          <p className="text-2xl font-bold font-mono text-blue-600">{accounts.length}</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <Euro className="w-3.5 h-3.5 text-emerald-500" />
            {"Encours global débiteurs"}
          </p>
          <p className="text-2xl font-bold font-mono">
            {((totalOutstandingMu / 1_000_000)).toFixed(2)} {"€"}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            {"DSO moyen (Délai règlement)"}
          </p>
          <p className="text-2xl font-bold font-mono text-amber-600">{"22.4 jours"}</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-purple-500" />
            {"Taux de recouvrement"}
          </p>
          <p className="text-2xl font-bold font-mono text-emerald-600">{"99.8 %"}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-text-muted" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par raison sociale, SIRET ou type de compte..."
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-surface-card text-xs focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-surface-base/60 text-text-muted uppercase font-medium border-b border-border text-[10px]">
              <tr>
                <th className="py-3 px-4">{"Société Débitrice"}</th>
                <th className="py-3 px-4">{"Type de compte"}</th>
                <th className="py-3 px-4 text-center">{"Factures"}</th>
                <th className="py-3 px-4 text-right">{"Encours Actuel"}</th>
                <th className="py-3 px-4 text-right">{"Plafond Autorisé"}</th>
                <th className="py-3 px-4 text-center">{"Conditions"}</th>
                <th className="py-3 px-4 text-right">{"Dernière facture"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.map(acc => {
                const balanceEur = (acc.outstandingBalanceInMicrounits / 1_000_000).toFixed(2);
                const limitEur = (acc.creditLimitInMicrounits / 1_000_000).toFixed(2);

                return (
                  <tr key={acc.id} className="hover:bg-surface-hover/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-text-primary">
                      {acc.companyName}
                      <span className="block font-mono text-[10px] text-text-muted font-normal">{acc.siret}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-surface-base border border-border font-medium">
                        {acc.accountType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono">{acc.invoicesCount}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                      {balanceEur} {"€"}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-text-muted">{limitEur} {"€"}</td>
                    <td className="py-3 px-4 text-center text-text-secondary">{acc.paymentTermsDays} {"j net"}</td>
                    <td className="py-3 px-4 text-right font-mono text-text-muted">{acc.lastInvoiceDate}</td>
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
