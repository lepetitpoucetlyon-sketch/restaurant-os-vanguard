import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';
import { toError } from "@/lib/toError";

/**
 * DailyDigestHandler (P0-2.5)
 * Écoute `finance.daily_audit`.
 * Persiste le rapport quotidien du directeur et envoie une alerte de synthèse d'exploitation.
 */
export function registerDailyDigestHandler(): () => void {
  return NexusEventBus.on(
    'finance.daily_audit',
    async (payload) => {
      const { tenantId, date } = payload;

      try {
        const digestPath = `tenants/${tenantId}/dailyDigests/${date}`;
        await Nexus.adapter.set(digestPath, {
          date,
          generatedAt: new Date().toISOString(),
          status: 'generated',
        });

        logger.info(`[DailyDigestHandler] Digest quotidien ${date} enregistré pour tenant ${tenantId}`);

        await NexusEventBus.emitDurable('notification.urgent', {
          v: 1,
          tenantId,
          message: `Rapport quotidien d'exploitation du ${date} généré et disponible.`,
          roles: ['directeur', 'admin'],
          priority: 'HIGH',
          metadata: { date },
        });

        empireAudit.log({
          module: 'finance',
          action: 'DAILY_DIGEST_GENERATED',
          details: { date },
          severity: 'low',
          timestamp: new Date(),
        });
      } catch (err) {
        logger.error(`[DailyDigestHandler] Échec enregistrement digest quotidien ${date}`, toError(err).message);
        throw err;
      }
    },
    { id: 'daily-digest-handler', priority: 'HIGH' }
  );
}
