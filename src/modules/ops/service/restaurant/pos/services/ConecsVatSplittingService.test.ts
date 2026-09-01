import { describe, it, expect } from 'vitest';
import { ConecsVatSplittingService, type CartItemForConecs } from './ConecsVatSplittingService';

describe('ConecsVatSplittingService', () => {
  it('identifies eligible food and ineligible alcohol accurately', () => {
    const burger: CartItemForConecs = { id: '1', name: 'Burger Maison', unitPriceCts: 1500, quantity: 1, category: 'food' };
    const cocktail: CartItemForConecs = { id: '2', name: 'Mojito', unitPriceCts: 800, quantity: 1, isAlcohol: true };
    const beer: CartItemForConecs = { id: '3', name: 'Bière blonde 33cl', unitPriceCts: 600, quantity: 1 };
    const soda: CartItemForConecs = { id: '4', name: 'Coca Cola', unitPriceCts: 400, quantity: 1, category: 'beverage_soft' };

    expect(ConecsVatSplittingService.isItemEligible(burger)).toBe(true);
    expect(ConecsVatSplittingService.isItemEligible(cocktail)).toBe(false);
    expect(ConecsVatSplittingService.isItemEligible(beer)).toBe(false);
    expect(ConecsVatSplittingService.isItemEligible(soda)).toBe(true);
  });

  it('caps at 25.00€ (2500 cts) and computes remaining balance', () => {
    const items: CartItemForConecs[] = [
      { id: '1', name: 'Entrecôte Grillée', unitPriceCts: 2200, quantity: 1, category: 'food' },
      { id: '2', name: 'Tiramisu', unitPriceCts: 800, quantity: 1, category: 'food' }, // Total eligible = 3000 cts
      { id: '3', name: 'Verre de Vin Rouge', unitPriceCts: 600, quantity: 1, isAlcohol: true }, // Ineligible = 600 cts
    ];

    const result = ConecsVatSplittingService.calculateSplit(items);

    expect(result.totalOrderAmountCts).toBe(3600); // 36,00 €
    expect(result.eligibleAmountCts).toBe(3000);   // 30,00 €
    expect(result.ineligibleAmountCts).toBe(600);   // 6,00 €
    expect(result.conecsPayableCts).toBe(2500);     // 25,00 € (capped)
    expect(result.conecsCapApplied).toBe(true);
    expect(result.remainingBalanceCts).toBe(1100);  // 3600 - 2500 = 11,00 €
    expect(result.excludedItems.length).toBe(1);
    expect(result.excludedItems[0].reason).toBe('ALCOHOL');
  });

  it('handles orders under the 25€ cap without capping', () => {
    const items: CartItemForConecs[] = [
      { id: '1', name: 'Sandwich Jambon Beurre', unitPriceCts: 650, quantity: 2, category: 'food' }, // 1300 cts
      { id: '2', name: 'Eau Minérale', unitPriceCts: 250, quantity: 1, category: 'beverage_soft' }, // 250 cts
    ];

    const result = ConecsVatSplittingService.calculateSplit(items);

    expect(result.totalOrderAmountCts).toBe(1550);
    expect(result.eligibleAmountCts).toBe(1550);
    expect(result.ineligibleAmountCts).toBe(0);
    expect(result.conecsPayableCts).toBe(1550);
    expect(result.conecsCapApplied).toBe(false);
    expect(result.remainingBalanceCts).toBe(0);
  });
});
