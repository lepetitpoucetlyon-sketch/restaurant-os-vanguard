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
  const intervalMs = options?.intervalMs ?? 2000;
  let lastSeen: string | null = null;
  let stopped = false;

  const poll = async () => {
    if (stopped) return;
    try {
      const data = await fetcher();
      const serialized = JSON.stringify(data);
      if (serialized !== lastSeen) {
        lastSeen = serialized;
        callback(data);
      }
    } catch (err) {
      options?.onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  };

  // Premier appel immédiat pour peupler le state sans attendre le 1er intervalle
  void poll();
  const timer = setInterval(poll, intervalMs);

  return () => {
    stopped = true;
    clearInterval(timer);
  };
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
  const intervalMs = options?.intervalMs ?? 2000;
  let lastSeen: string | null = null;
  let stopped = false;

  const poll = async () => {
    if (stopped) return;
    try {
      const data = await fetcher();
      const serialized = JSON.stringify(data);
      if (serialized !== lastSeen) {
        lastSeen = serialized;
        callback(data);
      }
    } catch (err) {
      options?.onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  };

  void poll();
  const timer = setInterval(poll, intervalMs);

  return () => {
    stopped = true;
    clearInterval(timer);
  };
}
