export type StorageQueryOperator =
  | '==' | '!=' | '<' | '<=' | '>' | '>='
  | 'array-contains' | 'array-contains-unknown' | 'contains'
  | 'in' | 'not-in';

/**
 * NexusTimestamp — type canonique opaque pour les timestamps serveur.
 *
 * Traiter comme une boîte noire en écriture : stocker dans Nexus.adapter.set(),
 * ne jamais caster, comparer ou lire directement.
 *
 * Chaque adapter retourne sa représentation native :
 * - Firestore client : FieldValue.serverTimestamp() — résolu côté serveur à l'écriture
 * - Firestore Admin  : FieldValue.serverTimestamp() (firebase-admin)
 * - SQLite / Mock    : ISO string ou Date
 * - Futur Postgres   : 'NOW()' SQL literal ou Date JS
 *
 * Pour lire un timestamp stocké, utiliser `toNexusDate(value)`.
 */
export type NexusTimestamp =
  | Date
  | string
  | number
  | { seconds: number; nanoseconds: number }         // Firestore Timestamp (lecture)
  | { readonly _methodName: string };                 // Firestore FieldValue (écriture seule)

/**
 * Convertit un NexusTimestamp en Date JS exploitable.
 * À utiliser dans les composants/hooks qui ont besoin d'afficher ou comparer des dates.
 */
export function toNexusDate(ts: NexusTimestamp): Date {
  if (ts instanceof Date) return ts;
  if (typeof ts === 'string') return new Date(ts);
  if (typeof ts === 'number') return new Date(ts);
  // Narrowing explicite via unknown pour les variants objet
  const obj = ts as unknown as Record<string, unknown>;
  if (typeof obj['toDate'] === 'function') return (obj['toDate'] as () => Date)();
  if (typeof obj['seconds'] === 'number') {
    return new Date(obj['seconds'] * 1000 + ((obj['nanoseconds'] as number) ?? 0) / 1_000_000);
  }
  // FieldValue write-only sentinel — ne devrait jamais être lu
  return new Date();
}

export interface QueryFilter {
  field: string;
  operator: StorageQueryOperator;
  value: unknown;
}

export interface IQueryOptions {
  orderBy?: { field: string; direction: 'asc' | 'desc' };
  limit?: number;
  where?: QueryFilter[];
  startAfter?: unknown;
  endBefore?: unknown;
  cursorAfter?: string;
  cursorBefore?: string;
}

export interface IBatchProcessor {
  set<T>(path: string, data: T): void;
  update<T>(path: string, data: Partial<T>): void;
  increment(path: string, field: string, amount: number): void;
  delete(path: string): void;
  commit(): Promise<void>;
}

export interface IDocumentStore {
  get<T>(path: string): Promise<T | null>;
  set<T>(path: string, data: T, options?: { merge?: boolean }): Promise<void>;
  update<T>(path: string, data: Partial<T>): Promise<void>;
  increment(path: string, field: string, amount: number): Promise<void>;
  create<T>(path: string, data: T): Promise<void>;
  delete(path: string): Promise<void>;
  generateId(collectionPath: string): string;
  serverTimestamp(): NexusTimestamp;
}

export interface IQueryEngine {
  query<T>(collectionPath: string, options?: IQueryOptions): Promise<T[]>;
}

export interface IRealtimeSubscriber {
  /**
   * Souscrit aux changements d'un document ou d'une collection.
   *
   * @required OBLIGATOIRE dans tout adapter client — le POS (ops.sync.ts) et le KDS
   * en dépendent. Sans implémentation, ces modules échouent silencieusement.
   *
   * Pour les adapters sans real-time natif (Postgres, Neon, PlanetScale) :
   * utiliser `pollingSnapshot` / `pollingQuerySnapshot` depuis
   * `@/lib/nexus/adapters/PollingSnapshotMixin`.
   *
   * @returns Fonction de désinscription — DOIT être appelée au unmount/cleanup.
   */
  onSnapshot<T>(
    path: string,
    callback: (data: T) => void,
    options?: IQueryOptions & { onError?: (error: Error) => void }
  ): () => void;
}
