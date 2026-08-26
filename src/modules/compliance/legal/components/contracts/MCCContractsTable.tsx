'use client';

import React from 'react';
import { Search, FileText, CheckCircle2, Clock, Send } from 'lucide-react';
import type { ContractRecord } from '../../services/SovereignSignatureEngine';

interface MCCContractsTableProps {
  filteredContracts: ContractRecord[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSelectContract: (c: ContractRecord) => void;
}

export function MCCContractsTable({
  filteredContracts,
  searchQuery,
  setSearchQuery,
  onSelectContract,
}: MCCContractsTableProps) {
  return (
    <div className="rounded-2xl bg-surface-card border border-border-default backdrop-blur-xl overflow-hidden">
      <div className="p-4 border-b border-border-default flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Rechercher par société, tenant ou réf contrat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-surface-glass border border-border-default rounded-xl text-sm text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-glass text-text-muted text-xs uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3">Référence & Date</th>
              <th className="px-5 py-3">Client & Tenant</th>
              <th className="px-5 py-3">Verticale</th>
              <th className="px-5 py-3">Formule & Tarif</th>
              <th className="px-5 py-3">Statut Signature</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default/40 text-text-secondary">
            {filteredContracts.map((c) => (
              <tr key={c.id} className="hover:bg-surface-glass-hover transition">
                <td className="px-5 py-4 font-mono text-xs text-text-muted">
                  <div className="font-semibold text-text-primary">{c.id}</div>
                  <div>{new Date(c.createdAt).toLocaleDateString('fr-FR')}</div>
                </td>
                <td className="px-5 py-4">
                  <div className="font-medium text-text-primary">{c.client.companyName}</div>
                  <div className="text-xs text-text-muted">
                    {c.client.representativeName} ({c.tenantId})
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className="px-2 py-0.5 rounded text-micro font-mono bg-surface-glass text-text-secondary border border-border-default">
                    {c.vertical}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="font-medium text-text-primary">{c.pricing.monthlyPriceInEuros} €/mois</div>
                  <div className="text-xs text-text-muted">{c.pricing.planName}</div>
                </td>
                <td className="px-5 py-4">
                  {c.status === 'SIGNED' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Signé eIDAS
                    </span>
                  ) : c.status === 'VIEWED' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      <Clock className="w-3.5 h-3.5" /> Lu par le client
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Send className="w-3.5 h-3.5" /> Envoyé
                    </span>
                  )}
                </td>
                <td className="px-5 py-4 text-right">
                  <button
                    onClick={() => onSelectContract(c)}
                    className="px-3 py-1.5 rounded-lg bg-surface-glass hover:bg-surface-glass-hover text-xs font-medium text-text-primary transition inline-flex items-center gap-1"
                  >
                    <FileText className="w-3.5 h-3.5" /> Consulter
                  </button>
                </td>
              </tr>
            ))}
            {filteredContracts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-text-muted/80">
                  Aucun contrat trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
