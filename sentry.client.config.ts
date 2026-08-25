// This file configures Sentry on the client.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

// Sentry is loaded dynamically only in production — the top-level `import * as Sentry`
// used to pull ~2.9MB of Sentry chunks (browser, react, replay, browser-utils, conventions,
// core, nextjs) into the client bundle *even in dev*, because Next.js bundles this file
// wholesale.
const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

/**
 * Échantillonnage — réglable par instance sans toucher au code.
 *
 * ⚠️ Ces valeurs étaient à 1.0 (100 %) sur les traces ET sur le Session Replay
 * déclenché par erreur. Sur une tablette POS c'est intenable : le Replay sérialise
 * le DOM et ses mutations, et Sentry capture par défaut les `unhandledrejection`.
 * Une seule boucle d'erreur applicative (cf. le bug de polling SimulacraAdapter,
 * ~500 rejets/minute) suffisait alors à saturer CPU, réseau, batterie et quota.
 *
 * Le POS tourne 8 à 12 h sans rechargement : on échantillonne, et on plafonne
 * les erreurs répétées via `beforeSend` ci-dessous.
 */
const num = (v: string | undefined, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 && n <= 1 ? n : fallback;
};

const TRACES_RATE          = num(process.env.NEXT_PUBLIC_SENTRY_TRACES_RATE, 0.1);
const REPLAY_SESSION_RATE  = num(process.env.NEXT_PUBLIC_SENTRY_REPLAY_SESSION_RATE, 0);
const REPLAY_ON_ERROR_RATE = num(process.env.NEXT_PUBLIC_SENTRY_REPLAY_ERROR_RATE, 0.1);

/** Au-delà de N occurrences d'une même signature d'erreur, on cesse d'émettre. */
const MAX_EVENTS_PER_SIGNATURE = 5;
/** Fenêtre glissante après laquelle les compteurs repartent à zéro. */
const SIGNATURE_WINDOW_MS = 5 * 60 * 1000;

if (process.env.NODE_ENV === "production" && SENTRY_DSN) {
  import("@sentry/nextjs").then(Sentry => {
    const seen = new Map<string, { count: number; firstSeen: number }>();

    Sentry.init({
      dsn: SENTRY_DSN,
      tracesSampleRate: TRACES_RATE,
      debug: false,
      replaysOnErrorSampleRate: REPLAY_ON_ERROR_RATE,
      replaysSessionSampleRate: REPLAY_SESSION_RATE,
      integrations: [
        Sentry.replayIntegration({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],

      /**
       * Disjoncteur anti-boucle. Une erreur qui se répète des milliers de fois
       * n'apporte aucune information après les premières occurrences — elle ne
       * fait que coûter du réseau et de la batterie sur la tablette, et brûler
       * le quota Sentry. On laisse passer les premières, puis on coupe.
       */
      beforeSend(event) {
        const ex = event.exception?.values?.[0];
        const signature = `${ex?.type ?? event.message ?? 'unknown'}::${ex?.value ?? ''}`.slice(0, 200);

        const now = Date.now();
        const entry = seen.get(signature);

        if (!entry || now - entry.firstSeen > SIGNATURE_WINDOW_MS) {
          seen.set(signature, { count: 1, firstSeen: now });
          return event;
        }

        entry.count += 1;
        if (entry.count > MAX_EVENTS_PER_SIGNATURE) return null; // étouffé

        // Dernière occurrence émise : on annote pour que le volume réel soit visible.
        if (entry.count === MAX_EVENTS_PER_SIGNATURE) {
          event.tags = { ...event.tags, throttled: 'true' };
          event.extra = {
            ...event.extra,
            throttleNote: `Occurrences suivantes de cette signature étouffées pendant ${SIGNATURE_WINDOW_MS / 60000} min.`,
          };
        }
        return event;
      },
    });
  }).catch(() => { /* Sentry init failed — silent, do not block app */ });
}
