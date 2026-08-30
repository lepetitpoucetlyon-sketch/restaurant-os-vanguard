'use client';
import { Button } from '@/shared/components/ui/Button';

import React, { useState, useMemo } from 'react';
import { EyeOff, AlertOctagon, AlertTriangle, ShieldCheck, CheckCircle2, Wrench, Search } from 'lucide-react';
import { cn } from '@/lib/ui.foundations';
import { runBlindSpotRules, DEFAULT_RULES, type BlindSpot } from '@/verticals/_shared/blind-spot';
import { resolveBlueprintCapabilities } from '@/verticals/_shared/blueprint/VerticalBlueprint';
import { RESTAURANT_BLUEPRINT } from '@/verticals/restaurant/restaurant.blueprint';
import { BAKERY_BLUEPRINT } from '@/verticals/bakery/bakery.blueprint';
import { GYM_BLUEPRINT } from '@/verticals/gym/gym.blueprint';
import { SALON_BLUEPRINT } from '@/verticals/salon/salon.blueprint';
import { VETERINARY_BLUEPRINT } from '@/verticals/veterinary/veterinary.blueprint';
import { HOTEL_BLUEPRINT } from '@/verticals/hotel/hotel.blueprint';
import type { SectorStudy } from '@/verticals/_shared/blueprint/SectorStudy';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- blueprints hétérogènes (chaque vertical a un shape distinct)
const BLUEPRINTS: Record<string, any> = {
  restaurant: RESTAURANT_BLUEPRINT,
  bakery: BAKERY_BLUEPRINT,
  gym: GYM_BLUEPRINT,
  salon: SALON_BLUEPRINT,
  veterinary: VETERINARY_BLUEPRINT,
  hotel: HOTEL_BLUEPRINT,
};

const DUMMY_STUDY: SectorStudy = {
  vertical: 'restaurant',
  summary: 'Étude sectorielle baseline',
  workflows: [],
  regulations: [],
  hardware: [],
  kpis: [],
  businessRules: [],
  integrations: [],
};

export function BlindSpotTab() {
  const [selectedVertical, setSelectedVertical] = useState<string>('restaurant');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  const currentBlueprint = BLUEPRINTS[selectedVertical] ?? RESTAURANT_BLUEPRINT;

  const report = useMemo(() => {
    const effectiveCapabilities = resolveBlueprintCapabilities(currentBlueprint);
    return runBlindSpotRules(DEFAULT_RULES, 'vertical', {
      blueprint: currentBlueprint,
      study: currentBlueprint.study ?? DUMMY_STUDY,
      effectiveCapabilities,
    });
  }, [currentBlueprint]);

  const filteredSpots = useMemo(() => {
    if (severityFilter === 'ALL') return report.triggered;
    return report.triggered.filter((s: BlindSpot) => s.severity === severityFilter);
  }, [report, severityFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-surface-card border border-border-default backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-wider">
              Forge Stack P2bis • BlindSpot Detector
            </span>
          </div>
          <h2 className="text-xl font-black text-text-primary">Détecteur des Angles Morts Métiers & Légaux</h2>
          <p className="text-xs text-text-muted mt-0.5">
            Audit exhaustif des 20 règles de complétude (NF525, HACCP, RGPD, hardware manquant, dépendances).
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {Object.keys(BLUEPRINTS).map((k) => (
            <button
              key={k}
              onClick={() => setSelectedVertical(k)}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase transition-all",
                selectedVertical === k
                  ? "bg-rose-600 text-white shadow-lg shadow-rose-600/20"
                  : "bg-surface-glass text-text-muted hover:text-text-primary"
              )}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-surface-card border border-border-default">
          <span className="text-micro font-bold text-text-muted uppercase">Règles Évaluées</span>
          <p className="text-2xl font-black text-text-primary mt-1">{report.totalRulesRun}</p>
        </div>
        <div className="p-4 rounded-2xl bg-surface-card border border-border-default">
          <span className="text-micro font-bold text-rose-400 uppercase">Critiques</span>
          <p className="text-2xl font-black text-rose-400 mt-1">{report.summary.critical}</p>
        </div>
        <div className="p-4 rounded-2xl bg-surface-card border border-border-default">
          <span className="text-micro font-bold text-amber-400 uppercase">Hautes</span>
          <p className="text-2xl font-black text-amber-400 mt-1">{report.summary.high}</p>
        </div>
        <div className="p-4 rounded-2xl bg-surface-card border border-border-default">
          <span className="text-micro font-bold text-emerald-400 uppercase">Alertes Déclenchées</span>
          <p className="text-2xl font-black text-emerald-400 mt-1">{report.triggered.length}</p>
        </div>
      </div>

      {/* Filters & Spots List */}
      <div className="space-y-4">
        <div className="flex gap-2">
          {['ALL', 'critical', 'high', 'medium', 'low'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all",
                severityFilter === sev
                  ? "bg-surface-glass-hover text-text-primary"
                  : "bg-surface-glass border border-border-default text-text-muted hover:text-text-primary"
              )}
            >
              {sev}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filteredSpots.map((spot: BlindSpot) => (
            <div
              key={spot.id}
              className="p-5 rounded-3xl bg-surface-card border border-border-default space-y-3 hover:border-border-focus transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-full text-nano font-bold uppercase tracking-wider",
                    spot.severity === 'critical' ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                    spot.severity === 'high' ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                    "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  )}>
                    {spot.severity}
                  </span>
                  <h3 className="font-bold text-sm text-text-primary">{spot.title}</h3>
                </div>
                <span className="text-xs font-mono text-text-muted">{spot.family}</span>
              </div>

              <div className="text-xs text-text-secondary space-y-1 pl-2 border-l-2 border-border-default">
                {spot.evidence.map((ev: string, i: number) => (
                  <p key={i}>• {ev}</p>
                ))}
              </div>

              <div className="p-3 rounded-2xl bg-surface-glass border border-border-default flex items-center justify-between">
                <div className="text-xs">
                  <span className="text-text-muted font-bold uppercase text-nano block">Correction Recommandée :</span>
                  <span className="text-text-secondary">{spot.suggestedFix.rationale}</span>
                </div>
                <button className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md">
                  Appliquer le Fix
                </button>
              </div>
            </div>
          ))}

          {filteredSpots.length === 0 && (
            <div className="p-12 text-center rounded-3xl bg-surface-card/40 border border-border-default text-text-muted space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="font-bold text-text-primary text-sm">Zéro angle mort détecté pour cette sélection.</p>
              <p className="text-xs">Toutes les règles de complétude réglementaire et matérielle sont respectées.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
