import { ZodSchema } from 'zod';
import { logger } from '@/lib/axiom';

type AnyRecord = Record<string, unknown>;

/**
 * 🏛️ FirestoreHydrator - Grade X
 * Assure la validation runtime et la transformation des données Firestore génériques.
 */
export class FirestoreHydrator {
  static hydrate<T>(data: AnyRecord, schema: ZodSchema<T>, collection: string): T | null {
    const result = schema.safeParse(data);
    if (result.success) return result.data;
    logger.error(`[FirestoreHydrator] Data corruption in ${collection}`, {
      errors: result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
    });
    return null;
  }

  static hydrateCollection<T>(
    docs: AnyRecord[],
    hydrator: (raw: AnyRecord) => T
  ): T[] {
    return docs.map(doc => {
      try {
        return hydrator(doc);
      } catch (e) {
        logger.warn(`[FirestoreHydrator] Skipping corrupted document: ${e instanceof Error ? e.message : 'Unknown error'}`);
        return null;
      }
    }).filter((r): r is T => r !== null);
  }
}
