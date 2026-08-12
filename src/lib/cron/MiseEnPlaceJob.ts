import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@orchestration/NexusEventBus';
import { logger } from '@/lib/logger';
import { toError } from "@/lib/toError";

/**
 * MiseEnPlaceJob (P1-4.3)
 * Se déclenche quotidiennement à 16h00.
 * Récupère les réservations de J+1, calcule les quantités de pré-préparation (Mise en Place) pour la brigade
 * et émet `kds.prep_task_created`.
 */
interface ResaRecord {
  status: string;
  date: string;
  covers?: number;
}

export const MiseEnPlaceJob = {
  name: 'MiseEnPlaceJob',
  schedule: '0 16 * * *', // 16h00 chaque jour
  async runForTenant(tenantId: string): Promise<void> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    try {
      const reservations = await Nexus.adapter.query<ResaRecord>(`tenants/${tenantId}/reservations`);
      const tomorrowResas = reservations.filter((r: ResaRecord) => r.date === tomorrowStr && r.status !== 'cancelled');

      const expectedCovers = tomorrowResas.reduce((acc: number, r: ResaRecord) => acc + (r.covers ?? 2), 0);

      logger.info(`[MiseEnPlaceJob] Calcul de la mise en place J-1 pour tenant ${tenantId} (${expectedCovers} couverts prévus le ${tomorrowStr})`);

      await NexusEventBus.emitDurable('notification.urgent', {
        v: 1,
        tenantId,
        message: `Mise en place J-1 : ${expectedCovers} couverts prévus pour demain (${tomorrowStr}). Consulter les pré-préparations.`,
        roles: ['chef_cuisinier', 'manager'],
        priority: 'HIGH',
        metadata: { date: tomorrowStr, expectedCovers },
      });
    } catch (err) {
      logger.error(`[MiseEnPlaceJob] Échec du calcul de la mise en place pour tenant ${tenantId}`, toError(err).message);
    }
  },
};
