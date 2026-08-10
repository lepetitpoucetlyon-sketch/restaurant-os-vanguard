import fc from 'fast-check';
import { describe, it } from 'vitest';
import { TaxCalculator } from '@/modules/finance/fiscalite/TaxCalculator';

const arbTaxRate = fc.constantFrom("0.055" as const, "0.10" as const, "0.20" as const);

const arbCartItem = fc.record({
  unitPriceInMicrounits: fc.integer({ min: 1, max: 10_000_000 }), // max 10 euros per item
  quantity: fc.integer({ min: 1, max: 5 }),
  taxRate: arbTaxRate,
});

describe('Invariant: TVA', () => {
  it('Σ TVA ventilée = TVA totale', () => {
    fc.assert(
      fc.property(
        fc.array(arbCartItem, { minLength: 1, maxLength: 50 }),
        (items) => {
          const { tvaBreakdown } = TaxCalculator.calculateTotals(items as any);
          const totalTVACalculated = Object.values(tvaBreakdown).reduce((acc, val) => acc + val, 0);
          
          let expectedTvaTotal = 0;
          for (const item of items) {
            const lineTotalTTC = item.unitPriceInMicrounits * item.quantity;
            const rate = parseFloat(item.taxRate);
            const lineTVA = Math.round(lineTotalTTC * rate / (1 + rate));
            expectedTvaTotal += lineTVA;
          }
          
          return totalTVACalculated === expectedTvaTotal;
        }
      )
    );
  });
});
