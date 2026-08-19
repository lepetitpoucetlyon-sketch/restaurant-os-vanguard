import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const workspaceRoot = path.dirname(fileURLToPath(import.meta.url));

/**
 * Bundle analyzer activable à la demande — `ANALYZE=true npm run build`.
 * Ouvre un rapport HTML avec la répartition des chunks.
 * Gate 9 preflight lira `.next/static/chunks` pour ratchet bundle size (voir γ-7).
 *
 * Requiert `@next/bundle-analyzer` en devDep — installer via `npm i -D @next/bundle-analyzer`
 * puis passer ANALYZE=true à npm run build.
 */
const withBundleAnalyzer =
  process.env.ANALYZE === "true"
    ? // Dynamic require silencieux : si la dep n'est pas installée, on skip proprement.
      (() => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          return require("@next/bundle-analyzer")({ enabled: true }) as (
            c: NextConfig,
          ) => NextConfig;
        } catch {
          console.warn(
            "[next.config] ANALYZE=true mais @next/bundle-analyzer non installé. Installer via `npm i -D @next/bundle-analyzer`.",
          );
          return (config: NextConfig) => config;
        }
      })()
    : (config: NextConfig) => config;

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
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    remotePatterns: [
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: '*.googleusercontent.com' },
      { protocol: 'https', hostname: 'www.gravatar.com' },
      { protocol: 'https', hostname: 'secure.gravatar.com' },
    ],
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
  },
  serverExternalPackages: ['playwright', 'playwright-core', 'mqtt'],

  // ── HTTP Security Headers (production-grade) ────────────────────────────────
  // X-Frame-Options, HSTS, CSP, XSS protection — standard SaaS.
  // CSP en mode report-only au départ puis basculer en enforce.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options',    value: 'nosniff' },
          { key: 'X-Frame-Options',            value: 'DENY' },
          { key: 'X-XSS-Protection',           value: '1; mode=block' },
          { key: 'Referrer-Policy',            value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',         value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            // CSP permissif pour Next.js + Firebase + Stripe — à durcir progressivement.
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://apis.google.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://firebasestorage.googleapis.com https://*.googleusercontent.com",
              "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com wss://*.firebaseio.com https://api.stripe.com https://js.stripe.com",
              "frame-src https://js.stripe.com https://hooks.stripe.com",
              "worker-src 'self' blob:",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
