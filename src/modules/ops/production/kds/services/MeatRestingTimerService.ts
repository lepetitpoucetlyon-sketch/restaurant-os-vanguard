import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export type CookingDoneness = 'bleu' | 'saignant' | 'a_point' | 'bien_cuit';

export interface MeatRestingPlanRequest {
  tenantId: string;
  orderId: string;
  cutName: string; // ex: 'Côte de bœuf 1kg', 'Magret de canard', 'Filet mignon'
  thicknessCm: number;
  doneness: CookingDoneness;
  cookedEndTimestamp: number;
}

export interface MeatRestingStatus {
  orderId: string;
  cutName: string;
  recommendedRestDurationSeconds: number;
  readyToCarveTimestamp: number;
  isRestingCompleted: boolean;
  remainingSeconds: number;
}

/**
 * MeatRestingTimerService — Angle mort T16.
 * Enforce le temps de repos obligatoire post-cuisson des viandes (50% du temps de cuisson ou 1 min par cm d'épaisseur) pour réhydrater les fibres musculaires et éviter la perte de jus au découpage.
 */
export class MeatRestingTimerService {
  static calculateRestingPlan(req: MeatRestingPlanRequest): MeatRestingStatus {
    // Standard culinary rule: ~60s per cm of thickness, scaled by doneness
    const multiplier = req.doneness === 'bien_cuit' ? 1.4 : req.doneness === 'a_point' ? 1.2 : 1.0;
    const recommendedRestDurationSeconds = Math.round(req.thicknessCm * 60 * multiplier);
    const readyToCarveTimestamp = req.cookedEndTimestamp + (recommendedRestDurationSeconds * 1000);
    const remainingSeconds = Math.max(0, Math.floor((readyToCarveTimestamp - Date.now()) / 1000));
    const isRestingCompleted = remainingSeconds === 0;

    if (isRestingCompleted) {
      NexusEventBus.emit('production.meat_resting_completed', {
        v: 1,
        tenantId: req.tenantId,
        orderId: req.orderId,
        cutName: req.cutName,
        targetRestSeconds: recommendedRestDurationSeconds,
        completedAt: Date.now(),
      });
    }

    return {
      orderId: req.orderId,
      cutName: req.cutName,
      recommendedRestDurationSeconds,
      readyToCarveTimestamp,
      isRestingCompleted,
      remainingSeconds,
    };
  }
}
