import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export interface CourierPacingInput {
  orderId: string;
  courierDistanceMeters: number;
  courierSpeedKmH: number;
  dishCookingDurationMinutes: number; // ex: 6 min pour burger/frites
}

export interface PacingDecision {
  orderId: string;
  courierEtaMinutes: number;
  fireKitchenPrep: boolean;
  instruction: 'hold_prep' | 'fire_immediate' | 'already_ready';
}

/**
 * CourierGpsKdsPacingService — Angle mort L47.
 * Cadençage de la cuisson asservi à l'approche GPS du livreur :
 * Ne déclenche la fin de cuisson des frites/burgers que lorsque le livreur est à moins de (temps de cuisson + 2 min) du restaurant pour garantir un repas chaud et croustillant.
 */
export class CourierGpsKdsPacingService {
  static evaluatePacing(tenantId: string, input: CourierPacingInput): PacingDecision {
    const speedMps = Math.max(1, (input.courierSpeedKmH * 1000) / 3600);
    const etaMinutes = Math.round((input.courierDistanceMeters / speedMps) / 60);

    const triggerThresholdMinutes = input.dishCookingDurationMinutes + 2;
    const fireKitchenPrep = etaMinutes <= triggerThresholdMinutes;

    NexusEventBus.emit('delivery.courier_pacing_triggered', {
      v: 1,
      tenantId,
      orderId: input.orderId,
      courierDistanceMeters: input.courierDistanceMeters,
      etaMinutes,
      fireKitchenPrep,
      triggeredAt: Date.now(),
    });

    return {
      orderId: input.orderId,
      courierEtaMinutes: etaMinutes,
      fireKitchenPrep,
      instruction: fireKitchenPrep ? 'fire_immediate' : 'hold_prep',
    };
  }
}
