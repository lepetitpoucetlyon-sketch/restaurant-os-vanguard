import { Nexus } from './nexus/NexusAdapter';
import { INexusBatch } from './nexus/NexusAdapter';
import { z } from 'zod';
import { ZodInterceptor } from '@domain/services/ZodInterceptor';
import { logger } from '@/lib/logger';

/**
 * 🛡️ NexusTransaction - Higher-Order Transaction Wrapper
 * The "Great Wall" of Restaurant OS operations.
 * Enforces mandatory data validation before any bit touches the database.
 */
export class NexusTransaction {
  /**
   * Runs a Firestore transaction with mandatory schema validation.
   * 
   * @param schemas Map of validation contexts to their respective Zod schemas and data.
   * @param fn The transaction callback.
   */
  static async run<T extends Record<string, { schema: z.ZodSchema<import('@/shared/nexus-contract').SovereignValue>, data: import('@/shared/nexus-contract').SovereignData }>, R>(

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
