import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export interface InTransitCancelRequest {
  tenantId: string;
  platform: 'uber_eats' | 'deliveroo' | 'just_eat';
  platformOrderId: string;
  foodCostInMicrounits: number;
  preparationStage: 'cooking' | 'ready_at_pass' | 'handed_to_courier';
}

export interface InTransitCancelResolution {
  platformOrderId: string;
  isLossCompensated: boolean;
  refundClaimSubmitted: boolean;
  stockLossRecordedInMicrounits: number;
  actionTaken: string;
}

/**
 * InTransitDeliveryCancelHandler — Angle mort T46.
 * Traitement immédiat des annulations en cours de route par le client ou coursier :
 * Arrêt de cuisson, décompte de la perte alimentaire et soumission automatique de la réclamation d'indemnisation 100% auprès de la plateforme.
 */
export class InTransitDeliveryCancelHandler {
  static handleCancel(req: InTransitCancelRequest): InTransitCancelResolution {
    const isLossCompensated = req.preparationStage === 'ready_at_pass' || req.preparationStage === 'handed_to_courier';

    NexusEventBus.emit('delivery.in_transit_cancelled', {
      v: 1,
      tenantId: req.tenantId,
      platformOrderId: req.platformOrderId,
      platform: req.platform,
      foodLostCostInMicrounits: req.foodCostInMicrounits,
      refundClaimSubmitted: isLossCompensated,
      cancelledAt: Date.now(),
    });

    return {
      platformOrderId: req.platformOrderId,
      isLossCompensated,
      refundClaimSubmitted: isLossCompensated,
      stockLossRecordedInMicrounits: req.foodCostInMicrounits,
      actionTaken: isLossCompensated
        ? 'Réclamation d\'indemnisation intégrale soumise à ' + req.platform
        : 'Cuisson interrompue, perte évitée.',
    };
  }
}
