import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export interface InfluencerCampaignInput {
  influencerHandle: string; // ex: '@foodie_lyon'
  promoCode: string; // ex: 'FOODIELYON10'
  complimentaryMealCostInMicrounits: number; // Valeur du repas offert (ex: 80.00 €)
  generatedOrdersCount: number;
  totalGeneratedRevenueInMicrounits: number;
}

export interface InfluencerRoiReport {
  influencerHandle: string;
  promoCode: string;
  roiMultiplier: number;
  netRevenueInMicrounits: number;
  isCampaignProfitable: boolean;
}

/**
 * InfluencerCollaborationTrackerService — Angle mort T76.
 * Suivi du ROI des partenariats et invitations influenceurs / presse :
 * Mesure du chiffre d'affaires direct généré par code promo vs coût du repas offert.
 */
export class InfluencerCollaborationTrackerService {
  static evaluateRoi(tenantId: string, campaign: InfluencerCampaignInput): InfluencerRoiReport {
    const netRevenueInMicrounits = campaign.totalGeneratedRevenueInMicrounits - campaign.complimentaryMealCostInMicrounits;
    const roiMultiplier = campaign.complimentaryMealCostInMicrounits > 0
      ? Math.round((campaign.totalGeneratedRevenueInMicrounits / campaign.complimentaryMealCostInMicrounits) * 10) / 10
      : 0;

    const isCampaignProfitable = netRevenueInMicrounits > 0;

    NexusEventBus.emit('crm.influencer_collab_tracked', {
      v: 1,
      tenantId,
      influencerHandle: campaign.influencerHandle,
      promoCode: campaign.promoCode,
      generatedRevenueInMicrounits: campaign.totalGeneratedRevenueInMicrounits,
      trackedAt: Date.now(),
    });

    return {
      influencerHandle: campaign.influencerHandle,
      promoCode: campaign.promoCode,
      roiMultiplier,
      netRevenueInMicrounits,
      isCampaignProfitable,
    };
  }
}
