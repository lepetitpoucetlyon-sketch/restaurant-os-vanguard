'use client';

import { useSovereignCollection } from '@/kernel/hooks/useSovereignCollection';
import React, { useState } from 'react';
import { Sparkles, AlertTriangle, Package, RefreshCw, Plus, Minus, Search } from 'lucide-react';
import { useTenant } from '@/shared/hooks/useTenant';

interface TechnicalProduct {
  id: string;
  name: string;
  brand: string;
  type: 'coloration' | 'oxydant' | 'soin_technique' | 'shampoing_bac';
  currentStock: number;
  minThreshold: number;
  unit: string;
  lastUsedDate: string;
}



export function CabinStockPage() {
  const { activeTenantId } = useTenant();
  const {
    data: items,
    isLoading,
    update,
    refresh,
  } = useSovereignCollection<TechnicalProduct>('cabinStock', { tenantId: activeTenantId ?? undefined });
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const filtered = items.filter(it => {
    const matchesSearch = it.name.toLowerCase().includes(search.toLowerCase()) || it.brand.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || it.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const lowStockCount = items.filter(it => it.currentStock <= it.minThreshold).length;

  const handleAdjust = async (id: string, delta: number) => {
    const cible = items.find(o => o.id === id);
    if (!cible) return;
    await update(id, { currentStock: Math.max(0, cible.currentStock + delta) } as Partial<TechnicalProduct>);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{"🧴"}</span>
            <h1 className="text-xl font-bold font-serif">{"Stock Cabine & Produits Techniques"}</h1>
          </div>
          <p className="text-xs text-text-muted mt-1">
            {"Suivi des consommations techniques bac/cabine (colorations, oxydants, soins) et alertes réapprovisionnement."}
          </p>
        </div>

        <button
          onClick={() => alert("Génération de la commande de réassort cabine...")}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <Package className="w-4 h-4" />
          {"Commander produits bac/cabine"}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-purple-500" />
            {"Références cabine"}
          </p>
          <p className="text-2xl font-bold font-mono text-purple-600">{items.length}</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            {"Alertes réassort"}
          </p>
          <p className={`text-2xl font-bold font-mono ${lowStockCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {lowStockCount}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            {"Conformité FDS / Sécurité"}
          </p>
          <p className="text-2xl font-bold font-mono text-emerald-600">{"100 %"}</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5 text-blue-500" />
            {"Dernier inventaire"}
          </p>
          <p className="text-sm font-semibold font-mono text-text-primary mt-1">{"Semaine 35"}</p>
        </div>
      </div>

      {/* Filtres & Recherche */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filtrer par produit, marque ou teinte..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-surface-card text-xs focus:border-purple-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 border-b border-border/80 pb-3">
          {[
            { id: 'all', label: 'Tous les produits' },
            { id: 'coloration', label: 'Colorations' },
            { id: 'oxydant', label: 'Oxydants' },
            { id: 'soin_technique', label: 'Soins & Traitements' },
            { id: 'shampoing_bac', label: 'Bacs & Shampoings' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTypeFilter(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                typeFilter === t.id
                  ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30'
                  : 'text-text-muted hover:text-text-primary hover:bg-surface-hover'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grille des produits cabine */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {filtered.map(product => {
          const isLow = product.currentStock <= product.minThreshold;

          return (
            <div
              key={product.id}
              className={`rounded-xl border p-4 space-y-3 transition-all ${
                isLow
                  ? 'border-rose-500/40 bg-rose-500/5 ring-1 ring-rose-500/20'
                  : 'border-border bg-surface-card'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">{product.name}</h3>
                  <p className="text-[11px] text-text-muted mt-0.5">{product.brand}</p>
                </div>
                {isLow && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1 shrink-0">
                    <AlertTriangle className="w-3 h-3" />
                    {"Seuil atteint"}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-base border border-border/70">
                <div>
                  <p className="text-[10px] uppercase font-medium text-text-muted">{"Disponible cabine"}</p>
                  <p className={`text-xl font-bold font-mono ${isLow ? 'text-rose-600' : 'text-text-primary'}`}>
                    {product.currentStock} <span className="text-xs font-normal text-text-muted">{product.unit}</span>
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleAdjust(product.id, -1)}
                    className="w-10 h-10 rounded-lg border border-border bg-surface-card hover:bg-surface-hover flex items-center justify-center text-text-primary transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleAdjust(product.id, 1)}
                    className="w-10 h-10 rounded-lg border border-border bg-surface-card hover:bg-surface-hover flex items-center justify-center text-text-primary transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-text-muted pt-1">
                <span>{"Seuil min :"} {product.minThreshold} {product.unit}</span>
                <span>{product.lastUsedDate}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
