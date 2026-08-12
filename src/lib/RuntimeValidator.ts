import { logger } from '@/lib/logger';
import { Cents, Quantity } from '@/lib/branding/brands';
import { toError } from "@/lib/toError";

/**
 * 🔍 RuntimeValidator - Restaurant OS (Singularity 5.4)
 * Formal Verification Layer to ensure data integrity at the edge.
 */
export const RuntimeValidator = {

  /**
   * Asserts that the data matches the expected Branded Schema.
   * If failure: Quarantine and return null (Safe-Fail).
   */
  validate<T>(data: import('@nexus/contracts/nexus-contract').SovereignValue, schema: 'Cents' | 'Quantity' | 'Rate'): T | null {

    try {
      switch (schema) {
        case 'Cents': 
          if (typeof data !== 'number' || !Number.isInteger(data)) throw new Error('Invalid Cents');
          return data as T;
        case 'Quantity':
          if (typeof data !== 'number') throw new Error('Invalid Quantity');
          return data as T;
        case 'Rate':
          if (typeof data !== 'number' || data < 0 || data > 1) throw new Error('Invalid Rate');
          return data as T;

        default:
          return data as T;
      }
    } catch (e) {
      const message = toError(e).message;

      logger.error(`[RuntimeValidator] QUARANTINE: ${message}`, { data });
      // In production, this would trigger an audit log to the MasterBridge
      return null;
    }
  },

  /**
   * Batch validation for whole entities
   */
  validateOrder(orderData: import('@nexus/contracts/nexus-contract').SovereignData) {

    const items = Array.isArray(orderData.items) ? orderData.items : [];
    // Microunits Protocol: totalInMicrounits is canonical (passed through via spread). Only the
    // deprecated cents mirror is brand-validated, and only when a legacy order actually carries it.
    return {
      ...orderData,
      ...(orderData.totalInCents !== undefined
        ? { totalInCents: RuntimeValidator.validate<Cents>(orderData.totalInCents as import('@nexus/contracts/nexus-contract').SovereignValue, 'Cents') }
        : {}),
      items: items.map((item: import('@nexus/contracts/nexus-contract').SovereignData) => ({

        ...item,
        priceInCents: RuntimeValidator.validate<Cents>(item.priceInCents as import('@nexus/contracts/nexus-contract').SovereignValue, 'Cents'),
        quantity: RuntimeValidator.validate<Quantity>(item.quantity as import('@nexus/contracts/nexus-contract').SovereignValue, 'Quantity')
      }))
    };
  }
};
