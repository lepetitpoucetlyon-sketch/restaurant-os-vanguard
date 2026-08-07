import React, { Suspense } from "react";
import type { Metadata } from "next";
import { Inter, Cormorant_Garamond, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { whiteLabelInstanceConfig } from "@/config/instance";
import { ErrorBoundary } from "@/shared/components/ErrorBoundary";
import { NexusProviderStack } from "@components/layout/NexusProviderStack";
import { ImpersonationBanner } from "@components/layout/ImpersonationBanner";
import { ServiceWorkerRegistration } from "@components/ServiceWorkerRegistration";
import { ThemeApplicator } from "@/shared/components/ThemeApplicator";

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
  manifest: "/manifest.json",
  themeColor: "#C5A059",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Restaurant OS",
  },
  icons: {
    apple: "/icons/icon-192.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning className={`${inter.variable} ${cormorant.variable} ${jetbrainsMono.variable}`}>
      <head>
        {process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN && (
          <Script
            defer
            data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
            src="https://plausible.io/js/script.js"
            strategy="afterInteractive"
          />
        )}
      </head>
      <body className="min-h-screen bg-surface-bg font-sans antialiased selection:bg-action-primary/20 text-text-primary transition-colors duration-500">
        <ServiceWorkerRegistration />
        <ErrorBoundary>
          <Suspense fallback={<div className="flex h-screen items-center justify-center bg-surface-sidebar text-text-primary font-mono text-[10px] tracking-widest">[ RELOADING_CORE_STREAMS... ]</div>}>
            <NexusProviderStack>
                <ThemeApplicator />
                <ImpersonationBanner />
                {children}
            </NexusProviderStack>
          </Suspense>
        </ErrorBoundary>
      </body>
    </html>
  );
}
