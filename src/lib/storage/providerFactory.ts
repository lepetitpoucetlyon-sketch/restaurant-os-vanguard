import type { IStorageProvider } from './types';

export type StorageProviderName = 'firebase' | 's3' | 'local';

/**
 * Factory de provider de stockage. Seul 'firebase' est implémenté à ce jour
 * (§12 Lot G du plan `firestore.md` planifie S3StorageProvider/LocalFSStorageProvider).
 *
 * 'firebase' est le SEUL nom qui résout vers FirebaseStorageProvider — 's3' et 'local'
 * échouent explicitement tant qu'ils n'ont pas d'implémentation réelle. Les accepter
 * silencieusement en retournant Firebase serait exactement le mensonge que ce plan
 * cherche à éliminer : STORAGE_PROVIDER=s3 doit échouer bruyamment, pas router vers
 * Firebase sans prévenir.
 */
export async function createStorageProvider(): Promise<IStorageProvider> {
  const p = (process.env.STORAGE_PROVIDER ?? 'firebase').toLowerCase();
  if (p === 'firebase') {
    const { FirebaseStorageProvider } = await import('@/lib/storage/FirebaseStorageProvider');
    return new FirebaseStorageProvider();
  }
  if (p === 's3' || p === 'local') {
    throw new Error(
      `STORAGE_PROVIDER="${p}" n'est pas encore implémenté (cf. firestore.md §12 Lot G, S3StorageProvider). ` +
      `Seul "firebase" est disponible aujourd'hui.`
    );
  }
  throw new Error(`STORAGE_PROVIDER inconnu : "${p}". Valides : firebase (s3 | local : planifiés, non implémentés)`);
}
