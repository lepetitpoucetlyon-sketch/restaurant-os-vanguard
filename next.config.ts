import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const workspaceRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // NOTE: pas de `output: 'export'` — le produit exige un serveur Node
  // (routes API : signup, webhook Stripe, export FEC, middleware d'auth).
  turbopack: {
    root: workspaceRoot,
  },
  images: {
    unoptimized: true,
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
