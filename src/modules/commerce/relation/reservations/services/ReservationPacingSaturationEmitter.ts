/**
 * M101 — Arrival Flow Pacing (émission event saturation)
 *
 * Wrapper autour de ReservationPacingService.evaluateBooking() qui :
 * 1. Émet `commerce.reservation_pacing_saturated` quand un créneau est plein
 * 2. Trace l'échec via AuditLogger (ADR-014) pour justifier tout override manager
 *
 * Cf. docs/anglemort-restaurant-mcc.md § SECTION 4 M101.
 * RBAC : `reservations.manage_pacing` (Manager + PIN) pour forcer.
 */
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { AuditLogger } from '@/lib/audit';
import {
  ReservationPacingService,
  type PacingConfig,
  type ExistingReservationSlot,
  type BookingFeasibilityResult,
} from './ReservationPacingService';

export interface EvaluateAndNotifyParams {
  tenantId: string;
  operatorId: string;
  config: PacingConfig;
  existingReservations: ExistingReservationSlot[];
  requestedSlot: string;
  partySize: number;
}

export class ReservationPacingSaturationEmitter {
  /**
   * Évalue la faisabilité + émet l'event de saturation si refus.
   * Retourne le résultat de ReservationPacingService inchangé.
   */
  static async evaluateAndNotify(
    params: EvaluateAndNotifyParams,
  ): Promise<BookingFeasibilityResult> {
    const { tenantId, operatorId, config, existingReservations, requestedSlot, partySize } = params;

    const result = ReservationPacingService.evaluateBooking(
      config,
      existingReservations,
      requestedSlot,
      partySize,
    );

    if (!result.canAccept) {
      await NexusEventBus.emit('commerce.reservation_pacing_saturated', {
        v: 1,
        tenantId,
        slot: requestedSlot,
        partySize,
        availableCovers: result.availableOnSlot,
        suggestedAlternativeSlots: result.suggestedAlternativeSlots,
      });

      await AuditLogger.logAction(
        operatorId,
        'ROLE_ELEVATED',
        `pacing/${requestedSlot}`,
        {
          reason: result.reason,
          partySize,
          available: result.availableOnSlot,
        },
      ).catch(() => null);
    }

    return result;
  }
}
