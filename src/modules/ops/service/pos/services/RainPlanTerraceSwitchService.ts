import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { AuditLogger } from '@/modules/compliance';

export interface TerraceTableOccupant {
  tableNumber: string;
  orderId: string;
  covers: number;
  totalInMicrounits: number;
}

export interface RainPlanSwitchResult {
  activeTerraceTablesCount: number;
  reassignedToIndoorCount: number;
  packedTakeawayCount: number;
  executedAt: number;
}

/**
 * RainPlanTerraceSwitchService — Angle mort L50.
 * "Plan Pluie" en 1-clic : bascule automatique et coordonnée des tables de terrasse ouvertes vers la salle intérieure ou en commande à emporter sous emballages hermétiques.
 */
export class RainPlanTerraceSwitchService {
  static async executeRainPlan(
    tenantId: string,
    adminId: string,
    terraceTables: TerraceTableOccupant[],
    availableIndoorSeats: number
  ): Promise<RainPlanSwitchResult> {
    let indoorSeatsLeft = availableIndoorSeats;
    let reassignedToIndoorCount = 0;
    let packedTakeawayCount = 0;

    for (const t of terraceTables) {
      if (indoorSeatsLeft >= t.covers) {
        indoorSeatsLeft -= t.covers;
        reassignedToIndoorCount++;
      } else {
        packedTakeawayCount++;
      }
    }

    NexusEventBus.emit('ops.rain_plan_switch_executed', {
      v: 1,
      tenantId,
      activeTerraceTablesCount: terraceTables.length,
      reassignedToIndoorCount,
      packedTakeawayCount,
      executedAt: Date.now(),
    });

    await AuditLogger.logAction({
      adminId,
      action: 'RAIN_PLAN_SWITCH_ACTIVATED',
      targetId: `RAIN-PLAN-${tenantId}-${Date.now()}`,
      ipAddress: '127.0.0.1',
      metadata: {
        terraceTablesCount: terraceTables.length,
        reassignedToIndoorCount,
        packedTakeawayCount,
      },
    });

    return {
      activeTerraceTablesCount: terraceTables.length,
      reassignedToIndoorCount,
      packedTakeawayCount,
      executedAt: Date.now(),
    };
  }
}
