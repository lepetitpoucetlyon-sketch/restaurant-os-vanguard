/* eslint-disable no-restricted-imports -- tolerated structural inversion */
"use client";
import React from 'react';

// Providers Layers
import { NexusCoreProvider } from "@/shared/providers/NexusCoreProvider";
import { NexusOpsProvider } from "@/modules/ops";
import { NexusFiscalProvider } from "@/modules/finance";
import { NexusGuardProvider } from "@nexus/guards/NexusGuardProvider";
import { NexusFleetProvider } from "@/modules/intelligence";
import { ToastProvider } from "@ui/Toast";
import { ContextualSettingsProvider } from "@design/settings/ContextualSettings";

// Gates & Orchestrators
import { 
  InstanceGuardGate, 
  AuthGate, 
  SaaSBillingGate, 
  ComplianceGate, 
  RoleGate 
} from "@nexus/guards";
import { AlertSync } from "@design/AlertSync";
import { ClientComponents } from "@components/layout/ClientComponents";
import { TrainingOverlay } from "@components/layout/TrainingOverlay";
import { SovereignLockout } from "@components/layout/SovereignLockout";
import { BrandingProvider } from "@/lib/BrandingProvider";
import { SplashGate } from "@/shared/providers/SplashGate";
import { VerticalUIProvider } from "@/shared/providers/VerticalUIProvider";
import { PerformanceEngine } from "@/theme/PerformanceEngine";
import { NexusPulseOrchestrator } from "@/shared/providers/NexusPulseOrchestrator";

export function NexusProviderStack({ children }: { children: React.ReactNode }) {
    return (
        <NexusCoreProvider>
            <InstanceGuardGate>
            <ToastProvider>
                <BrandingProvider />
                <PerformanceEngine />
                <NexusPulseOrchestrator />
                <SovereignLockout />
                <ContextualSettingsProvider>
                <NexusOpsProvider>
                    <NexusFiscalProvider>
                    <NexusGuardProvider>
                        <NexusFleetProvider>
                        <AuthGate>
                            {/* VerticalUIProvider : après AuthGate (variant résolu), avant les composants UI */}
                            <VerticalUIProvider>
                            <SaaSBillingGate>
                            <ComplianceGate>
                                <AlertSync />
                                <TrainingOverlay />
                                <ClientComponents>
                                <RoleGate>
                                    {/* SplashGate : après auth, avant le contenu — affiche le splash branded si activé */}
                                    <SplashGate>
                                        {children}
                                    </SplashGate>
                                </RoleGate>
                                </ClientComponents>
                            </ComplianceGate>
                            </SaaSBillingGate>
                            </VerticalUIProvider>
                        </AuthGate>
                        </NexusFleetProvider>
                    </NexusGuardProvider>
                    </NexusFiscalProvider>
                </NexusOpsProvider>
                </ContextualSettingsProvider>
            </ToastProvider>
            </InstanceGuardGate>
        </NexusCoreProvider>
    );
}
