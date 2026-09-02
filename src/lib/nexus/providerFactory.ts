import type { INexusAdapter } from './types';

export type DbProviderName = 'firestore' | 'memory' | 'mock';

/** Adapter CLIENT (navigateur). Appelé par bootstrapDefaultProviders(). */
export async function createClientAdapter(): Promise<INexusAdapter> {
  const p = (process.env.NEXT_PUBLIC_DB_PROVIDER ?? process.env.DB_PROVIDER ?? 'firestore').toLowerCase();
  if (p === 'firestore') {
    const { FirestoreAdapter } = await import('@/lib/adapters/FirestoreAdapter');
    return new FirestoreAdapter();
  }
  if (p === 'memory' || p === 'sqlite') {
    const { SqliteMemoryAdapter } = await import('@/lib/adapters/SqliteMemoryAdapter');
    return new SqliteMemoryAdapter();
  }
  if (p === 'mock') {
    const { MockAdapter } = await import('@/lib/adapters/MockAdapter');
    return new MockAdapter();
  }
  throw new Error(`NEXT_PUBLIC_DB_PROVIDER inconnu : "${p}". Valides : firestore | memory | mock`);
}

/** Adapter SERVEUR (Node). Appelé par ensureServerNexus(). */
export async function createServerAdapter(): Promise<INexusAdapter | null> {
  const p = (process.env.DB_PROVIDER ?? 'firestore').toLowerCase();
  if (p === 'firestore') {
    if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      return null;
    }
    const adapterPath = '@/lib/adapters/FirestoreServerAdapter';
    const { FirestoreServerAdapter } = await import(/* webpackIgnore: true */ adapterPath);
    return new FirestoreServerAdapter();
  }
  if (p === 'memory' || p === 'sqlite') {
    const { SqliteMemoryAdapter } = await import('@/lib/adapters/SqliteMemoryAdapter');
    return new SqliteMemoryAdapter();
  }
  if (p === 'mock') {
    const { MockAdapter } = await import('@/lib/adapters/MockAdapter');
    return new MockAdapter();
  }
  throw new Error(`DB_PROVIDER inconnu : "${p}". Valides : firestore | memory | mock`);
}
