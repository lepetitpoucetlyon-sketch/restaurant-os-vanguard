"use client";
import React from 'react';

import { NexusCoreProvider } from "@/shared/providers/NexusCoreProvider";
import { NexusGuardProvider } from "@nexus/guards/NexusGuardProvider";
import { ToastProvider } from "@ui/Toast";
import { ContextualSettingsProvider } from "@/shared/components/settings/ContextualSettings";
import { InstanceGuardGate } from "@nexus/guards";
import { BrandingProvider } from "@/lib/BrandingProvider";
import { DensityProvider } from "@/shared/providers/DensityProvider";
import { MotionProvider } from "@/shared/providers/MotionProvider";
import { NexusPulseOrchestrator } from "@/shared/providers/NexusPulseOrchestrator";
import { SovereignLockout } from "@components/layout/SovereignLockout";

/**
 * Couche 1 — Infrastructure bas-niveau : core context, guards de base,
 * settings contextuels, orchestrateur pulse, lockout souverain, branding.
 * Ne dépend d'AUCUN pilier métier — sûr à monter en tête de l'arbre React.
 */
export function CoreInfraProviders({ children }: { children: React.ReactNode }) {
  return (
    <NexusCoreProvider>
      <InstanceGuardGate>
        <DensityProvider>
          <MotionProvider>
        <ToastProvider>
          <BrandingProvider />
          <NexusPulseOrchestrator />
          <SovereignLockout />
          <ContextualSettingsProvider>
            <NexusGuardProvider>
              {children}
            </NexusGuardProvider>
          </ContextualSettingsProvider>
        </ToastProvider>
          </MotionProvider>
        </DensityProvider>
      </InstanceGuardGate>
    </NexusCoreProvider>
  );
}
