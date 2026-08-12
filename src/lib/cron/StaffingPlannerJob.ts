import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@orchestration/NexusEventBus';
import { logger } from '@/lib/logger';
import { toError } from "@/lib/toError";

/**
 * StaffingPlannerJob (P1-4.10)
 * Se déclenche quotidiennement à 17h00.
 * Compare le volume de réservations de J+1 avec l'effectif planifié (ratio: 1 serveur / 20 couverts).
 * Alerte en cas de sous-effectif prévisible.
 */
interface ResaRecord { status: string; date: string; covers?: number }
interface ShiftRecord { status: string; date?: string }

export const StaffingPlannerJob = {
  name: 'StaffingPlannerJob',
  schedule: '0 17 * * *', // 17h00 chaque jour
  async runForTenant(tenantId: string): Promise<void> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    try {
      const resas = await Nexus.adapter.query<ResaRecord>(`tenants/${tenantId}/reservations`);
      const tomorrowResas = resas.filter((r: ResaRecord) => r.date === tomorrowStr && r.status !== 'cancelled');
      const expectedCovers = tomorrowResas.reduce((acc: number, r: ResaRecord) => acc + (r.covers ?? 2), 0);

      const shifts = await Nexus.adapter.query<ShiftRecord>(`tenants/${tenantId}/shifts`);
      const tomorrowShifts = shifts.filter((s: ShiftRecord) => s.status === 'published');

      // Ratio recommandé: 1 serveur pour 20 couverts
      const requiredStaff = Math.ceil(expectedCovers / 20);
      const scheduledStaff = tomorrowShifts.length;

      if (expectedCovers > 0 && scheduledStaff < requiredStaff) {
        logger.warn(`[StaffingPlannerJob] Sous-effectif prévisible pour demain (${tomorrowStr}): ${expectedCovers} couverts, ${scheduledStaff} employés planifiés vs ${requiredStaff} requis.`);

        await NexusEventBus.emitDurable('notification.urgent', {
          v: 1,
          tenantId,
          message: `Alerte Planning Demain (${tomorrowStr}) : ${expectedCovers} couverts prévus mais seulement ${scheduledStaff} employé(s) planifié(s) (Recommandé: ${requiredStaff}).`,
          roles: ['manager', 'directeur'],
          priority: 'HIGH',
          metadata: { date: tomorrowStr, expectedCovers, scheduledStaff, requiredStaff },
        });
      }
    } catch (err) {
      logger.error(`[StaffingPlannerJob] Échec de l'analyse planning pour tenant ${tenantId}`, toError(err).message);
    }
  },
};
