import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export interface DualPricingRequest {
  tenantId: string;
  productId: string;
  productName: string;
  diningRoomPriceInMicrounits: number; // ex: 15.00 € (15_000_000)
  targetMarkupPct?: number; // Défaut: +20% sur plateformes
}

export interface DualPricingResult {
  productId: string;
  diningRoomPriceInMicrounits: number;
  deliveryPriceInMicrounits: number;
  markupPct: number;
  markupAmountInMicrounits: number;
}

/**
 * DeliveryDualPricingService — Angle mort L49.
 * Double tarification automatique catalogue livraison (+15% à +25%) pour répercuter de manière indolore les commissions prélevées par les plateformes tierces.
 */
export class DeliveryDualPricingService {
  static computeDeliveryPrice(req: DualPricingRequest): DualPricingResult {
    const markupPct = req.targetMarkupPct ?? 20.0;
    const deliveryPriceInMicrounits = Math.round(req.diningRoomPriceInMicrounits * (1 + markupPct / 100));
    const markupAmountInMicrounits = deliveryPriceInMicrounits - req.diningRoomPriceInMicrounits;

    NexusEventBus.emit('delivery.dual_pricing_applied', {
      v: 1,
      tenantId: req.tenantId,
      productId: req.productId,
      diningRoomPriceInMicrounits: req.diningRoomPriceInMicrounits,
      deliveryPriceInMicrounits,
      markupPct,
      appliedAt: Date.now(),
    });

    return {
      productId: req.productId,
      diningRoomPriceInMicrounits: req.diningRoomPriceInMicrounits,
      deliveryPriceInMicrounits,
      markupPct,
      markupAmountInMicrounits,
    };
  }
}
