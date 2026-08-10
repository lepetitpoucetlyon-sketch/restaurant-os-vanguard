/* eslint-disable no-restricted-imports -- infrastructure: deep path required */
import type { CartItem } from '@/shared/nexus/contracts/ops.engine.types';

export class TaxCalculator {
  static computeTvaBreakdown(items: CartItem[]): Record<string, number> {
    const breakdown: Record<string, number> = {};
    for (const item of items) {
      const rate = item.taxRate ?? '0.10';
      const rateNum = parseFloat(rate);
      // Prix stockés TTC (norme restauration FR) : TVA = TTC × r/(1+r)
      const lineTTC = item.unitPriceInMicrounits * item.quantity - (item.discountInMicrounits ?? 0);
      const tva = Math.round(lineTTC * rateNum / (1 + rateNum));
      breakdown[rate] = (breakdown[rate] ?? 0) + tva;
    }
    return breakdown;
  }

  static calculateTotals(cartItems: CartItem[]) {
    const totalTTCInMicrounits = cartItems.reduce(
      (acc, item) =>
        acc +
        item.unitPriceInMicrounits * item.quantity -
        (item.discountInMicrounits ?? 0),
      0
    );
    const tvaBreakdown = this.computeTvaBreakdown(cartItems);
    const totalTVAInMicrounits = Object.values(tvaBreakdown).reduce(
      (a, b) => a + b,
      0
    );
    const totalHTInMicrounits = totalTTCInMicrounits - totalTVAInMicrounits;
    
    return {
      totalTTCInMicrounits,
      totalTVAInMicrounits,
      totalHTInMicrounits,
      tvaBreakdown
    };
  }
}
