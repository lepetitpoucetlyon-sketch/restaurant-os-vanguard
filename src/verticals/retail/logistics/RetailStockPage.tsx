'use client';

import { useSovereignCollection } from '@/kernel/hooks/useSovereignCollection';
import React, { useState } from 'react';
import { Package, AlertTriangle, ArrowDownRight, ArrowUpRight, Search, RefreshCw, Barcode } from 'lucide-react';
import { useTenant } from '@/shared/hooks/useTenant';

interface StockRow {
  /** Identifiant souverain — le SKU est la clé naturelle d'une ligne de stock. */
  id: string;
  sku: string;
  ean: string;
  name: string;
  variant: string;
  category: string;
  stockStore: number;
  stockReserve: number;
  minThreshold: number;
  reorderQty: number;
  unitCostInMicrounits: number;
}



export function RetailStockPage() {
  const { activeTenantId } = useTenant();
  const {
    data: data,
    isLoading,
    update,
    refresh,
  } = useSovereignCollection<StockRow>('retailStock', { tenantId: activeTenantId ?? undefined });
  const [search, setSearch] = useState('');

  const filtered = data.filter(row =>
    row.name.toLowerCase().includes(search.toLowerCase()) ||
    row.sku.toLowerCase().includes(search.toLowerCase()) ||
    row.variant.toLowerCase().includes(search.toLowerCase())
  );

  const totalStore = data.reduce((s, r) => s + r.stockStore, 0);
  const totalReserve = data.reduce((s, r) => s + r.stockReserve, 0);
  const totalValuationMu = data.reduce((s, r) => s + ((r.stockStore + r.stockReserve) * r.unitCostInMicrounits), 0);
  const lowStockCount = data.filter(r => r.stockStore <= r.minThreshold).length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{"🏬"}</span>
            <h1 className="text-xl font-bold font-serif">{"Stock Magasin & Réserve (SKU)"}</h1>
          </div>
          <p className="text-xs text-text-muted mt-1">
            {"Niveaux de stocks par taille/couleur, transferts réserve → magasin et propositions de réassort."}
          </p>
        </div>

        <button
          onClick={() => alert("Génération de la commande fournisseur de réassort...")}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <Barcode className="w-4 h-4" />
          {"Commander réassort"}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-pink-500" />
            {"Stock en rayon"}
          </p>
          <p className="text-2xl font-bold font-mono text-pink-600">{totalStore}</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-blue-500" />
            {"Stock en réserve"}
          </p>
          <p className="text-2xl font-bold font-mono text-blue-600">{totalReserve}</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            {"Alertes magasin"}
          </p>
          <p className="text-2xl font-bold font-mono text-rose-600">{lowStockCount}</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
            {"Valorisation stock (PAMP)"}
          </p>
          <p className="text-2xl font-bold font-mono">
            {((totalValuationMu / 1_000_000)).toFixed(2)} {"€"}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-text-muted" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Filtrer par article, SKU, code EAN ou variante..."
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-surface-card text-xs focus:border-pink-500 focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-surface-base/60 text-text-muted uppercase font-medium border-b border-border text-[10px]">
              <tr>
                <th className="py-3 px-4">{"SKU"}</th>
                <th className="py-3 px-4">{"Article & Variante"}</th>
                <th className="py-3 px-4 text-center">{"Rayon / Magasin"}</th>
                <th className="py-3 px-4 text-center">{"Réserve"}</th>
                <th className="py-3 px-4 text-center">{"Seuil min"}</th>
                <th className="py-3 px-4 text-right">{"Coût unitaire"}</th>
                <th className="py-3 px-4 text-right">{"Valeur totale"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.map(row => {
                const isLow = row.stockStore <= row.minThreshold;
                const costEur = (row.unitCostInMicrounits / 1_000_000).toFixed(2);
                const totalRowEur = (((row.stockStore + row.stockReserve) * row.unitCostInMicrounits) / 1_000_000).toFixed(2);

                return (
                  <tr key={row.sku} className="hover:bg-surface-hover/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-text-muted">{row.sku}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-text-primary block">{row.name}</span>
                      <span className="text-[11px] text-text-muted">{row.variant}</span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold">
                      <span className={`px-2 py-0.5 rounded ${isLow ? 'bg-rose-500/15 text-rose-600' : 'text-text-primary'}`}>
                        {row.stockStore}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-text-secondary">{row.stockReserve}</td>
                    <td className="py-3 px-4 text-center font-mono text-text-muted">{row.minThreshold}</td>
                    <td className="py-3 px-4 text-right font-mono">{costEur} {"€"}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold">{totalRowEur} {"€"}</td>
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
