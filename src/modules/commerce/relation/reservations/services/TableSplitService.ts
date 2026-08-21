/**
 * M102 — Table Split No-Show partiel
 *
 * Réservation de 8 arrive à 3 → on doit pouvoir libérer 5 sièges (typiquement demi-table)
 * pour raccrocher une walk-in list, sans casser la loi RBAC ni le sceau caisse.
 *
 * Cf. docs/anglemort-restaurant-mcc.md § SECTION 4 M102.
 * RBAC : `reservations.force_split` (Chef de rang).
 * Event : `ops.table_split_released`.
 */
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { logger } from '@/lib/logger';

export interface TableSplitInput {
  tenantId: string;
  reservationId: string;
  tableId: string;
  originalPartySize: number;
  actualArrivedPartySize: number;
  releasedBy: string;
  gracePeriodMinutes?: number;
  checkedInAt: number;
}

export interface TableSplitResult {
  applied: boolean;
  freedSeats: number;
  reason?: 'FULL_PARTY_ARRIVED' | 'GRACE_PERIOD_ACTIVE' | 'INVALID_STATE';
}

export class TableSplitService {
  static readonly DEFAULT_GRACE_PERIOD_MIN = 10;

  /**
   * Décide si un split doit être appliqué au vu du taux de présence partiel + grâce.
   * Pur — pas d'IO, testable unitairement.
   */
  static computeSplit(
    input: Pick<TableSplitInput, 'originalPartySize' | 'actualArrivedPartySize' | 'gracePeriodMinutes' | 'checkedInAt'>,
    nowMs: number,
  ): TableSplitResult {
    const grace = (input.gracePeriodMinutes ?? this.DEFAULT_GRACE_PERIOD_MIN) * 60 * 1000;

    if (input.actualArrivedPartySize <= 0 || input.originalPartySize <= 0) {
      return { applied: false, freedSeats: 0, reason: 'INVALID_STATE' };
    }

    if (input.actualArrivedPartySize >= input.originalPartySize) {
      return { applied: false, freedSeats: 0, reason: 'FULL_PARTY_ARRIVED' };
    }

    if (nowMs - input.checkedInAt < grace) {
      return { applied: false, freedSeats: 0, reason: 'GRACE_PERIOD_ACTIVE' };
    }

    return {
      applied: true,
      freedSeats: input.originalPartySize - input.actualArrivedPartySize,
    };
  }

  /**
   * Applique effectivement le split : Nexus + event bus.
   */
  static async releasePartial(input: TableSplitInput, nowMs: number = Date.now()): Promise<TableSplitResult> {
    const decision = this.computeSplit(input, nowMs);
    if (!decision.applied) return decision;

    const path = `tenants/${input.tenantId}/reservations/${input.reservationId}`;
    try {
      await Nexus.adapter.update(path, {
        partialCheckIn: {
          expected: input.originalPartySize,
          arrived: input.actualArrivedPartySize,
          releasedSeats: decision.freedSeats,
          releasedAt: nowMs,
          releasedBy: input.releasedBy,
        },
      } as never);
    } catch (err) {
      logger.warn(`[TableSplitService] Persist partial check-in failed`, err);
    }

    await NexusEventBus.emit('ops.table_split_released', {
      v: 1,
      tenantId: input.tenantId,
      reservationId: input.reservationId,
      tableId: input.tableId,
      originalPartySize: input.originalPartySize,
      actualArrivedPartySize: input.actualArrivedPartySize,
      freedSeats: decision.freedSeats,
      releasedAt: nowMs,
    });

    return decision;
  }
}
