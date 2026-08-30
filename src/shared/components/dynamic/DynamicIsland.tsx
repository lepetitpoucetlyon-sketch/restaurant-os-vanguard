// @wip owner:design-system-team échéance:2026-Q4 — primitive UI shared à adopter (audit orphelins 2026-08-30)
'use client';

import React, { Suspense, ComponentType } from 'react';
import { Loader2 } from 'lucide-react';

export interface DynamicIslandProps<T extends object> {
  islandName: string;
  category?: 'CANVAS' | 'PDF_ENGINE' | 'DATAVIZ' | 'IOT_STREAM';
  component: ComponentType<T>;
  props: T;
  fallback?: React.ReactNode;
}

/**
 * 🏝️ DynamicIsland — Isolateur de Bundles Lourds (>100KB)
 * 
 * Isole les composants graphiques ou dépendances lourdes (Konva, jsPDF, D3, MQTT)
 * pour garantir un First Contentful Paint (FCP) < 500ms sur l'ensemble de Restaurant OS.
 */
export function DynamicIsland<T extends object>({
  islandName,
  category = 'CANVAS',
  component: Component,
  props,
  fallback,
}: DynamicIslandProps<T>) {
  const defaultFallback = (
    <div className="w-full h-full min-h-[220px] rounded-3xl bg-surface-card/60 border border-border/60 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center space-y-3 animate-pulse">
      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
      <div>
        <h4 className="text-xs font-bold text-text-primary tracking-wide">
          Chargement de l&apos;îlot {islandName}
        </h4>
        <p className="text-micro text-text-muted mt-0.5">
          {category === 'CANVAS' && 'Initialisation du moteur de rendu vectoriel 2D/3D'}
          {category === 'PDF_ENGINE' && 'Chargement du compilateur fiscal Factur-X / PDF'}
          {category === 'DATAVIZ' && 'Calcul des projections graphiques & agrégats'}
          {category === 'IOT_STREAM' && 'Connexion au broker télémétrique matériel'}
        </p>
      </div>
    </div>
  );

  return (
    <Suspense fallback={fallback || defaultFallback}>
      <Component {...props} />
    </Suspense>
  );
}
