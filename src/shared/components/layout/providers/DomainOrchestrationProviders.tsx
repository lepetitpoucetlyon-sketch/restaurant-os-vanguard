"use client";
import React from 'react';

import { NexusOpsProvider } from "@/modules/ops";
import { NexusFiscalProvider } from "@/modules/finance";
import { NexusFleetProvider } from "@/modules/intelligence";
import { AuthGate, SaaSBillingGate, ComplianceGate } from "@nexus/guards";
import { VerticalUIProvider } from "@/shared/providers/VerticalUIProvider";

/**
 * Couche 2 — Orchestration métier : providers piliers (ops/finance/intelligence)
 * + gates auth/billing/compliance + vertical UI. Monté APRÈS l'infra core, AVANT
 * les composants de surface.
 */
export function DomainOrchestrationProviders({ children }: { children: React.ReactNode }) {
  return (
    <NexusOpsProvider>
      <NexusFiscalProvider>
        <NexusFleetProvider>
          <AuthGate>
            <VerticalUIProvider>
              <SaaSBillingGate>
                <ComplianceGate>
                  {children}
                </ComplianceGate>
              </SaaSBillingGate>
            </VerticalUIProvider>
          </AuthGate>
        </NexusFleetProvider>
      </NexusFiscalProvider>
    </NexusOpsProvider>
  );
}
