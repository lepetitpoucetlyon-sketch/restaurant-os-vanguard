'use client';

import React, { useState } from 'react';
import { TrendingUp, Calendar, ArrowUpRight, ArrowDownRight, Sparkles, Sliders, RefreshCw } from 'lucide-react';
import { useTenant } from '@/shared/hooks/useTenant';

interface DayYield {
  date: string;
  dayOfWeek: string;
  occupancyRatePct: number;
  averageDailyRateMu: number; // ADR
  revParMu: number;           // RevPAR
  baseRateMu: number;
  recommendedRateMu: number;
  demandLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'PEAK';
}

const YIELD_DATA: DayYield[] = [
  { date: '2026-09-01', dayOfWeek: 'Mardi', occupancyRatePct: 82.5, averageDailyRateMu: 165_000_000, revParMu: 136_125_000, baseRateMu: 140_000_000, recommendedRateMu: 175_000_000, demandLevel: 'HIGH' },
  { date: '2026-09-02', dayOfWeek: 'Mercredi', occupancyRatePct: 88.0, averageDailyRateMu: 170_000_000, revParMu: 149_600_000, baseRateMu: 140_000_000, recommendedRateMu: 185_000_000, demandLevel: 'HIGH' },
  { date: '2026-09-03', dayOfWeek: 'Jeudi', occupancyRatePct: 94.0, averageDailyRateMu: 195_000_000, revParMu: 183_300_000, baseRateMu: 140_000_000, recommendedRateMu: 210_000_000, demandLevel: 'PEAK' },
  { date: '2026-09-04', dayOfWeek: 'Vendredi', occupancyRatePct: 96.5, averageDailyRateMu: 220_000_000, revParMu: 212_300_000, baseRateMu: 160_000_000, recommendedRateMu: 240_000_000, demandLevel: 'PEAK' },
  { date: '2026-09-05', dayOfWeek: 'Samedi', occupancyRatePct: 98.0, averageDailyRateMu: 235_000_000, revParMu: 230_300_000, baseRateMu: 160_000_000, recommendedRateMu: 255_000_000, demandLevel: 'PEAK' },
  { date: '2026-09-06', dayOfWeek: 'Dimanche', occupancyRatePct: 65.0, averageDailyRateMu: 145_000_000, revParMu: 94_250_000, baseRateMu: 130_000_000, recommendedRateMu: 135_000_000, demandLevel: 'MEDIUM' },
  { date: '2026-09-07', dayOfWeek: 'Lundi', occupancyRatePct: 58.0, averageDailyRateMu: 135_000_000, revParMu: 78_300_000, baseRateMu: 130_000_000, recommendedRateMu: 125_000_000, demandLevel: 'LOW' },
];

export function YieldManagementPage() {
  const { activeTenantId } = useTenant();
  const [data, setData] = useState<DayYield[]>(YIELD_DATA);

  const avgOccupancy = (data.reduce((s, d) => s + d.occupancyRatePct, 0) / data.length).toFixed(1);
  const avgAdrEur = ((data.reduce((s, d) => s + d.averageDailyRateMu, 0) / data.length) / 1_000_000).toFixed(2);
  const avgRevParEur = ((data.reduce((s, d) => s + d.revParMu, 0) / data.length) / 1_000_000).toFixed(2);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{"📈"}</span>
            <h1 className="text-xl font-bold font-serif">{"Yield Management & Tarification Dynamique"}</h1>
          </div>
          <p className="text-xs text-text-muted mt-1">
            {"Optimisation automatisée du RevPAR, détection des pics de demande et synchronisation Channel Manager."}
          </p>
        </div>

        <button
          onClick={() => alert("Re-calcul et synchronisation des barèmes tarifaires OTA...")}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          {"Recalculer tarifs IA"}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
            {"Taux d'Occupation moyen"}
          </p>
          <p className="text-2xl font-bold font-mono text-blue-600">{avgOccupancy} %</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
            {"Prix Moyen (ADR)"}
          </p>
          <p className="text-2xl font-bold font-mono text-emerald-600">{avgAdrEur} {"€"}</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
            {"RevPAR Global"}
          </p>
          <p className="text-2xl font-bold font-mono text-purple-600">{avgRevParEur} {"€"}</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-amber-500" />
            {"Stratégie Active"}
          </p>
          <p className="text-sm font-semibold font-mono text-text-primary mt-1">{"Maximisation RevPAR"}</p>
        </div>
      </div>

      {/* Grille Prévisionnelle 7 Jours */}
      <div className="rounded-xl border border-border bg-surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-surface-base/60 text-text-muted uppercase font-medium border-b border-border text-[10px]">
              <tr>
                <th className="py-3 px-4">{"Date / Jour"}</th>
                <th className="py-3 px-4 text-center">{"Niveau Demande"}</th>
                <th className="py-3 px-4 text-center">{"TO Prévisionnel"}</th>
                <th className="py-3 px-4 text-right">{"Prix Moyen Actuel"}</th>
                <th className="py-3 px-4 text-right">{"Tarif Recommandé IA"}</th>
                <th className="py-3 px-4 text-right">{"RevPAR Estimé"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {data.map(day => {
                const adr = (day.averageDailyRateMu / 1_000_000).toFixed(2);
                const rec = (day.recommendedRateMu / 1_000_000).toFixed(2);
                const rev = (day.revParMu / 1_000_000).toFixed(2);

                const demandBadge = {
                  LOW: { label: 'Faible', bg: 'bg-zinc-500/10 text-zinc-600' },
                  MEDIUM: { label: 'Modérée', bg: 'bg-blue-500/10 text-blue-600' },
                  HIGH: { label: 'Forte', bg: 'bg-amber-500/10 text-amber-600' },
                  PEAK: { label: 'Pic / Saturé', bg: 'bg-rose-500/10 text-rose-600 font-bold' },
                }[day.demandLevel];

                return (
                  <tr key={day.date} className="hover:bg-surface-hover/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-text-primary">
                      {day.dayOfWeek} <span className="font-mono text-[10px] text-text-muted font-normal">({day.date})</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${demandBadge.bg}`}>
                        {demandBadge.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-text-primary">
                      {day.occupancyRatePct}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-text-secondary">{adr} {"€"}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-blue-600 dark:text-blue-400">{rec} {"€"}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">{rev} {"€"}</td>
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
