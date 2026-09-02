import type { CartItem } from '@nexus/contracts';

export class TaxCalculator {
  static getRateBps(rate: string | number): number {
    if (typeof rate === 'number') {
      return Math.round(rate * 10000);
    }
    const clean = rate.trim();
    if (clean.includes('%')) {
      return Math.round(parseFloat(clean.replace('%', '')) * 100);
    }
    const [intPart, decPart = ''] = clean.split('.');
    const padded = (decPart + '0000').slice(0, 4);
    return (parseInt(intPart, 10) || 0) * 10000 + (parseInt(padded, 10) || 0);
  }

  static applyRate(ttc: number, rate: string | number): number {
    const bps = this.getRateBps(rate);
    return Math.round((ttc * bps) / (10000 + bps));
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
