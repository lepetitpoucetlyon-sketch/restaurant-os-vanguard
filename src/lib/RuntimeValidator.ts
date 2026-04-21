import { logger } from './logger';
import { Cents, Quantity, Rate } from './brands';

/**
 * 🔍 RuntimeValidator - Restaurant OS (Singularity 5.4)
 * Formal Verification Layer to ensure data integrity at the edge.
 */
export const RuntimeValidator = {

  /**
   * Asserts that the data matches the expected Branded Schema.
   * If failure: Quarantine and return null (Safe-Fail).
   */
  validate<T>(data: unknown, schema: 'Cents' | 'Quantity' | 'Rate'): T | null {
    try {
      switch (schema) {
        case 'Cents': 
          if (typeof data !== 'number' || !Number.isInteger(data)) throw new Error('Invalid Cents');
          return data as unknown as T;
        case 'Quantity':
          if (typeof data !== 'number') throw new Error('Invalid Quantity');
          return data as unknown as T;
        case 'Rate':
          if (typeof data !== 'number' || data < 0 || data > 1) throw new Error('Invalid Rate');
          return data as unknown as T;
        default:
          return data as T;
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      logger.error(`[RuntimeValidator] QUARANTINE: ${message}`, { data });
      // In production, this would trigger an audit log to the MasterBridge
      return null;
    }
  },

  /**
   * Batch validation for whole entities
   */
  validateOrder(orderData: Record<string, unknown>) {
    const items = Array.isArray(orderData.items) ? orderData.items : [];
    return {
      ...orderData,
      totalInCents: this.validate<Cents>(orderData.totalInCents, 'Cents'),
      items: items.map((item: Record<string, unknown>) => ({
        ...item,
        priceInCents: this.validate<Cents>(item.priceInCents, 'Cents'),
        quantity: this.validate<Quantity>(item.quantity, 'Quantity')
      }))
    };
  }
};
