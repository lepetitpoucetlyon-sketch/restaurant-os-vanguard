import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export interface LotAllergenSpec {
  supplierLotId: string;
  ingredientId: string;
  ingredientName: string;
  declaredAllergens: string[]; // ex: ['gluten', 'arachides', 'lait']
  receiptDateIso: string;
}

export interface DishDynamicAllergensResult {
  dishId: string;
  dishName: string;
  aggregatedAllergens: string[];
  hasCriticalAllergens: boolean;
}

/**
 * LotAllergenMatrixService — Angle mort L11.
 * Maintient la matrice INCO 1169/2011 dynamique par lot de réception fournisseur (les allergènes d'une sauce dépendent du fournisseur/lot du jour).
 */
export class LotAllergenMatrixService {
  static updateLotAllergens(tenantId: string, spec: LotAllergenSpec): void {
    NexusEventBus.emit('kds.lot_allergen_matrix_updated', {
      v: 1,
      tenantId,
      supplierLotId: spec.supplierLotId,
      ingredientId: spec.ingredientId,
      activeAllergens: spec.declaredAllergens,
      updatedAt: Date.now(),
    });
  }

  static computeDishDynamicAllergens(
    dishId: string,
    dishName: string,
    activeLots: LotAllergenSpec[]
  ): DishDynamicAllergensResult {
    const allergenSet = new Set<string>();
    for (const lot of activeLots) {
      for (const a of lot.declaredAllergens) {
        allergenSet.add(a.toLowerCase().trim());
      }
    }

    const aggregated = Array.from(allergenSet).sort();
    return {
      dishId,
      dishName,
      aggregatedAllergens: aggregated,
      hasCriticalAllergens: aggregated.includes('arachides') || aggregated.includes('fruits_a_coque'),
    };
  }
}
