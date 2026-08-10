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
  /**
   * 🔴 BUG CONNU — §7.4 du PLAN_MAITRE_CORRIGE
   *
   * Le pourboire est encaissé au terminal (usePos.ts:79 → PaymentDialog)
   * mais n'est JAMAIS transmis à FinancialNexusBridge (posOrderSubmit.ts:32).
   * Résultat : encaissement ≠ montant scellé, écart inexpliqué à chaque service.
   *
   * ⚠️ RETIRER `.fails` quand §7.4 est corrigé. Le test basculera alors en
   * échec « inattendument réussi », ce qui force la mise à jour — c'est voulu.
   */
  it.fails('la somme des écritures égale le montant encaissé', async () => {
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

          // Montant réellement encaissé au terminal = panier + pourboire
          // (cf. usePos.ts:79 `cartGrandTotal = cartTotal + tipInMicrounits`)
          const expectedCollected =
            cartItems.reduce((a, i) => a + i.priceInMicrounits * i.quantity, 0) + tip;

          // Somme des écritures au débit (ce que la chaîne fiscale a scellé)
          const sumDebit = r.journalEntry.lines
            .filter((l) => l.side === 'debit')
            .reduce((a, l) => a + (l.amountInMicrounits ?? l.amountInCents * 10_000), 0);

          // 🔴 ÉCHOUE tant que §7.4 n'est pas fait : le pourboire est encaissé
          //    mais jamais transmis au bridge (posOrderSubmit.ts:32).
          return sumDebit === expectedCollected;
        }
      )
    );
  });
});
