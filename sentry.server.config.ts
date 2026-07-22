// This file configures Sentry on the server.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (process.env.NODE_ENV === "production" && SENTRY_DSN) {
  import("@sentry/nextjs").then(Sentry => {
    Sentry.init({
      dsn: SENTRY_DSN,
      tracesSampleRate: 1,
      debug: false,
    });
  }).catch(() => { /* silent */ });
}
