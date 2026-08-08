import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';

export interface RFATier {
  spendThresholdInMicrounits: number; // e.g. 50_000_000_000 (50 000€)
  rebatePercentage: number; // e.g. 3.5 for 3.5%
}

export interface RFACalculationResult {
  supplierId: string;
  accumulatedSpendInMicrounits: number;
  activeTier: RFATier | null;
  rfaAmountInMicrounits: number;
  nextTier: RFATier | null;
}

/**
 * 💶 RFACalculatorService (Item 3.3)
 * Service de calcul des RFA (Remises de Fin d'Année) et suivi des paliers grossistes.
 */
export class RFACalculatorService {
  static calculateRFA(
    supplierId: string,
    accumulatedSpendInMicrounits: number,
    tiers: RFATier[]
  ): RFACalculationResult {
    const sortedTiers = [...tiers].sort((a, b) => a.spendThresholdInMicrounits - b.spendThresholdInMicrounits);

    let activeTier: RFATier | null = null;
    let nextTier: RFATier | null = null;

    for (let i = 0; i < sortedTiers.length; i++) {
      if (accumulatedSpendInMicrounits >= sortedTiers[i].spendThresholdInMicrounits) {
        activeTier = sortedTiers[i];
      } else if (!nextTier) {
        nextTier = sortedTiers[i];
      }
    }

    const rfaAmountInMicrounits = activeTier
      ? Math.round(accumulatedSpendInMicrounits * (activeTier.rebatePercentage / 100))
      : 0;

    logger.info(`[RFACalculatorService] Fournisseur ${supplierId} -> Spend: ${(accumulatedSpendInMicrounits / 1_000_000).toFixed(2)}€, RFA: ${(rfaAmountInMicrounits / 1_000_000).toFixed(2)}€`);

    if (activeTier) {
      empireAudit.log({
        module: 'accounting',
        action: 'RFA_THRESHOLD_REACHED',
        details: { supplierId, accumulatedSpendInMicrounits, rfaAmountInMicrounits, tierPercentage: activeTier.rebatePercentage },
        severity: 'low',
        timestamp: new Date(),
      });
    }

    return {
      supplierId,
      accumulatedSpendInMicrounits,
      activeTier,
      rfaAmountInMicrounits,
      nextTier,
    };
  }
}
