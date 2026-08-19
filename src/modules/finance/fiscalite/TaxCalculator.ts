import type { CartItem } from '@/modules/ops';

export class TaxCalculator {
  static applyRate(ttc: number, rate: string | number): number {
    const rateNum = typeof rate === 'string' ? parseFloat(rate) : rate;
    return Math.round(ttc * rateNum / (1 + rateNum));
  }

  static computeTvaBreakdown(items: CartItem[]): Record<string, number> {
    const breakdown: Record<string, number> = {};
    for (const item of items) {
      const rate = item.taxRate ?? '0.10';
      const lineTTC = item.unitPriceInMicrounits * item.quantity - (item.discountInMicrounits ?? 0);
      const tva = this.applyRate(lineTTC, rate);
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
