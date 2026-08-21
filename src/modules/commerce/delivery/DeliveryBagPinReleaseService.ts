import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export interface BagReleaseRequest {
  tenantId: string;
  orderId: string;
  expectedPin: string;
  providedCourierPin: string;
}

export interface BagReleaseResult {
  orderId: string;
  isUnlocked: boolean;
  rejectReason?: string;
  releasedAt?: number;
}

/**
 * DeliveryBagPinReleaseService — Angle mort L48.
 * Libération sécurisée du sac de livraison par code PIN / QR à 4 chiffres afin d'éradiquer les vols de commande par des faux livreurs au passe.
 */
export class DeliveryBagPinReleaseService {
  static verifyAndReleaseBag(req: BagReleaseRequest): BagReleaseResult {
    const isUnlocked = req.expectedPin.trim() === req.providedCourierPin.trim();

    if (!isUnlocked) {
      return {
        orderId: req.orderId,
        isUnlocked: false,
        rejectReason: 'Code PIN livreur erroné. Refus de remise du sac.',
      };
    }

    NexusEventBus.emit('delivery.bag_pin_released', {
      v: 1,
      tenantId: req.tenantId,
      orderId: req.orderId,
      courierPin: req.providedCourierPin,
      releasedToCourier: true,
      releasedAt: Date.now(),
    });

    return {
      orderId: req.orderId,
      isUnlocked: true,
      releasedAt: Date.now(),
    };
  }
}
