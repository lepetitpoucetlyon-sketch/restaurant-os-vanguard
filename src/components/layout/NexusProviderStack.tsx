"use client";
import React from 'react';

// Providers Layers
import { NexusCoreProvider } from "@/engines/core/NexusCoreProvider";
import { NexusOpsProvider } from "@/engines/ops/NexusOpsProvider";
import { NexusFiscalProvider } from "@/engines/fiscal/NexusFiscalProvider";
import { NexusGuardProvider } from "@nexus/guards/NexusGuardProvider";
import { NexusFleetProvider } from "@/engines/fleet/NexusFleetProvider";
import { ToastProvider } from "@ui/Toast";
import { ContextualSettingsProvider } from "@/components/settings/ContextualSettings";

// Gates & Orchestrators
import { 
  InstanceGuardGate, 
  AuthGate, 
  SaaSBillingGate, 
  ComplianceGate, 
  RoleGate 
} from "@nexus/guards";
import { AlertSync } from "@/components/system/AlertSync";
import { ClientComponents } from "@/components/layout/ClientComponents";
import { TrainingOverlay } from "@/components/layout/TrainingOverlay";
import { SovereignLockout } from "@/components/layout/SovereignLockout";
import { BrandingProvider } from "@/infrastructure/components/BrandingProvider";
import { PerformanceEngine } from "@/theme/PerformanceEngine";
import { NexusPulseOrchestrator } from "@/engines/NexusPulseOrchestrator";

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
                            <SaaSBillingGate>
                            <ComplianceGate>
                                <AlertSync />
                                <TrainingOverlay />
                                <ClientComponents>
                                <RoleGate>
                                    {children}
                                </RoleGate>
                                </ClientComponents>
                            </ComplianceGate>
                            </SaaSBillingGate>
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
