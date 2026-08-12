import { Nexus } from '@/lib/nexus/NexusAdapter';
import { INexusBatch } from '@/lib/nexus/NexusAdapter';
import { z } from 'zod';
import { ZodInterceptor } from '@/lib/ZodInterceptor';
import { logger } from '@/lib/logger';

/**
 * 🛡️ NexusTransaction - Zod-Validated Batch Wrapper
 *
 * Despite the name, this is NOT a Firestore transaction (no read-before-write,
 * no optimistic locking, no auto-retry on conflict).
 * It is a Zod validation gate + batch commit.
 * For ACID read-modify-write semantics use Nexus.adapter.runTransaction().
 */
export class NexusTransaction {
  /**
   * Validates all schemas then runs fn inside a Nexus batch.
   * All writes are committed atomically via batch — no individual-op rollback.
   *
   * @param schemas Map of validation contexts to their respective Zod schemas and data.
   * @param fn The batch callback.
   */
  static async run<T extends Record<string, { schema: z.ZodSchema<import('@nexus/contracts/nexus-contract').SovereignValue>, data: import('@nexus/contracts/nexus-contract').SovereignData }>, R>(

    schemas: T,
    fn: (transaction: INexusBatch) => Promise<R>
  ): Promise<R> {

    // 1. SYSTEMIC VALIDATION GATE
    // We validate EVERYTHING before we even start the transaction to save Cloud cycles
    // and provide immediate feedback for malformed data.
    for (const [context, { schema, data }] of Object.entries(schemas)) {
      ZodInterceptor.validate(schema, data, `NexusTransaction::${context}`);
    }

    try {
      // 2. BATCH EXECUTION (Cloud Agnostic)
      const batch = Nexus.adapter.batch();
      const result = await fn(batch);
      await batch.commit();
      
      logger.info('[NexusTransaction] Operation completed successfully and validated.');
      return result;
    } catch (error) {
      logger.error('[NexusTransaction] Critical Failure in Transaction', { error });
      // We re-throw because the UI or calling engine needs to handle the fallback.
      throw error;
    }
  }
}
