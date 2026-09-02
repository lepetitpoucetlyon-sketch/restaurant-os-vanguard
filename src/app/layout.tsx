import React, { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Outfit, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { whiteLabelInstanceConfig } from "@/config/instance";
import { ErrorBoundary } from "@/shared/components/ErrorBoundary";
import { NexusProviderStack } from "@components/layout/NexusProviderStack";
import { ImpersonationBanner } from "@components/layout/ImpersonationBanner";
import { OfflineSyncBanner } from "@/shared/components/layout/OfflineSyncBanner";
import { ServiceWorkerRegistration } from "@components/ServiceWorkerRegistration";
import { ThemeApplicator } from "@/shared/components/ThemeApplicator";

// Fonts — taste-skill compliant.
// Outfit remplace Inter (bannie). Instrument Serif remplace Cormorant Garamond
// et n'est utilisée que pour kickers / hero / KPI éditoriaux, jamais body dashboard.
// L'alias CSS --font-inter reste défini (Outfit derrière) pour ne pas casser
// les consommateurs pendant la migration progressive.
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});
const instrumentSerif = Instrument_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
});
const jetbrainsMono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"] });

// Metadata
export const metadata: Metadata = {
  title: `Restaurant OS | Premium Intelligence`,
  description: whiteLabelInstanceConfig.appDescription,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Restaurant OS",
  },
  icons: {
    apple: "/icons/icon-192.png",
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // ⚠️ NE PAS remettre `maximumScale: 1` / `userScalable: false`.
  // Bloquer le zoom au doigt échoue au critère WCAG 2.1 SC 1.4.4 (Resize Text,
  // niveau AA) et rend inaccessible toute la typographie dense de l'app — que ce
  // soit pour le personnel en salle sur tablette ou pour le client attablé qui
  // ouvre le menu depuis son téléphone. Le réflexe « on bloque le zoom pour que
  // ça fasse natif » coûte ici bien plus qu'il ne rapporte.
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0B0B0C" },
    { media: "(prefers-color-scheme: light)", color: "#0B0B0C" },
  ],
  interactiveWidget: "resizes-content",
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning className={`${outfit.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} font-sans`}>
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
      <body className="min-h-[100dvh] bg-surface-bg font-sans antialiased selection:bg-action-primary/20 text-text-primary transition-colors duration-500">
        <ServiceWorkerRegistration />
        <ErrorBoundary>
          <Suspense fallback={
            <div className="flex flex-col h-[100dvh] items-center justify-center bg-[#070709] text-white select-none">
              <div className="w-12 h-12 rounded-2xl bg-[#C5A059]/10 border border-[#C5A059]/30 flex items-center justify-center text-[#C5A059] mb-4 animate-pulse">
                <span className="font-serif font-black text-xl text-[#C5A059]">R</span>
              </div>
              <div className="w-36 h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="w-1/2 h-full bg-[#C5A059] rounded-full animate-pulse" />
              </div>
              <span className="text-nano uppercase tracking-[0.25em] text-white/40 font-mono mt-3">Nexus Node Sovereign</span>
            </div>
          }>
            <NexusProviderStack>
                <ThemeApplicator />
                <ImpersonationBanner />
                <OfflineSyncBanner />
                {children}
            </NexusProviderStack>
          </Suspense>
        </ErrorBoundary>
      </body>
    </html>
  );
}
