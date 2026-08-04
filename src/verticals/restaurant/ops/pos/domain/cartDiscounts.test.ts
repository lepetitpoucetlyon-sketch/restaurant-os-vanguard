import { describe, it, expect } from 'vitest';
import { applyItemDiscount, applyItemOffer } from './cartDiscounts';
import { toMicrounits } from '@/domain/schemas/primitives';
import type { CartItem } from '@/verticals/restaurant/ops/workflow/engine/types';

/**
 * dette-3 — Couverture des transformations pures de remise / offre par ligne.
 * Toutes les valeurs sont en microunits (1 000 000 µ = 1 €).
 */

function makeItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    cartId: 'c1',
    productId: 'p1',
    categoryId: 'cat1',
    name: 'Café',
    quantity: 1,
    unitPriceInMicrounits: toMicrounits(2_000_000), // 2,00 €
    discountInMicrounits: toMicrounits(0),
    taxRate: '0.10',
    modifiers: [],
    ...overrides,
  } as CartItem;
}

describe('cartDiscounts — applyItemDiscount', () => {
  it('applique une remise de 50 % et reflète le prix dans unitPriceInMicrounits', () => {
    const out = applyItemDiscount(makeItem(), 50);
    expect(out.unitPriceInMicrounits).toBe(1_000_000);
    expect(out.discountInMicrounits).toBe(1_000_000);
    expect(out.originalPriceInMicrounits).toBe(2_000_000);
    expect(out.discountPercent).toBe(50);
  });

  it('ne mute pas la ligne d\'origine (immuabilité)', () => {
    const input = makeItem();
    const out = applyItemDiscount(input, 25);
    expect(input.unitPriceInMicrounits).toBe(2_000_000); // inchangé
    expect(out).not.toBe(input);
  });

  it('retire la remise avec percent = 0 et restaure le prix d\'origine', () => {
    const discounted = applyItemDiscount(makeItem(), 30);
    const restored = applyItemDiscount(discounted, 0);
    expect(restored.unitPriceInMicrounits).toBe(2_000_000);
    expect(restored.discountInMicrounits).toBe(0);
    expect(restored.discountPercent).toBeUndefined();
    expect(restored.originalPriceInMicrounits).toBeUndefined();
  });

  it('ré-applique une remise sur le prix d\'origine, pas sur le prix déjà remisé', () => {
    const first = applyItemDiscount(makeItem(), 50);   // 2,00 → 1,00
    const second = applyItemDiscount(first, 10);        // doit repartir de 2,00 → 1,80
    expect(second.unitPriceInMicrounits).toBe(1_800_000);
    expect(second.originalPriceInMicrounits).toBe(2_000_000);
    expect(second.discountPercent).toBe(10);
  });

  it('100 % de remise met le prix à zéro', () => {
    const out = applyItemDiscount(makeItem(), 100);
    expect(out.unitPriceInMicrounits).toBe(0);
    expect(out.discountInMicrounits).toBe(2_000_000);
  });
});

describe('cartDiscounts — applyItemOffer', () => {
  it('met le prix à zéro et marque isOffer', () => {
    const out = applyItemOffer(makeItem());
    expect(out.unitPriceInMicrounits).toBe(0);
    expect(out.discountInMicrounits).toBe(2_000_000);
    expect(out.discountPercent).toBe(100);
    expect(out.isOffer).toBe(true);
    expect(out.originalPriceInMicrounits).toBe(2_000_000);
  });

  it('conserve le prix d\'origine même si une remise préexiste', () => {
    const discounted = applyItemDiscount(makeItem(), 40); // 2,00 → 1,20
    const offered = applyItemOffer(discounted);
    expect(offered.unitPriceInMicrounits).toBe(0);
    expect(offered.originalPriceInMicrounits).toBe(2_000_000); // prix d'origine, pas 1,20
  });

  it('ne mute pas la ligne d\'origine', () => {
    const input = makeItem();
    applyItemOffer(input);
    expect(input.unitPriceInMicrounits).toBe(2_000_000);
    expect(input.isOffer).toBeUndefined();
  });
});
