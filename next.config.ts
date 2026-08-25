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
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "google-fonts",
          expiration: { maxEntries: 20, maxAgeSeconds: 365 * 24 * 60 * 60 },
        },
      },
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "static-image-assets",
          expiration: { maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 },
        },
      },
      {
        urlPattern: /\/api\/(?:menu|products|categories)/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "api-menu-cache",
          expiration: { maxEntries: 32, maxAgeSeconds: 24 * 60 * 60 },
        },
      },
      {
        urlPattern: /\/api\/.*/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "api-dynamic-cache",
          networkTimeoutSeconds: 10,
          expiration: { maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 },
        },
      },
    ],
  },
});

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
  // Optimisation d'imports (levier officiel Next, zéro changement de composant) :
  // réécrit les imports barrel de ces libs lourdes en imports directs → meilleur tree-shaking.
  // framer-motion (357 usages) n'est PAS dans la liste par défaut de Next → ajouté ici.
  experimental: {
    optimizePackageImports: ['framer-motion'],
  },
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
  // NOTE: `onDemandEntries` a été retiré — c'est une option **Webpack** que
  // Turbopack ignore silencieusement. Elle laissait croire à un garde-fou
  // mémoire en dev alors qu'elle n'avait aucun effet (le dev tourne en
  // `next dev --turbo`). Le vrai levier est `--max-old-space-size` dans le
  // script `dev` de package.json, et il ne borne que le tas V8 : Turbopack
  // (Rust) alloue hors de ce tas.
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

export default withPWA(nextConfig);

