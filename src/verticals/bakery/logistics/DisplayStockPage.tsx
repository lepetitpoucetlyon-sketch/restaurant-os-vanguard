'use client';

import React, { useState } from 'react';
import { Layers, AlertTriangle, ArrowUpRight, ArrowDownRight, RefreshCw, Plus, Minus } from 'lucide-react';
import { useTenant } from '@/shared/hooks/useTenant';

interface DisplayProduct {
  id: string;
  name: string;
  category: 'pains' | 'viennoiseries' | 'snacking' | 'patisserie';
  currentStock: number;
  minThreshold: number;
  priceInMicrounits: number;
  lastBakeTime: string;
}

const INITIAL_STOCK: DisplayProduct[] = [
  { id: 'dp-1', name: 'Baguette Tradition', category: 'pains', currentStock: 14, minThreshold: 10, priceInMicrounits: 1_300_000, lastBakeTime: '06:45' },
  { id: 'dp-2', name: 'Flûte Campagne', category: 'pains', currentStock: 4, minThreshold: 6, priceInMicrounits: 1_600_000, lastBakeTime: '06:00' },
  { id: 'dp-3', name: 'Croissant Beurre AOP', category: 'viennoiseries', currentStock: 22, minThreshold: 12, priceInMicrounits: 1_400_000, lastBakeTime: '06:30' },
  { id: 'dp-4', name: 'Pain au Chocolat', category: 'viennoiseries', currentStock: 5, minThreshold: 12, priceInMicrounits: 1_500_000, lastBakeTime: '06:30' },
  { id: 'dp-5', name: 'Sandwich Poulet Crudités', category: 'snacking', currentStock: 8, minThreshold: 5, priceInMicrounits: 5_200_000, lastBakeTime: '07:15' },
  { id: 'dp-6', name: 'Éclair Chocolat Valrhona', category: 'patisserie', currentStock: 6, minThreshold: 4, priceInMicrounits: 3_800_000, lastBakeTime: '06:00' },
];

export function DisplayStockPage() {
  const { activeTenantId } = useTenant();
  const [products, setProducts] = useState<DisplayProduct[]>(INITIAL_STOCK);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filtered = products.filter(p => categoryFilter === 'all' || p.category === categoryFilter);

  const lowStockCount = products.filter(p => p.currentStock <= p.minThreshold).length;
  const totalItems = products.reduce((acc, p) => acc + p.currentStock, 0);
  const totalDisplayValueMu = products.reduce((acc, p) => acc + (p.currentStock * p.priceInMicrounits), 0);

  const handleAdjust = (id: string, delta: number) => {
    setProducts(prev => prev.map(p => {
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
            <span className="text-2xl">{"🥖"}</span>
            <h1 className="text-xl font-bold font-serif">{"Stock Vitrine & Réapprovisionnement"}</h1>
          </div>
          <p className="text-xs text-text-muted mt-1">
            {"Suivi temps réel des quantités disponibles à la vente en boutique et alertes de rupture."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setProducts(INITIAL_STOCK)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface-card hover:bg-surface-hover text-xs font-medium transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-text-muted" />
            {"Actualiser vitrine"}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-500" />
            {"Articles en vitrine"}
          </p>
          <p className="text-2xl font-bold font-mono text-amber-600">{totalItems}</p>
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
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
            {"Valeur marchande vitrine"}
          </p>
          <p className="text-2xl font-bold font-mono">
            {((totalDisplayValueMu / 1_000_000)).toFixed(2)} {"€"}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5 text-blue-500" />
            {"Taux de disponibilité"}
          </p>
          <p className="text-2xl font-bold font-mono text-emerald-600">{"94.2 %"}</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-2 border-b border-border/80 pb-3">
        {[
          { id: 'all', label: 'Tous les rayons' },
          { id: 'pains', label: 'Pains & Baguettes' },
          { id: 'viennoiseries', label: 'Viennoiseries' },
          { id: 'snacking', label: 'Snacking & Déjeuner' },
          { id: 'patisserie', label: 'Pâtisseries' },
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategoryFilter(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              categoryFilter === cat.id
                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                : 'text-text-muted hover:text-text-primary hover:bg-surface-hover'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grille des produits vitrine */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {filtered.map(product => {
          const isLow = product.currentStock <= product.minThreshold;
          const priceEur = (product.priceInMicrounits / 1_000_000).toFixed(2);

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
                  <p className="text-[11px] text-text-muted mt-0.5 capitalize">
                    {product.category} · {priceEur} {"€"}
                  </p>
                </div>
                {isLow && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1 shrink-0">
                    <AlertTriangle className="w-3 h-3" />
                    {"Réassort urgent"}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-surface-base border border-border/70">
                <div>
                  <p className="text-[10px] uppercase font-medium text-text-muted">{"En rayon"}</p>
                  <p className={`text-2xl font-bold font-mono ${isLow ? 'text-rose-600' : 'text-text-primary'}`}>
                    {product.currentStock}
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
                <span>{"Seuil d'alerte :"} {product.minThreshold}</span>
                <span>{"Dernière fournée :"} {product.lastBakeTime}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
