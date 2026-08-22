import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export interface DeliveryTransactionInput {
  platform: 'uber_eats' | 'deliveroo' | 'just_eat';
  platformOrderId: string;
  grossTtcInMicrounits: number;
  foodCostInMicrounits: number;
  packagingCostInMicrounits: number;
  negotiatedCommissionPct?: number; // Défaut: 30%
}

export interface DeliveryPnLBreakdown {
  platformOrderId: string;
  grossTtcInMicrounits: number;
  commissionInMicrounits: number;
  effectiveCommissionPct: number;
  netMerchantInMicrounits: number;
  netContributionMarginInMicrounits: number;
  netContributionMarginPct: number;
}

/**
 * DeliveryCommissionPnLService — Angle mort F2.
 * Calcul de la marge nette réelle sur les commandes en livraison après déduction de la commission agrégateur (30%), du food cost et du packaging thermique.
 */
export class DeliveryCommissionPnLService {
  static computeOrderPnL(
    tenantId: string,
    input: DeliveryTransactionInput
  ): DeliveryPnLBreakdown {
    const commissionPct = input.negotiatedCommissionPct ?? 30.0;
    const commissionInMicrounits = Math.round((input.grossTtcInMicrounits * commissionPct) / 100);
    const netMerchantInMicrounits = input.grossTtcInMicrounits - commissionInMicrounits;

    const netContributionMarginInMicrounits = netMerchantInMicrounits - input.foodCostInMicrounits - input.packagingCostInMicrounits;
    const netContributionMarginPct = input.grossTtcInMicrounits > 0
      ? Math.round((netContributionMarginInMicrounits / input.grossTtcInMicrounits) * 1000) / 10
      : 0;

    NexusEventBus.emit('delivery.commission_pnl_calculated', {
      v: 1,
      tenantId,
      platform: input.platform,
      platformOrderId: input.platformOrderId,
      grossTtcInMicrounits: input.grossTtcInMicrounits,
      commissionInMicrounits,
      netMerchantInMicrounits,
      calculatedAt: Date.now(),
    });

    return {
      platformOrderId: input.platformOrderId,
      grossTtcInMicrounits: input.grossTtcInMicrounits,
      commissionInMicrounits,
      effectiveCommissionPct: commissionPct,
      netMerchantInMicrounits,
      netContributionMarginInMicrounits,
      netContributionMarginPct,
    };
  }
}
