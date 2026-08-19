"use client";
import React from 'react';

import { RoleGate } from "@nexus/guards";
import { AlertSync } from "@/shared/components/AlertSync";
import { ClientComponents } from "@components/layout/ClientComponents";
import { TrainingOverlay } from "@components/layout/TrainingOverlay";
import { SplashGate } from "@/shared/providers/SplashGate";

/**
 * Couche 3 — Composants de surface : alertes, formation, splash, role gate.
 * Monté en fin de stack, juste avant les enfants.
 */
export function SurfaceUIProviders({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AlertSync />
      <TrainingOverlay />
      <ClientComponents>
        <RoleGate>
          <SplashGate>
            {children}
          </SplashGate>
        </RoleGate>
      </ClientComponents>
    </>
  );
}
