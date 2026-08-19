"use client";
import React from 'react';

import { CoreInfraProviders } from "./providers/CoreInfraProviders";
import { DomainOrchestrationProviders } from "./providers/DomainOrchestrationProviders";
import { SurfaceUIProviders } from "./providers/SurfaceUIProviders";

/**
 * NexusProviderStack — shell d'assemblage des 3 couches de providers React.
 *
 * Fragmenté en 3 sous-composants thématiques (décomposition anti-god-file) :
 *   1. CoreInfraProviders          — infra bas-niveau (context, guards de base, toast, branding)
 *   2. DomainOrchestrationProviders — piliers métier (ops/finance/intelligence) + gates auth/billing/compliance
 *   3. SurfaceUIProviders          — composants de surface (alerts, formation, splash, role)
 *
 * Ce shell orchestre juste l'imbrication ; chaque couche est autonome et testable seule.
 */
export function NexusProviderStack({ children }: { children: React.ReactNode }) {
  return (
    <CoreInfraProviders>
      <DomainOrchestrationProviders>
        <SurfaceUIProviders>
          {children}
        </SurfaceUIProviders>
      </DomainOrchestrationProviders>
    </CoreInfraProviders>
  );
}
