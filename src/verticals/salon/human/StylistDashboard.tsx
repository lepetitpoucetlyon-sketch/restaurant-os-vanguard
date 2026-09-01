'use client';

import React, { useState } from 'react';
import { UserCheck, Award, Euro, Scissors, Sparkles, TrendingUp, Star } from 'lucide-react';
import { useTenant } from '@/shared/hooks/useTenant';

interface StylistPerf {
  id: string;
  name: string;
  role: string;
  servicesCount: number;
  serviceRevenueMu: number;
  productSalesMu: number;
  commissionRatePct: number;
  tipsMu: number;
  rating: number;
}

const STYLISTS_DATA: StylistPerf[] = [
  { id: 'sty-1', name: 'Élodie Renard', role: 'Maître Coloriste', servicesCount: 84, serviceRevenueMu: 8_400_000_000, productSalesMu: 1_250_000_000, commissionRatePct: 15, tipsMu: 320_000_000, rating: 4.9 },
  { id: 'sty-2', name: 'Julien Mercier', role: 'Barbier / Coupe Homme', servicesCount: 112, serviceRevenueMu: 5_376_000_000, productSalesMu: 890_000_000, commissionRatePct: 12, tipsMu: 280_000_000, rating: 4.8 },
  { id: 'sty-3', name: 'Sarah Benali', role: 'Praticienne Spa & Soins', servicesCount: 65, serviceRevenueMu: 6_825_000_000, productSalesMu: 1_840_000_000, commissionRatePct: 18, tipsMu: 410_000_000, rating: 5.0 },
];

export function StylistDashboard() {
  const { activeTenantId } = useTenant();
  const [data, setData] = useState<StylistPerf[]>(STYLISTS_DATA);

  const totalRevenueAllMu = data.reduce((s, st) => s + st.serviceRevenueMu + st.productSalesMu, 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{"💇‍♀️"}</span>
            <h1 className="text-xl font-bold font-serif">{"Performance Équipe & Commissions Stylistes"}</h1>
          </div>
          <p className="text-xs text-text-muted mt-1">
            {"Suivi du chiffre d'affaires individuel par prestation, ventes de produits cabine/revente et commissions."}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-purple-500" />
            {"Collaborateurs actifs"}
          </p>
          <p className="text-2xl font-bold font-mono text-purple-600">{data.length}</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <Scissors className="w-3.5 h-3.5 text-pink-500" />
            {"Prestations réalisées (Mois)"}
          </p>
          <p className="text-2xl font-bold font-mono text-pink-600">
            {data.reduce((s, st) => s + st.servicesCount, 0)}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <Euro className="w-3.5 h-3.5 text-emerald-500" />
            {"CA total généré"}
          </p>
          <p className="text-2xl font-bold font-mono">
            {((totalRevenueAllMu / 1_000_000)).toFixed(2)} {"€"}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            {"Satisfaction moyenne"}
          </p>
          <p className="text-2xl font-bold font-mono text-amber-600">{"4.9 / 5"}</p>
        </div>
      </div>

      {/* Cartes Stylistes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {data.map(stylist => {
          const serviceEur = (stylist.serviceRevenueMu / 1_000_000).toFixed(2);
          const productEur = (stylist.productSalesMu / 1_000_000).toFixed(2);
          const commissionEur = (((stylist.serviceRevenueMu + stylist.productSalesMu) * (stylist.commissionRatePct / 100)) / 1_000_000).toFixed(2);
          const tipsEur = (stylist.tipsMu / 1_000_000).toFixed(2);

          return (
            <div key={stylist.id} className="rounded-xl border border-border bg-surface-card p-5 space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-text-primary">{stylist.name}</h3>
                    <p className="text-xs text-text-muted">{stylist.role}</p>
                  </div>
                  <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded">
                    <Star className="w-3 h-3 fill-amber-500" />
                    {stylist.rating}
                  </span>
                </div>

                <div className="space-y-2 pt-2 border-t border-border/60 text-xs">
                  <div className="flex justify-between text-text-muted">
                    <span>{"Prestations ("}{stylist.servicesCount}{") :"}</span>
                    <span className="font-mono font-medium text-text-primary">{serviceEur} {"€"}</span>
                  </div>
                  <div className="flex justify-between text-text-muted">
                    <span>{"Ventes produits :"}</span>
                    <span className="font-mono font-medium text-text-primary">{productEur} {"€"}</span>
                  </div>
                  <div className="flex justify-between text-text-muted">
                    <span>{"Pourboires dématérialisés :"}</span>
                    <span className="font-mono font-medium text-emerald-600">{tipsEur} {"€"}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-border space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-text-primary">{"Commission ("}{stylist.commissionRatePct}{"%) :"}</span>
                  <span className="font-mono font-bold text-sm text-purple-600 dark:text-purple-400">
                    {commissionEur} {"€"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
