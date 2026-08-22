import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export interface SurgePricingInput {
  basePriceInMicrounits: number;
  isMatchNightOrPeakEvent: boolean;
  currentOccupancyPct: number;
}

export interface SurgePricingResult {
  appliedMultiplier: number;
  adjustedPriceInMicrounits: number;
  isLegalNoticeRequired: boolean; // Obligation d'affichage des prix majorés à l'entrée
}

/**
 * DynamicPricingSurgeEngineService — Angle mort T72.
 * Moteur de Yield Management & tarification dynamique (soir de match/événement, happy hour) dans le strict respect de l'obligation d'affichage des prix (Arrêté du 27 mars 1987).
 */
export class DynamicPricingSurgeEngineService {
  static computeDynamicPrice(tenantId: string, input: SurgePricingInput): SurgePricingResult {
    let appliedMultiplier = 1.0;

    if (input.isMatchNightOrPeakEvent && input.currentOccupancyPct >= 85) {
      appliedMultiplier = 1.15; // +15% surge
    } else if (input.currentOccupancyPct < 30) {
      appliedMultiplier = 0.90; // -10% off-peak incentive
    }

    const adjustedPriceInMicrounits = Math.round(input.basePriceInMicrounits * appliedMultiplier);

    if (appliedMultiplier !== 1.0) {
      NexusEventBus.emit('commerce.dynamic_surge_applied', {
        v: 1,
        tenantId,
        surgeMultiplier: appliedMultiplier,
        reason: 'high_demand_match_night',
        appliedAt: Date.now(),
      });
    }

    return {
      appliedMultiplier,
      adjustedPriceInMicrounits,
      isLegalNoticeRequired: appliedMultiplier > 1.0,
    };
  }
}
