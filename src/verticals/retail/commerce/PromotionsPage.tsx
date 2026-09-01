'use client';

import React, { useState } from 'react';
import { Tag, Calendar, Plus, CheckCircle2, Percent, Sparkles, TrendingUp } from 'lucide-react';
import { useTenant } from '@/shared/hooks/useTenant';

interface PromotionCampaign {
  id: string;
  code: string;
  name: string;
  type: 'percentage' | 'fixed_amount' | 'bundle';
  value: number; // e.g. 20 for 20% or 10_000_000 for 10€
  startDate: string;
  endDate: string;
  usageCount: number;
  maxUsage?: number;
  status: 'active' | 'scheduled' | 'expired';
}

const INITIAL_PROMOS: PromotionCampaign[] = [
  { id: 'pro-1', code: 'WELCOME10', name: 'Offre Nouveau Client', type: 'percentage', value: 10, startDate: '2026-01-01', endDate: '2026-12-31', usageCount: 142, status: 'active' },
  { id: 'pro-2', code: 'ETE2026', name: 'Soldes d\'Été 2ᵉ Démarque', type: 'percentage', value: 30, startDate: '2026-06-25', endDate: '2026-07-31', usageCount: 489, status: 'expired' },
  { id: 'pro-3', code: 'VIPPRIVILEGE', name: 'Vente Privée Automne', type: 'fixed_amount', value: 20_000_000, startDate: '2026-09-15', endDate: '2026-09-22', usageCount: 0, maxUsage: 100, status: 'scheduled' },
  { id: 'pro-4', code: 'PACK3TSHIRTS', name: '3 T-Shirts pour 70€', type: 'bundle', value: 17_000_000, startDate: '2026-08-01', endDate: '2026-09-30', usageCount: 56, status: 'active' },
];

export function PromotionsPage() {
  const { activeTenantId } = useTenant();
  const [promos, setPromos] = useState<PromotionCampaign[]>(INITIAL_PROMOS);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = promos.filter(p => statusFilter === 'all' || p.status === statusFilter);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{"🏷️"}</span>
            <h1 className="text-xl font-bold font-serif">{"Promotions, Soldes & Codes Avantages"}</h1>
          </div>
          <p className="text-xs text-text-muted mt-1">
            {"Gestion des remises automatiques en caisse, opérations commerciales et ventes privées."}
          </p>
        </div>

        <button
          onClick={() => alert("Création d'une nouvelle règle promotionnelle...")}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-pink-600 hover:bg-pink-700 text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          {"Nouvelle promotion"}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-pink-500" />
            {"Campagnes actives"}
          </p>
          <p className="text-2xl font-bold font-mono text-pink-600">
            {promos.filter(p => p.status === 'active').length}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            {"Utilisations totales"}
          </p>
          <p className="text-2xl font-bold font-mono">
            {promos.reduce((s, p) => s + p.usageCount, 0)}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <Percent className="w-3.5 h-3.5 text-blue-500" />
            {"Remise max en cours"}
          </p>
          <p className="text-2xl font-bold font-mono text-blue-600">{"30 %"}</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            {"Panier moyen avec promo"}
          </p>
          <p className="text-2xl font-bold font-mono text-emerald-600">{"84.50 €"}</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-2 border-b border-border/80 pb-3">
        {[
          { id: 'all', label: 'Toutes les offres' },
          { id: 'active', label: 'En cours' },
          { id: 'scheduled', label: 'Programmées' },
          { id: 'expired', label: 'Terminées' },
        ].map(s => (
          <button
            key={s.id}
            onClick={() => setStatusFilter(s.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === s.id
                ? 'bg-pink-500/15 text-pink-700 dark:text-pink-300 border border-pink-500/30'
                : 'text-text-muted hover:text-text-primary hover:bg-surface-hover'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Grille des promotions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(promo => {
          const statusBadge = {
            active: { label: 'En cours', bg: 'bg-emerald-500/10 text-emerald-600' },
            scheduled: { label: 'Programmée', bg: 'bg-blue-500/10 text-blue-600' },
            expired: { label: 'Terminée', bg: 'bg-zinc-500/10 text-zinc-600' },
          }[promo.status];

          const discountLabel = promo.type === 'percentage'
            ? `-${promo.value}%`
            : promo.type === 'fixed_amount'
            ? `-${(promo.value / 1_000_000).toFixed(0)}€`
            : 'Offre Pack';

          return (
            <div key={promo.id} className="rounded-xl border border-border bg-surface-card p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-pink-600 bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/20">
                      {promo.code}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusBadge.bg}`}>
                      {statusBadge.label}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-text-primary mt-1.5">{promo.name}</h3>
                </div>

                <span className="text-base font-bold font-mono text-emerald-600">
                  {discountLabel}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] text-text-muted pt-2 border-t border-border/60">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {promo.startDate} {"→"} {promo.endDate}
                </span>
                <span>
                  {promo.usageCount} {"utilisations"}{promo.maxUsage ? ` / ${promo.maxUsage} max` : ''}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
