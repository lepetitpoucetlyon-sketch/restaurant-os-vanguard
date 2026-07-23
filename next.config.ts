import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const workspaceRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // NOTE: pas de `output: 'export'` — le produit exige un serveur Node
  // (routes API : signup, webhook Stripe, export FEC, middleware d'auth).
  //
  // Le MCC (APP_MODE=mcc) est un déploiement SÉPARÉ. En local il tourne en même
  // temps que l'app tenant : on lui donne son propre distDir pour que les deux
  // serveurs Turbopack ne partagent pas `.next` (sinon manifeste de routes corrompu
  // → 404 fantômes sur /admin/*). App tenant → `.next`, console MCC → `.next-mcc`.
  distDir: process.env.NEXT_PUBLIC_APP_MODE === 'mcc' ? '.next-mcc' : '.next',
  turbopack: {
    root: workspaceRoot,
  },
  images: {
    // Production-grade image optimization — AVIF → WebP → JPEG fallback.
    // `unoptimized: true` was previously used to avoid build issues but
    // it disables all Next.js image processing (LCP penalty on menu photos).
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
  reactStrictMode: false,
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  devIndicators: {
    // @ts-expect-error - Hiding the dev indicator
    buildActivity: false,
    // @ts-expect-error - appIsrStatus not in NextConfig types
    appIsrStatus: false,
  },
  onDemandEntries: {
    maxInactiveAge: 10 * 1000, // Encore plus agressif (10s)
    pagesBufferLength: 1,      // 1 seule page
  },
  typescript: {
    ignoreBuildErrors: false,
  }
};

export default nextConfig;
