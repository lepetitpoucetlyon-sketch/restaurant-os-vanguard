/**
 * ConecsVatSplittingService.ts
 * 
 * Moteur de calcul et de fractionnement des titres-restaurant dématérialisés (Réseau CONECS : Swile, Edenred, Pluxee, Up, Bimpli).
 * Invariants respectés :
 * - Plafond légal journalier de 25,00 € (2500 cts) par transaction / jour ouvrable.
 * - Exclusion stricte des articles alcoolisés ou non-alimentaires.
 * - Calcul exact en centimes entiers (zéro arrondi flottant).
 */

export interface CartItemForConecs {
  id: string;
  name: string;
  unitPriceCts: number;
  quantity: number;
  isAlcohol?: boolean;
  category?: 'food' | 'beverage_soft' | 'alcohol' | 'merchandise' | 'service' | string;
}

export interface ConecsSplitResult {
  totalOrderAmountCts: number;
  eligibleAmountCts: number;
  ineligibleAmountCts: number;
  conecsPayableCts: number;
  remainingBalanceCts: number;
  conecsCapApplied: boolean;
  excludedItems: Array<{
    itemId: string;
    name: string;
    amountCts: number;
    reason: 'ALCOHOL' | 'NON_FOOD_CATEGORY';
  }>;
}

export const CONECS_DAILY_LIMIT_CTS = 2500; // 25,00 €

export class ConecsVatSplittingService {
  /**
   * Vérifie si un article est éligible au paiement CONECS.
   */
  public static isItemEligible(item: CartItemForConecs): boolean {
    if (item.isAlcohol === true) return false;
    
    if (item.category) {
      const lower = item.category.toLowerCase();
      if (lower === 'alcohol' || lower === 'alcool' || lower === 'vin' || lower === 'bière' || lower === 'spiritueux') {
        return false;
      }
      if (lower === 'service' || lower === 'merchandise' || lower === 'other') {
        return false;
      }
    }

    const nameLower = item.name.toLowerCase();
    if (/\b(bière|biere|vin|cocktail|whisky|rhum|vodka|gin|champagne|prosecco|liqueur|alcool|tabac)\b/.test(nameLower)) {
      return false;
    }

    return true;
  }

  /**
   * Calcule la répartition exacte du paiement entre CONECS et le reste à charge.
   */
  public static calculateSplit(
    items: CartItemForConecs[],
    customDailyLimitCts: number = CONECS_DAILY_LIMIT_CTS
  ): ConecsSplitResult {
    let eligibleAmountCts = 0;
    let ineligibleAmountCts = 0;
    let totalOrderAmountCts = 0;
    const excludedItems: ConecsSplitResult['excludedItems'] = [];

    for (const item of items) {
      const itemTotalCts = Math.round(item.unitPriceCts * item.quantity);
      totalOrderAmountCts += itemTotalCts;

      if (this.isItemEligible(item)) {
        eligibleAmountCts += itemTotalCts;
      } else {
        ineligibleAmountCts += itemTotalCts;
        const isAlc = item.isAlcohol || /\b(bière|biere|vin|cocktail|whisky|rhum|vodka|gin|champagne|prosecco|liqueur|alcool)\b/.test(item.name.toLowerCase());
        excludedItems.push({
          itemId: item.id,
          name: item.name,
          amountCts: itemTotalCts,
          reason: isAlc ? 'ALCOHOL' : 'NON_FOOD_CATEGORY',
        });
      }
    }

    const conecsPayableCts = Math.min(eligibleAmountCts, customDailyLimitCts);
    const conecsCapApplied = eligibleAmountCts > customDailyLimitCts;
    const remainingBalanceCts = totalOrderAmountCts - conecsPayableCts;

    return {
      totalOrderAmountCts,
      eligibleAmountCts,
      ineligibleAmountCts,
      conecsPayableCts,
      remainingBalanceCts,
      conecsCapApplied,
      excludedItems,
    };
  }
}
