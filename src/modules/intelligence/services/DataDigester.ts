import { z } from 'zod';
import { logger } from '@/lib/logger';
import { SovereignValue, SovereignData } from '@nexus/contracts/nexus-contract';

/**
 * DataDigester - Service de normalisation et validation (Zod-based)
 * Grade VI: Assure l'intégrité des données entrantes (Zelty, Hubrise, etc.)
 */

// Schema pour une commande externe
export const ExternalOrderSchema = z.object({
  id: z.string(),
  source: z.string(),
  customer: z.object({
    firstName: z.string(),
    lastName: z.string(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    tags: z.array(z.string()).optional(), // VIP, Allergy, etc.
  }),
  items: z.array(z.object({
    productId: z.string(),
    name: z.string(),
    quantity: z.number().positive(),
    price: z.number().nonnegative(), // Price in decimal (e.g. 12.50)
    size: z.string().optional(),     // "XL", "Bottle", etc.
    options: z.array(z.object({      // Complex modifiers
      id: z.string(),
      name: z.string(),
      price: z.number().optional(),  // Price addition
      groupName: z.string().optional(), // "Toppings", "Sauces"
    })).optional(),
    taxRate: z.number().optional(),  // Specific VAT for this item
  })),
  total: z.number().nonnegative(),
  taxTotal: z.number().optional(),
  currency: z.string().default('EUR'),
  status: z.enum(['PENDING', 'ACCEPTED', 'READY', 'DELIVERED', 'CANCELLED', 'PAID']),
  createdAt: z.string().datetime(),
  tenantId: z.string(),
  _metadata: z.object({
    isLegacy: z.boolean().optional(),
    ingestedAt: z.string().optional(),
    engine: z.string().optional()
  }).optional()
});

export type ExternalOrder = z.infer<typeof ExternalOrderSchema>;

export class DataDigester {
  /**
   * 🏗️ Decontaminate CSV/JSON Value
   * Cleans "Radioactive" strings (symbols, spaces, extra chars) and normalizes prices.
   */
  static decontaminate(val: SovereignValue): string {
    if (val === null || val === undefined) return '0';
    if (typeof val !== 'string') return String(val);
    return val.replace(/[€$£\s]/g, '').replace(',', '.').trim();
  }

  /**
   * ⚖️ PriceResolver (Grade VI)
   * Ensures fiscal precision (rounding to 2 decimals) and conversion to Cents if needed.
   * Mandat NF525: Toute manipulation de prix doit être scellée par cet arrondi.
   */
  static resolvePrice(val: SovereignValue): number {
    if (typeof val === 'number') return Math.round(val * 100) / 100;
    const cleaned = this.decontaminate(val);
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : Math.round(parsed * 100) / 100;
  }

  /**
   * 🏷️ Sanitize and Tag
   * Ingests raw data and adds metadata flags like LEGACY_DATA.
   */
  static async digestOrder(rawData: SovereignData, options: { isLegacy?: boolean } = {}): Promise<ExternalOrder | null> {
    try {
      // 🏛️ GRADE VI : DÉCONTAMINATION PROFONDE
      const sanitized = {
        ...rawData,
        total: this.resolvePrice(rawData.total as SovereignValue),
        items: Array.isArray(rawData.items) ? (rawData.items as SovereignData[]).map((item) => ({
          ...item,
          price: this.resolvePrice(item.price as SovereignValue),
          options: Array.isArray(item.options) ? (item.options as SovereignData[]).map((opt) => ({
            ...opt,
            price: opt.price ? this.resolvePrice(opt.price as SovereignValue) : undefined
          })) : []
        })) : []
      };

      logger.info('[DataDigester] Starting ingestion...', { source: (sanitized as import('@nexus/contracts/nexus-contract').SovereignData).source as string, isLegacy: !!options.isLegacy });
      
      if (options.isLegacy) {
        (sanitized as import('@nexus/contracts/nexus-contract').SovereignData)._metadata = { 
            isLegacy: true, 
            ingestedAt: new Date().toISOString(),
            engine: 'Slayer-2.0'
        };
      }

      const validatedOrder = ExternalOrderSchema.parse(sanitized);
      return validatedOrder;
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.error('[DataDigester] Validation failed', { 
            errors: error.issues.map(e => `${e.path.join('.')}: ${e.message}`) 
        });
      } else {
        logger.error('[DataDigester] Unexpected error during digestion', error);
      }
      return null;
    }
  }


  /**
   * 📦 BATCH CHUNKING (Grade VI)
   * Processed data in blocks (default 250) to optimize back-pressure and cloud limits.
   */
  static async digestBatch(
    rawArray: SovereignData[], 
    options: { isLegacy?: boolean, onProgress?: (processed: number) => void } = {}
  ): Promise<ExternalOrder[]> {
    const CHUNK_SIZE = 250;
    const results: ExternalOrder[] = [];
    
    for (let i = 0; i < rawArray.length; i += CHUNK_SIZE) {
      const chunk = rawArray.slice(i, i + CHUNK_SIZE);
      const chunkResults = await Promise.all(
        chunk.map(data => this.digestOrder(data, options))
      );
      
      const validResults = chunkResults.filter((r): r is ExternalOrder => r !== null);
      results.push(...validResults);
      
      if (options.onProgress) {
        options.onProgress(results.length);
      }
      
      // Industrial Breather: Allows GC and Event Loop to breath during massive runs
      if (rawArray.length > 2000) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
    
    return results;
  }
}
