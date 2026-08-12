import { z } from 'zod';
import { logger } from '@/lib/logger';
import { SovereignValue, SovereignData } from '@nexus/contracts/nexus-contract';

/**
 * 🛡️ ZodInterceptor - The "Great Wall" of Restaurant OS
 * Intercepts data before persistence to ensure it matches the industrial domain schemas.
 * Throws early and loudly to prevent database corruption.
 */
export class ZodInterceptor {
  
  /**
   * Validates data against a schema.
   * If validation fails, logs a forensic error and throws.
   */
  static validate<T>(schema: z.ZodSchema<T>, data: SovereignValue | SovereignData | (SovereignValue | SovereignData)[], context: string): T {
    const result = schema.safeParse(data);
    
    if (!result.success) {
      const errors = result.error.format();
      logger.error(`[ZodInterceptor] SCHEMA VIOLATION in ${context}`, { errors, data: data as SovereignValue });
      
      // Industrial Alert: In production, this would trigger a Sentry/Datadog event.
      throw new Error(`[Nexus-Titan] Data Integrity Violation in ${context}. Please check the logs.`);
    }
    
    return result.data;
  }
}
