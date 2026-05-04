import React, { Suspense } from "react";
import type { Metadata } from "next";
import { Inter, Cormorant_Garamond, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { whiteLabelInstanceConfig } from "@/config/instance";

// Fonts
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const cormorant = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});
const jetbrainsMono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"] });

// Metadata
export const metadata: Metadata = {
  title: `Restaurant OS | Premium Intelligence`,
  description: whiteLabelInstanceConfig.appDescription,
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

// Providers Layers
import { NexusCoreProvider } from "@/engines/core/NexusCoreProvider";
import { NexusOpsProvider } from "@/engines/ops/NexusOpsProvider";
import { NexusFiscalProvider } from "@/engines/fiscal/NexusFiscalProvider";
import { NexusGuardProvider } from "@nexus/guards/NexusGuardProvider";
import { NexusFleetProvider } from "@/engines/fleet/NexusFleetProvider";
import { ToastProvider } from "@ui/Toast";
import { ContextualSettingsProvider } from "@/components/settings/ContextualSettings";
import { ErrorBoundary } from "@/components/system/ErrorBoundary";

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
import { ThemeEngine } from "@/components/layout/ThemeEngine";
import { PerformanceEngine } from "@/theme/PerformanceEngine";
import { NexusPulseOrchestrator } from "@/engines/NexusPulseOrchestrator";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning className={`${inter.variable} ${cormorant.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-bg-primary font-sans antialiased selection:bg-primary/20 text-text-primary transition-colors duration-500">
        <ErrorBoundary>
          <Suspense fallback={<div className="flex h-screen items-center justify-center bg-black text-white font-mono text-[10px] tracking-widest">[ RELOADING_CORE_STREAMS... ]</div>}>
            <NexusCoreProvider>
              <InstanceGuardGate>
                <ToastProvider>
                  <ThemeEngine />
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
          </Suspense>
        </ErrorBoundary>
      </body>
    </html>
  );
}
