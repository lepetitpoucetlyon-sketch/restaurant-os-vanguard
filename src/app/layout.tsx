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
// Nexus Industrial Engines
import { NexusCoreProvider } from "@/engines/core/NexusCoreProvider";
import { NexusOpsProvider } from "@/engines/ops/NexusOpsProvider";
import { NexusFiscalProvider } from "@/engines/fiscal/NexusFiscalProvider";
import { NexusGuardProvider } from "@/engines/guard/NexusGuardProvider";
import { NexusFleetProvider } from "@/engines/fleet/NexusFleetProvider";

// Specialized UI Helpers
import { ToastProvider } from "@/components/ui/Toast";
import { ContextualSettingsProvider } from "@/components/settings/ContextualSettings";
import { ErrorBoundary } from "@/components/system/ErrorBoundary";

// Gates & Orchestrators
// ... (imports continue)
import { AuthGate } from "@/components/auth/AuthGate";
import { SaaSBillingGate } from "@/components/auth/SaaSBillingGate";
import { ComplianceGate } from "@/components/auth/ComplianceGate";
import { RoleGate } from "@/components/auth/RoleGate";
import { AlertSync } from "@/components/system/AlertSync";
import { ClientComponents } from "@/components/layout/ClientComponents";
import { TrainingOverlay } from "@/components/layout/TrainingOverlay";
import { SovereignLockout } from "@/components/layout/SovereignLockout";
import { ThemeEngine } from "@/components/layout/ThemeEngine";
import { PerformanceEngine } from "@/theme/PerformanceEngine";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="light" suppressHydrationWarning>
      <head />
      <body 
        className={`${inter.variable} ${cormorant.variable} ${jetbrainsMono.variable} font-sans antialiased bg-bg-primary text-text-primary transition-colors duration-500`}
      >
        <ErrorBoundary>
          <NexusCoreProvider>
            <ToastProvider>
              <ContextualSettingsProvider>
                <NexusOpsProvider>
                  <NexusGuardProvider>
                    <NexusFiscalProvider>
                      <NexusFleetProvider>
                        <ThemeEngine />
                        <PerformanceEngine />
                        <SovereignLockout />
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
                    </NexusFiscalProvider>
                  </NexusGuardProvider>
                </NexusOpsProvider>
              </ContextualSettingsProvider>
            </ToastProvider>
          </NexusCoreProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
