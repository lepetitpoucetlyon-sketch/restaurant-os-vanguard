import fc from 'fast-check';
import { FinancialNexusBridge } from '@/modules/finance/comptabilite/FinancialNexusBridge';
import { describe, it } from 'vitest';

/**
 * ⚠️ `unitPriceInMicrounits` — c'est le champ lu par `computeTtcByRateAndAxis`.
 * Un `priceInMicrounits` produirait `NaN` et ferait échouer le test pour la
 * mauvaise raison.
 *
 * Prix multiples de 10 000 µ (= 1 centime) : la comptabilité travaille en
 * centimes (`microToCents` arrondit), donc un prix non aligné introduirait
 * un écart d'arrondi qui n'a rien à voir avec l'invariant testé.
 */
const arbCartItem = fc.record({
  id: fc.uuid(),
  cartId: fc.uuid(),
  name: fc.string({ minLength: 1 }),
  unitPriceInMicrounits: fc.integer({ min: 1, max: 50_000 }).map(c => c * 10_000),
  quantity: fc.integer({ min: 1, max: 20 }),
  categoryId: fc.constant('food'),
});

const arbTipMicrounits = fc.integer({ min: 0, max: 5_000 }).map(c => c * 10_000);

describe('Invariant: Conservation Monétaire', () => {
  /**
   * ✅ §7.4 CÂBLÉ — le pourboire traverse maintenant toute la chaîne :
   *    usePos.finalizePayment → processPayment → BridgePayload.tipInMicrounits
   *    → buildJournalLines (crédit 708500 hors TVA + débit moyen de paiement)
   *
   * Cet invariant garde la propriété pour toujours : si quelqu'un retire le
   * pourboire du payload, ou l'intègre par erreur à la base TVA, il casse ici.
   */
  it('la somme des écritures au débit égale le montant encaissé', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(arbCartItem, { minLength: 1, maxLength: 30 }),
        arbTipMicrounits,
        async (cartItems, tip) => {
          const r = await FinancialNexusBridge.processOrder({
            cartItems: cartItems as never,
            operatorId: 'op_123',
            tableId: 'tbl_123',
            tenantId: 'tenant_123',
            tipInMicrounits: tip,
          });

          // Montant réellement encaissé au terminal = panier + pourboire
          // (cf. usePos.ts:79 `cartGrandTotal = cartTotal + tipInMicrounits`)
          const expectedCollected =
            cartItems.reduce((a, i) => a + i.unitPriceInMicrounits * i.quantity, 0) + tip;

          const sumDebit = r.journalEntry.lines
            .filter(l => l.side === 'debit')
            .reduce((a, l) => a + (l.amountInMicrounits ?? l.amountInCents * 10_000), 0);

          return sumDebit === expectedCollected;
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Le pourboire ne doit JAMAIS gonfler la TVA collectée.
   * C'est la moitié de l'invariant qui protège l'e-reporting (§7.3) :
   * une TVA surévaluée produit une déclaration fausse.
   */
  it('le pourboire n\'entre pas dans la base TVA', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(arbCartItem, { minLength: 1, maxLength: 15 }),
        arbTipMicrounits,
        async (cartItems, tip) => {
          const base = {
            cartItems: cartItems as never,
            operatorId: 'op_123',
            tableId: 'tbl_123',
            tenantId: 'tenant_123',
          };

          const sumVat = (r: Awaited<ReturnType<typeof FinancialNexusBridge.processOrder>>) =>
            r.journalEntry.lines
              .filter(l => l.accountCode === '445710')
              .reduce((a, l) => a + (l.amountInMicrounits ?? 0), 0);

          const withoutTip = await FinancialNexusBridge.processOrder(base);
          const withTip = await FinancialNexusBridge.processOrder({ ...base, tipInMicrounits: tip });

          // Même panier, pourboire différent → TVA strictement identique
          return sumVat(withoutTip) === sumVat(withTip);
        }
      ),
      { numRuns: 30 }
    );
  });
});
