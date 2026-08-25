/**
 * PollingSnapshotMixin — Fallback onSnapshot par polling SSE/interval.
 *
 * À utiliser dans TOUT adapter qui ne supporte pas le real-time natif
 * (Postgres, Neon, PlanetScale, etc.).
 *
 * onSnapshot est OBLIGATOIRE dans l'interface INexusAdapter car le POS (ops.sync.ts)
 * et le KDS (orders stream) en dépendent massivement. Sans implémentation correcte,
 * ces modules échouent silencieusement.
 *
 * Usage dans un adapter Postgres :
 * ```ts
 * import { pollingSnapshot } from '@/lib/nexus/adapters/PollingSnapshotMixin';
 *
 * class PostgresAdapter implements INexusAdapter {
 *   onSnapshot<T>(path, callback, options) {
 *     return pollingSnapshot(() => this.get<T>(path), callback, options);
 *   }
 * }
 * ```
 *
 * Pour les collections (query), utiliser `pollingQuerySnapshot` :
 * ```ts
 * onSnapshot<T>(path, callback, options) {
 *   const isCollection = !path.includes('/') || path.split('/').length % 2 === 1;
 *   if (isCollection) {
 *     return pollingQuerySnapshot(() => this.query<T>(path, options), callback, options);
 *   }
 *   return pollingSnapshot(() => this.get<T>(path), callback, options);
 * }
 * ```
 */

export interface PollingOptions {
  /** Intervalle en ms entre deux polls. Défaut : 2000ms (acceptable pour POS/KDS) */
  intervalMs?: number;
  onError?: (error: Error) => void;
}

/** Plafond du backoff : au-delà, on retente à cadence fixe (le POS doit se rétablir seul). */
const MAX_BACKOFF_MS = 60_000;
/** Nombre d'erreurs consécutives signalées à l'appelant avant de museler `onError`. */
const MAX_REPORTED_ERRORS = 3;

/**
 * Noyau partagé du polling — utilisé par `pollingSnapshot` et `pollingQuerySnapshot`.
 *
 * Boucle auto-planifiée (`setTimeout` récursif) et non `setInterval` : avec un
 * `setInterval` + fetcher asynchrone, un poll lent est relancé avant d'avoir fini,
 * les requêtes se chevauchent et s'empilent. Ici le tick suivant n'est armé
 * qu'une fois le précédent terminé.
 *
 * Backoff exponentiel en cas d'échec — indispensable sur tablette POS : une panne
 * durable (règles Firestore, session expirée, réseau coupé) faisait auparavant
 * repartir le poll toutes les 2 s indéfiniment, soit ~30 requêtes/minute et par
 * collection, pendant les 8 à 12 h d'un service. On ne renonce jamais totalement
 * (le POS doit se rétablir seul dès que l'accès revient), mais on plafonne à
 * MAX_BACKOFF_MS et on cesse de spammer `onError`.
 *
 * @internal
 */
function createPoller<T>(
  fetcher: () => Promise<T>,
  callback: (data: T) => void,
  options?: PollingOptions,
): () => void {
  const intervalMs = options?.intervalMs ?? 2000;
  let lastSeen: string | null = null;
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let consecutiveErrors = 0;

  const nextDelay = () =>
    consecutiveErrors === 0
      ? intervalMs
      : Math.min(intervalMs * 2 ** consecutiveErrors, MAX_BACKOFF_MS);

  const schedule = () => {
    if (stopped) return;
    timer = setTimeout(poll, nextDelay());
  };

  const poll = async () => {
    if (stopped) return;
    try {
      const data = await fetcher();
      consecutiveErrors = 0; // rétabli : on repasse à la cadence nominale
      const serialized = JSON.stringify(data);
      if (serialized !== lastSeen) {
        lastSeen = serialized;
        callback(data);
      }
    } catch (err) {
      consecutiveErrors += 1;
      // On ne remonte que les premières occurrences : au-delà, l'information est
      // acquise et chaque appel supplémentaire ne fait que polluer la console et,
      // en production, brûler du quota de reporting.
      if (consecutiveErrors <= MAX_REPORTED_ERRORS) {
        options?.onError?.(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      schedule();
    }
  };

  // Premier appel immédiat pour peupler le state sans attendre le 1er intervalle
  void poll();

  return () => {
    stopped = true;
    if (timer !== null) clearTimeout(timer);
  };
}

/**
 * Poll un document unique et appelle `callback` à chaque changement détecté.
 * Détection par JSON.stringify — suffisant pour des documents < 50 Ko.
 *
 * @returns Fonction de désinscription (stoppe le polling).
 */
export function pollingSnapshot<T>(
  fetcher: () => Promise<T | null>,
  callback: (data: T | null) => void,
  options?: PollingOptions,
): () => void {
  return createPoller(fetcher, callback, options);
}

/**
 * Poll une collection et appelle `callback` à chaque changement détecté.
 * Même logique que `pollingSnapshot` mais pour des tableaux.
 */
export function pollingQuerySnapshot<T>(
  fetcher: () => Promise<T[]>,
  callback: (data: T[]) => void,
  options?: PollingOptions,
): () => void {
  return createPoller(fetcher, callback, options);
}
