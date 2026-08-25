import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { getSetting } from '@/lib/settings/SettingsReader';

export interface CommodityPriceTelemetry {
  ingredientSku: string;
  ingredientName: string;
  previousPriceInMicrounits: number;
  currentPriceInMicrounits: number;
}

export interface CommoditySurgeAlert {
  ingredientSku: string;
  surgePct: number;
  isSurgeCritical: boolean; // > 15% surge (ou configuré via RBAC)
  suggestedMenuPriceAdjustmentPct?: number;
  alertBanner?: string;
}

/**
 * CommodityPriceSurgeWatcherService — Angle mort L33 (DF-J2 / DF-J3).
 * Surveille la flambée des cours des matières premières et calcule l'impact sur la rentabilité avec recommandation de réajustement carte.
 */
export class CommodityPriceSurgeWatcherService {
  public static getSurgeThresholdPct(): number {
    return getSetting<number>('inventory', 'commodity_surge_alert_pct', 15.0);
  }

  public static getFoodCostWeight(): number {
    return getSetting<number>('inventory', 'food_cost_weight_pct', 30) / 100;
  }

  static detectSurge(tenantId: string, item: CommodityPriceTelemetry): CommoditySurgeAlert {
    const diff = item.currentPriceInMicrounits - item.previousPriceInMicrounits;
    const surgePct = item.previousPriceInMicrounits > 0
      ? Math.round((diff / item.previousPriceInMicrounits) * 1000) / 10
      : 0;

    const thresholdPct = this.getSurgeThresholdPct();
    const isSurgeCritical = surgePct >= thresholdPct;

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

      const weight = this.getFoodCostWeight();
      return {
        ingredientSku: item.ingredientSku,
        surgePct,
        isSurgeCritical: true,
        suggestedMenuPriceAdjustmentPct: Math.round(surgePct * weight * 10) / 10,
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
