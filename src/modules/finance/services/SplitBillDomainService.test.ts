import { describe, it, expect } from 'vitest';
import { SplitBillDomainService } from './SplitBillDomainService';
import type { CartItem as SplitCartItem } from '@/modules/ops';

describe('💳 SplitBillDomainService — Fractionnement d\'Addition & Microunités', () => {
  it('devrait fractionner une somme égale en allouant les centimes résiduels sans perte (Règle du Reliquat)', () => {
    // 100,00 € (10 000 cents) divisé en 3 personnes = 33,34€, 33,33€, 33,33€
    const payments = SplitBillDomainService.createEqualPayments(3, 10000);

    expect(payments.length).toBe(3);
    expect(payments[0].amount).toBe(3334);
    expect(payments[1].amount).toBe(3333);
    expect(payments[2].amount).toBe(3333);

    const sum = payments.reduce((acc, p) => acc + p.amount, 0);
    expect(sum).toBe(10000); // 100% conservation du total
  });

  it('devrait calculer le reste à payer sur une addition partiellement réglée', () => {
    const payments = [
      { paid: true, amount: 3334 },
      { paid: true, amount: 3333 },
      { paid: false, amount: 3333 },
    ];

    const remaining = SplitBillDomainService.calculateRemaining(10000, payments);
    expect(remaining).toBe(3333);
  });

  it('devrait calculer le total par convive selon les articles sélectionnés', () => {
    const mockItems = [
      { cartId: 'item_c1', name: 'Burger Gourmet', unitPriceInMicrounits: 18000000, quantity: 1 },
      { cartId: 'item_c2', name: 'Bière Artisanale', unitPriceInMicrounits: 7000000, quantity: 1 },
    ] as unknown as SplitCartItem[];

    const selectedItems = {
      0: ['item_c1'], // Convive 0 mange le burger
      1: ['item_c2'], // Convive 1 boit la bière
    };

    const totalConvive0 = SplitBillDomainService.getConviveTotal(
      'by-item',
      0,
      1250,
      [],
      selectedItems,
      mockItems
    );
    expect(totalConvive0).toBe(18); // 18.00 €

    const totalConvive1 = SplitBillDomainService.getConviveTotal(
      'by-item',
      1,
      1250,
      [],
      selectedItems,
      mockItems
    );
    expect(totalConvive1).toBe(7); // 7.00 €
  });

  it('devrait fonctionner nativement avec les microunités', () => {
    // 100 € = 100_000_000 µ
    const payments = SplitBillDomainService.createEqualPaymentsFromMicrounits(3, 100_000_000);
    expect(payments.length).toBe(3);
    expect(payments[0].amount).toBe(3334);

    const remaining = SplitBillDomainService.calculateRemainingFromMicrounits(100_000_000, payments);
    expect(remaining).toBe(10000);
  });
});
