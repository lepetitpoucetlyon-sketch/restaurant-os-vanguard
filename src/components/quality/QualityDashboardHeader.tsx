// @ts-nocheck
// @ts-nocheck
"use client";

import React from 'react';
import { useAtomValue } from 'jotai';
import { qualityGlobalMetricsSelector } from '@/store/qualityAtoms';
import { ShieldCheck, TrendingUp, AlertCircle, Award } from 'lucide-react';
import { cn } from "@/lib/ui.foundations";

/**
 * 📊 QualityDashboardHeader - Operational Hub
 * High-fidelity KPI dashboard for HACCP management.
 */
export function QualityDashboardHeader() {
  const metrics = useAtomValue(qualityGlobalMetricsSelector);

  const kpis = [
    { 
      label: "Contrôles (Mois)", 
      value: metrics.totalControlsThisMonth, 
      sub: "Cible: 20",
      icon: ShieldCheck,
      color: "text-accent-gold"
    },
    { 
      label: "Taux d'Acceptation", 
      value: `${metrics.complianceScore}%`, 
      sub: "+0.4% vs M-1",
      icon: Award,
      color: "text-success"
    },
    { 
      label: "Taux de Rejet", 
      value: `${metrics.monthlyRejectionRate}%`, 
      sub: "Cible: < 2.5%",
      icon: AlertCircle,
      color: "text-error"
    },
    { 
      label: "Fraîcheur Moyenne", 
      value: `${metrics.averageFreshness}/5`, 
      sub: "Grade Excellence",
      icon: TrendingUp,
      color: "text-blue-500"
    }
  ];

  return (
    <div className="bg-bg-secondary px-8 pt-8 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end border-b border-border shadow-sm gap-6">
      <div>
        <h1 className="text-4xl font-serif font-black italic text-text-primary tracking-tighter flex items-center gap-3">
          Contrôle Qualité
          <span className="text-accent-gold not-italic">.</span>
        </h1>
        <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.4em] mt-2 italic flex items-center gap-2">
          HACCP 1.0 • Traçabilité Totale • Grade VI Ecosystem
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full md:w-auto">
        {kpis.map((kpi, i) => (
          <div key={i} className="text-right px-4 py-3 bg-bg-tertiary rounded-2xl border border-border/50 hover:border-accent-gold transition-all group">
            <div className="flex items-center justify-end gap-2 mb-1">
               <kpi.icon className={cn("w-3 h-3 transition-transform group-hover:scale-125", kpi.color)} />
               <p className="text-[8px] font-black text-text-muted uppercase tracking-widest leading-none">{kpi.label}</p>
            </div>
            <p className={cn("text-xl font-mono font-bold leading-none", kpi.color)}>{kpi.value}</p>
            <p className="text-[7px] font-medium text-text-muted/60 mt-1 uppercase tracking-tighter">{kpi.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
