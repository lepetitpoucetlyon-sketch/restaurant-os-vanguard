// This file configures Sentry on the client.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

// Sentry is loaded dynamically only in production — the top-level `import * as Sentry`
// used to pull ~2.9MB of Sentry chunks (browser, react, replay, browser-utils, conventions,
// core, nextjs) into the client bundle *even in dev*, because Next.js bundles this file
// wholesale.
const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (process.env.NODE_ENV === "production" && SENTRY_DSN) {
  import("@sentry/nextjs").then(Sentry => {
    Sentry.init({
      dsn: SENTRY_DSN,
      tracesSampleRate: 1,
      debug: false,
      replaysOnErrorSampleRate: 1.0,
      replaysSessionSampleRate: 0.1,
      integrations: [
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
    });
  }).catch(() => { /* Sentry init failed — silent, do not block app */ });
}
