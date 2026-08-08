import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';

export interface TakeoutSlot {
  slotIso: string; // e.g. "2026-08-09T12:10:00.000Z"
  ordersCount: number;
  maxCapacity: number;
  isAvailable: boolean;
}

/**
 * 📦 TakeoutSlotManager (Item 9.2)
 * Moteur de régulation des créneaux de retrait Click & Collect par tranche de 10 minutes.
 * Empêche la saturation du comptoir de vente à emporter aux heures de pointe.
 */
export class TakeoutSlotManager {
  static evaluateSlotAvailability(
    slotIso: string,
    currentOrdersCount: number,
    maxCapacityPerSlot: number = 8
  ): TakeoutSlot {
    const isAvailable = currentOrdersCount < maxCapacityPerSlot;

    if (!isAvailable) {
      logger.info(`[TakeoutSlotManager] Créneau ${slotIso} complet (${currentOrdersCount}/${maxCapacityPerSlot} commandes).`);
      empireAudit.log({
        module: 'ops',
        action: 'TAKEOUT_SLOT_CAPACITY_REACHED',
        details: { slotIso, currentOrdersCount, maxCapacityPerSlot },
        severity: 'low',
        timestamp: new Date(),
      });
    }

    return {
      slotIso,
      ordersCount: currentOrdersCount,
      maxCapacity: maxCapacityPerSlot,
      isAvailable,
    };
  }
}
