import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export type PackagingType = 'thermal_box_kraft' | 'foil_pouch' | 'cold_salad_bowl' | 'drink_carrier_4cup' | 'heavy_duty_bag';

const PACKAGING_UNIT_COSTS: Record<PackagingType, number> = {
  thermal_box_kraft: 350_000, // 0.35 €
  foil_pouch: 150_000,        // 0.15 €
  cold_salad_bowl: 250_000,   // 0.25 €
  drink_carrier_4cup: 200_000,// 0.20 €
  heavy_duty_bag: 300_000,    // 0.30 €
};

export interface PackagingItemRequest {
  type: PackagingType;
  quantity: number;
}

export interface PackagingCostReport {
  orderId: string;
  totalPackagingCostInMicrounits: number;
  breakdown: { type: PackagingType; quantity: number; costInMicrounits: number }[];
}

/**
 * ThermalPackagingImputationService — Angle mort T44.
 * Imputation automatique des coûts réels de packaging thermique et éco-responsable (0.35€ à 1.20€ par commande) dans la structure de marge de livraison.
 */
export class ThermalPackagingImputationService {
  static computeOrderPackaging(
    tenantId: string,
    orderId: string,
    items: PackagingItemRequest[]
  ): PackagingCostReport {
    let total = 0;
    const breakdown = items.map(i => {
      const unitCost = PACKAGING_UNIT_COSTS[i.type] ?? 200_000;
      const costInMicrounits = unitCost * i.quantity;
      total += costInMicrounits;
      return { type: i.type, quantity: i.quantity, costInMicrounits };
    });

    NexusEventBus.emit('delivery.thermal_packaging_costed', {
      v: 1,
      tenantId,
      orderId,
      packagingCostInMicrounits: total,
      itemCategoryCount: items.length,
      costedAt: Date.now(),
    });

    return {
      orderId,
      totalPackagingCostInMicrounits: total,
      breakdown,
    };
  }
}
