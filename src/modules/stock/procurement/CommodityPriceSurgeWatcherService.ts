import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export interface CommodityPriceTelemetry {
  ingredientSku: string;
  ingredientName: string;
  previousPriceInMicrounits: number;
  currentPriceInMicrounits: number;
}

export interface CommoditySurgeAlert {
  ingredientSku: string;
  surgePct: number;
  isSurgeCritical: boolean; // > 15% surge
  suggestedMenuPriceAdjustmentPct?: number;
  alertBanner?: string;
}

/**
 * CommodityPriceSurgeWatcherService — Angle mort L33.
 * Surveille la flambée des cours des matières premières (+15% à +30% sur huile, saumon, beurre) et calcule l'impact sur la rentabilité avec recommandation de réajustement carte.
 */
export class CommodityPriceSurgeWatcherService {
  public static readonly SURGE_THRESHOLD_PCT = 15.0;

  static detectSurge(tenantId: string, item: CommodityPriceTelemetry): CommoditySurgeAlert {
    const diff = item.currentPriceInMicrounits - item.previousPriceInMicrounits;
    const surgePct = item.previousPriceInMicrounits > 0
      ? Math.round((diff / item.previousPriceInMicrounits) * 1000) / 10
      : 0;

    const isSurgeCritical = surgePct >= this.SURGE_THRESHOLD_PCT;

    if (isSurgeCritical) {
      NexusEventBus.emit('stock.commodity_price_surge_detected', {
        v: 1,
        tenantId,
        ingredientSku: item.ingredientSku,
        previousPriceInMicrounits: item.previousPriceInMicrounits,
        currentPriceInMicrounits: item.currentPriceInMicrounits,
        surgePct,
        detectedAt: Date.now(),
      });

      return {
        ingredientSku: item.ingredientSku,
        surgePct,
        isSurgeCritical: true,
        suggestedMenuPriceAdjustmentPct: Math.round(surgePct * 0.3 * 10) / 10, // ~30% food cost weight
        alertBanner: `📈 FLAMBÉE MATIÈRE PREMIÈRE (+${surgePct}%) sur ${item.ingredientName} : Revoir les fiches techniques ou ajuster le prix carte.`,
      };
    }

    return {
      ingredientSku: item.ingredientSku,
      surgePct,
      isSurgeCritical: false,
    };
  }
}
