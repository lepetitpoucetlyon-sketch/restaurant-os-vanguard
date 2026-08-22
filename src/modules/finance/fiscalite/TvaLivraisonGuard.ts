/**
 * T49 — Mauvais taux TVA livraison (5,5 % à emporter vs 10 % sur place).
 *
 * En France :
 *  - Consommation sur place → TVA 10 %
 *  - Vente à emporter (non préparée à la commande) → TVA 5,5 %
 *  - Livraison / take-away → TVA 10 % (si aliments chauds) ou 5,5 % (froids)
 *
 * L'ambiguïté est fréquente sur les commandes delivery (Uber Eats taxe à 10 %
 * alors que les sandwichs froids devraient être à 5,5 %).
 *
 * Ce guard valide la cohérence `consumptionMode × taxRate` et alerte si erreur.
 *
 * Cf. docs/anglemort-restaurant-mcc.md § T49 (HAUT).
 */
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { AuditLogger } from '@/modules/compliance';

export type ConsumptionMode = 'dine_in' | 'takeaway_cold' | 'takeaway_hot' | 'delivery';

const EXPECTED_RATES: Record<ConsumptionMode, string[]> = {
  dine_in: ['0.10', '0.055'],
  takeaway_cold: ['0.055'],
  takeaway_hot: ['0.10'],
  delivery: ['0.10', '0.055'],
};

export interface TvaLivraisonItem {
  cartId: string;
  productId: string;
  name: string;
  taxRate: string;
  temperature?: 'hot' | 'cold';
}

export interface TvaLivraisonResult {
  valid: boolean;
  mismatches: Array<{ cartId: string; name: string; providedRate: string; expectedRates: string[] }>;
}

export class TvaLivraisonGuard {
  static check(mode: ConsumptionMode, items: TvaLivraisonItem[]): TvaLivraisonResult {
    const mismatches: TvaLivraisonResult['mismatches'] = [];

    for (const item of items) {
      let expectedRates = EXPECTED_RATES[mode];

      if (mode === 'delivery' && item.temperature) {
        expectedRates = item.temperature === 'hot' ? ['0.10'] : ['0.055'];
      }

      if (!expectedRates.includes(item.taxRate)) {
        mismatches.push({ cartId: item.cartId, name: item.name, providedRate: item.taxRate, expectedRates });
      }
    }

    return { valid: mismatches.length === 0, mismatches };
  }

  static async validateAndAlert(input: {
    tenantId: string;
    orderId: string;
    operatorId: string;
    consumptionMode: ConsumptionMode;
    items: TvaLivraisonItem[];
    now?: number;
  }): Promise<TvaLivraisonResult> {
    const result = this.check(input.consumptionMode, input.items);

    if (!result.valid) {
      for (const mm of result.mismatches) {
        await NexusEventBus.emit('finance.tva_livraison_mismatch', {
          v: 1,
          tenantId: input.tenantId,
          orderId: input.orderId,
          consumptionMode: input.consumptionMode,
          providedTaxRate: mm.providedRate,
          expectedTaxRate: mm.expectedRates[0],
          detectedAt: input.now ?? Date.now(),
        });
      }
      await AuditLogger.logAction(
        input.operatorId,
        'TVA_LIVRAISON_MISMATCH',
        input.orderId,
        { consumptionMode: input.consumptionMode, mismatches: result.mismatches },
      ).catch(() => null);
    }

    return result;
  }
}
