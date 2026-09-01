'use client';

import React, { useState } from 'react';
import { Package, AlertTriangle, ArrowUpRight, Search, Plus, Minus, RefreshCw } from 'lucide-react';
import { useTenant } from '@/shared/hooks/useTenant';

interface AutoPart {
  id: string;
  oemReference: string;
  name: string;
  supplier: string;
  category: 'FREINAGE' | 'FILTRATION' | 'LUBRIFIANT' | 'PNEUMATIQUE' | 'DISTRIBUTION';
  currentStock: number;
  minThreshold: number;
  unitCostInMicrounits: number;
  sellingPriceInMicrounits: number;
}

const INITIAL_PARTS: AutoPart[] = [
  { id: 'prt-1', oemReference: 'BOSCH-0986479088', name: 'Jeu de 4 Plaquettes Frein AV', supplier: 'Bosch Automotive', category: 'FREINAGE', currentStock: 4, minThreshold: 6, unitCostInMicrounits: 28_000_000, sellingPriceInMicrounits: 65_000_000 },
  { id: 'prt-2', oemReference: 'MANN-HU7020Z', name: 'Filtre à Huile Haute Efficacité', supplier: 'Mann-Filter', category: 'FILTRATION', currentStock: 18, minThreshold: 10, unitCostInMicrounits: 6_500_000, sellingPriceInMicrounits: 18_000_000 },
  { id: 'prt-3', oemReference: 'MOTUL-8100-5W30', name: 'Huile Moteur 5W30 C3 (Bidon 5L)', supplier: 'Motul France', category: 'LUBRIFIANT', currentStock: 12, minThreshold: 8, unitCostInMicrounits: 32_000_000, sellingPriceInMicrounits: 75_000_000 },
  { id: 'prt-4', oemReference: 'MICH-2055516-PS4', name: 'Pneu Pilot Sport 4 205/55 R16 91W', supplier: 'Michelin Pro', category: 'PNEUMATIQUE', currentStock: 2, minThreshold: 4, unitCostInMicrounits: 68_000_000, sellingPriceInMicrounits: 115_000_000 },
  { id: 'prt-5', oemReference: 'GAT-K015678XS', name: 'Kit Distribution + Pompe à Eau', supplier: 'Gates Auto', category: 'DISTRIBUTION', currentStock: 3, minThreshold: 2, unitCostInMicrounits: 110_000_000, sellingPriceInMicrounits: 240_000_000 },
];

export function PartsInventoryPage() {
  const { activeTenantId } = useTenant();
  const [parts, setParts] = useState<AutoPart[]>(INITIAL_PARTS);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filtered = parts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.oemReference.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const lowStockCount = parts.filter(p => p.currentStock <= p.minThreshold).length;
  const totalValuationMu = parts.reduce((s, p) => s + (p.currentStock * p.unitCostInMicrounits), 0);

  const handleAdjust = (id: string, delta: number) => {
    setParts(prev => prev.map(p => {
      if (p.id !== id) return p;
      return { ...p, currentStock: Math.max(0, p.currentStock + delta) };
    }));
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{"🔩"}</span>
            <h1 className="text-xl font-bold font-serif">{"Stock Pièces Détachées & Consommables Auto"}</h1>
          </div>
          <p className="text-xs text-text-muted mt-1">
            {"Gestion des références OEM équipementiers, approvisionnement rapide et valorisation magasin."}
          </p>
        </div>

        <button
          onClick={() => alert("Génération de commande groupée équipementiers...")}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <Package className="w-4 h-4" />
          {"Commander réassort pièces"}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-orange-500" />
            {"Références en magasin"}
          </p>
          <p className="text-2xl font-bold font-mono text-orange-600">{parts.length}</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            {"Alertes réappro"}
          </p>
          <p className={`text-2xl font-bold font-mono ${lowStockCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {lowStockCount}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
            {"Valeur stock pièces"}
          </p>
          <p className="text-2xl font-bold font-mono">
            {((totalValuationMu / 1_000_000)).toFixed(2)} {"€"}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5 text-blue-500" />
            {"Délai approvis. moyen"}
          </p>
          <p className="text-sm font-semibold font-mono text-text-primary mt-1">{"H+4 (Livraison locale)"}</p>
        </div>
      </div>

      {/* Search & Categories */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par référence OEM, dénomination ou fournisseur..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-surface-card text-xs focus:border-orange-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 border-b border-border/80 pb-3">
          {[
            { id: 'all', label: 'Toutes les familles' },
            { id: 'FREINAGE', label: 'Freinage' },
            { id: 'FILTRATION', label: 'Filtration' },
            { id: 'LUBRIFIANT', label: 'Lubrifiants' },
            { id: 'PNEUMATIQUE', label: 'Pneumatiques' },
            { id: 'DISTRIBUTION', label: 'Distribution' },
          ].map(c => (
            <button
              key={c.id}
              onClick={() => setCategoryFilter(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                categoryFilter === c.id
                  ? 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border border-orange-500/30'
                  : 'text-text-muted hover:text-text-primary hover:bg-surface-hover'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grille des pièces */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {filtered.map(part => {
          const isLow = part.currentStock <= part.minThreshold;
          const costEur = (part.unitCostInMicrounits / 1_000_000).toFixed(2);
          const sellEur = (part.sellingPriceInMicrounits / 1_000_000).toFixed(2);

          return (
            <div
              key={part.id}
              className={`rounded-xl border p-4 space-y-3 transition-all ${
                isLow
                  ? 'border-rose-500/40 bg-rose-500/5 ring-1 ring-rose-500/20'
                  : 'border-border bg-surface-card'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-text-primary">{part.name}</h3>
                  <p className="text-[11px] font-mono text-text-muted mt-0.5">{part.oemReference}</p>
                </div>
                {isLow && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1 shrink-0">
                    <AlertTriangle className="w-3 h-3" />
                    {"Seuil bas"}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-base border border-border/70">
                <div>
                  <p className="text-[10px] uppercase font-medium text-text-muted">{"En stock atelier"}</p>
                  <p className={`text-2xl font-bold font-mono ${isLow ? 'text-rose-600' : 'text-text-primary'}`}>
                    {part.currentStock}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleAdjust(part.id, -1)}
                    className="w-10 h-10 rounded-lg border border-border bg-surface-card hover:bg-surface-hover flex items-center justify-center text-text-primary transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleAdjust(part.id, 1)}
                    className="w-10 h-10 rounded-lg border border-border bg-surface-card hover:bg-surface-hover flex items-center justify-center text-text-primary transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-text-muted pt-1">
                <span>{"Achat :"} {costEur} {"€"}</span>
                <span className="font-bold text-text-primary">{"Vente :"} {sellEur} {"€"}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
