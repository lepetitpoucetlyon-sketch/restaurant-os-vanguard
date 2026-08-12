import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusTransaction } from '@/lib/adapters/NexusTransaction';
import { z } from 'zod';
import { logger } from '@/lib/logger';

/** 📜 QuoteSchema - Industrial Validation */
export const QuoteSchema = z.object({
  customerId: z.string().min(1),
  customerName: z.string().min(1),
  items: z.array(z.object({
    id: z.string(),
    name: z.string(),
    quantity: z.number().positive(),
    price: z.number().nonnegative(),
  })).min(1),
  total: z.number().nonnegative(),
  status: z.enum(['draft', 'pending', 'accepted', 'rejected', 'expired']).default('draft'),
  validTo: z.string(),
  notes: z.string().optional(),
});

export type Quote = z.infer<typeof QuoteSchema> & { id: string; createdAt: string };

export class QuoteEngine {
  private static COLLECTION = 'quotes';

  /**
   * Generates a new industrial quote with atomic database persistence.
   */
  static async createQuote(rawData: Partial<Quote>) {
    logger.info(`[QuoteEngine] Generating new quote for ${rawData.customerName}`);

    return await NexusTransaction.run(
      { QUOTE_GENERATION: { schema: QuoteSchema as unknown as import("zod").ZodSchema<import("@nexus/contracts/nexus-contract").SovereignValue>, data: rawData } },
      async (transaction) => {
        const tenantPath = Nexus.getTenantPath(this.COLLECTION);
        const quoteId = Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 12);
        const quotePath = `${tenantPath}/${quoteId}`;

        const finalQuote = {
          ...rawData,
          id: quoteId,
          createdAt: new Date().toISOString(),
          status: 'pending',
          version: 1
        };

        transaction.set(quotePath, finalQuote);
        
        logger.info(`[QuoteEngine] Quote ${quoteId} committed to Cloud.`);
        return { id: quoteId };
      }
    );
  }
}
