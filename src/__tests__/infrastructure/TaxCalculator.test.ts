import { describe, it, expect } from 'vitest';
import { TaxCalculator } from '@/infrastructure/services/finance/TaxCalculator';
import type { CartItem } from '@/modules/ops/engine/types';

function cartItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    productId: 'prod_1',
    name: 'Test Item',
    quantity: 1,
    unitPriceInMicrounits: 120000000, // 12.00€ TTC
    taxRate: '0.10',
    discountInMicrounits: 0 as any,
    ...overrides,
  } as CartItem;
}

describe('TaxCalculator', () => {
  describe('computeTvaBreakdown', () => {
    it('calculates TVA at 10% for a single item', () => {
      const items = [cartItem()];
      const breakdown = TaxCalculator.computeTvaBreakdown(items);
      // TVA = TTC × r/(1+r) = 120_000_000 × 0.10/1.10 = 10_909_091
      expect(breakdown['0.10']).toBe(10909091);
    });

    it('handles multiple tax rates', () => {
      const items = [
        cartItem({ taxRate: '0.055', unitPriceInMicrounits: 100000000 as any }),
        cartItem({ taxRate: '0.20', unitPriceInMicrounits: 200000000 as any }),
      ];
      const breakdown = TaxCalculator.computeTvaBreakdown(items);
      expect(breakdown['0.055']).toBeDefined();
      expect(breakdown['0.20']).toBeDefined();
      expect(Object.keys(breakdown)).toHaveLength(2);
    });

    it('defaults to 10% when taxRate is missing', () => {
      const items = [cartItem({ taxRate: undefined })];
      const breakdown = TaxCalculator.computeTvaBreakdown(items);
      expect(breakdown['0.10']).toBeDefined();
    });

    it('subtracts discounts from TVA base', () => {
      const withDiscount = [cartItem({ discountInMicrounits: 10000000 as any })];
      const withoutDiscount = [cartItem({ discountInMicrounits: 0 as any })];
      const tvaWith = TaxCalculator.computeTvaBreakdown(withDiscount)['0.10']!;
      const tvaWithout = TaxCalculator.computeTvaBreakdown(withoutDiscount)['0.10']!;
      expect(tvaWith).toBeLessThan(tvaWithout);
    });

    it('returns empty breakdown for empty cart', () => {
      expect(TaxCalculator.computeTvaBreakdown([])).toEqual({});
    });

    it('handles quantity > 1', () => {
      const items = [cartItem({ quantity: 3 })];
      const breakdown = TaxCalculator.computeTvaBreakdown(items);
      // 3 × 12.00€ TTC = 360_000_000 → TVA = 360_000_000 × 0.10/1.10
      expect(breakdown['0.10']).toBe(Math.round(360000000 * 0.10 / 1.10));
    });
  });

  describe('calculateTotals', () => {
    it('returns correct TTC, TVA, and HT', () => {
      const items = [cartItem()];
      const totals = TaxCalculator.calculateTotals(items);
      expect(totals.totalTTCInMicrounits).toBe(120000000);
      expect(totals.totalTVAInMicrounits).toBe(10909091);
      expect(totals.totalHTInMicrounits).toBe(120000000 - 10909091);
    });

    it('HT + TVA = TTC (accounting identity)', () => {
      const items = [
        cartItem({ unitPriceInMicrounits: 150000000 as any, taxRate: '0.20' }),
        cartItem({ unitPriceInMicrounits: 80000000 as any, taxRate: '0.055' }),
      ];
      const totals = TaxCalculator.calculateTotals(items);
      expect(totals.totalHTInMicrounits + totals.totalTVAInMicrounits).toBe(totals.totalTTCInMicrounits);
    });

    it('applies discounts to TTC', () => {
      const items = [cartItem({ discountInMicrounits: 20000000 as any })];
      const totals = TaxCalculator.calculateTotals(items);
      expect(totals.totalTTCInMicrounits).toBe(100000000); // 12€ - 2€ = 10€
    });

    it('returns zeros for empty cart', () => {
      const totals = TaxCalculator.calculateTotals([]);
      expect(totals.totalTTCInMicrounits).toBe(0);
      expect(totals.totalTVAInMicrounits).toBe(0);
      expect(totals.totalHTInMicrounits).toBe(0);
    });
  });
});
