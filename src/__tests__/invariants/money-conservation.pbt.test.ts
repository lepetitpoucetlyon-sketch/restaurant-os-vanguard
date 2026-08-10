import fc from 'fast-check';
import { FinancialNexusBridge } from '@/modules/finance/comptabilite/FinancialNexusBridge';
import { describe, it } from 'vitest';

const arbCartItem = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1 }),
  priceInMicrounits: fc.integer({ min: 1, max: 500_000_000 }),
  quantity: fc.integer({ min: 1, max: 20 }),
  categoryId: fc.constant('food'),
});

describe('Invariant: Conservation Monétaire', () => {
  it('la somme des écritures égale le montant encaissé', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(arbCartItem, { minLength: 1, maxLength: 30 }),
        fc.integer({ min: 0, max: 50_000_000 }),           // pourboire
        async (cartItems, tip) => {
          const payload = { 
            cartItems: cartItems as any, 
            operatorId: 'op_123', 
            tableId: 'tbl_123', 
            tenantId: 'tenant_123',
            tipInMicrounits: tip 
          };
          const r = await FinancialNexusBridge.processOrder(payload as any);
          const sumLines = r.journalEntry.lines.reduce((a, l) => a + l.amountInMicrounits, 0);
          return sumLines === r.amountCollectedInMicrounits;
        }
      )
    );
  });
});
