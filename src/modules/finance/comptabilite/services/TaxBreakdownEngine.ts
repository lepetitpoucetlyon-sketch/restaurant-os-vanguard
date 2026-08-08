export interface TaxItem {
  productId: string;
  priceInMicrounits: number;
  vatRateBps: number; // e.g. 550 for 5.5%, 1000 for 10%, 2000 for 20%
  category?: 'takeout_food' | 'dinein_prepared' | 'alcohol' | 'standard';
}

export interface TaxBreakdownResult {
  totalHtInMicrounits: number;
  totalVatInMicrounits: number;
  totalTtcInMicrounits: number;
  vatBreakdown: {
    vat5_5InMicrounits: number;
    vat10InMicrounits: number;
    vat20InMicrounits: number;
  };
}

/**
 * 🧮 TaxBreakdownEngine (Item 5.1)
 * Moteur de ventilation automatique de TVA mixte (Loi de Finance & DGFIP).
 * Calcule la répartition exacte des taux de TVA (5.5% emporté non préparé, 10% sur place/préparé, 20% alcools)
 * sur les menus combos et paniers multi-articles.
 */
export class TaxBreakdownEngine {
  static calculateBreakdown(items: TaxItem[], isTakeout: boolean = false): TaxBreakdownResult {
    let totalHt = 0;
    let totalVat = 0;
    let totalTtc = 0;
    let vat5_5 = 0;
    let vat10 = 0;
    let vat20 = 0;

    for (const item of items) {
      const price = item.priceInMicrounits;
      let effectiveRateBps = item.vatRateBps;

      // Détermination du taux effectif selon le mode de consommation
      if (item.category === 'alcohol') {
        effectiveRateBps = 2000; // 20% toujours
      } else if (isTakeout && item.category === 'takeout_food') {
        effectiveRateBps = 550; // 5.5% à emporté conditionné
      } else if (item.category === 'dinein_prepared' || !isTakeout) {
        effectiveRateBps = 1000; // 10% restauration sur place / préparé
      }

      const rateDecimal = effectiveRateBps / 10000;
      const ht = Math.round(price / (1 + rateDecimal));
      const vat = price - ht;

      totalHt += ht;
      totalVat += vat;
      totalTtc += price;

      if (effectiveRateBps === 550) vat5_5 += vat;
      else if (effectiveRateBps === 1000) vat10 += vat;
      else if (effectiveRateBps === 2000) vat20 += vat;
    }

    return {
      totalHtInMicrounits: totalHt,
      totalVatInMicrounits: totalVat,
      totalTtcInMicrounits: totalTtc,
      vatBreakdown: {
        vat5_5InMicrounits: vat5_5,
        vat10InMicrounits: vat10,
        vat20InMicrounits: vat20,
      },
    };
  }
}
