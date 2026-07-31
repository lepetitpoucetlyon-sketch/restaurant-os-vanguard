import { NexusEventBus } from '../NexusEventBus';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/infrastructure/services/audit';

/**
 * HaccpCheckArchiverHandler (P03-E)
 * Réagit à 'haccp.check.saved'
 * et déclenche un archivage froid ou une analyse.
 */
export function registerHaccpCheckArchiverHandler(): () => void {
  return NexusEventBus.on(
    'haccp.check.saved',
    async (payload) => {
      logger.info(`[HaccpCheckArchiver] Nouveau relevé sauvegardé (Check: ${payload.checkId})`);

      // TODO: Logique pour envoyer vers Data Warehouse ou archive froide
      empireAudit.log({
        module: 'compliance',
        action: 'haccp_check_archived',
        details: {
          checkId: payload.checkId,
        },
        severity: 'low',
        timestamp: new Date(),
      });
    },
    { id: 'haccp-check-archiver-handler', priority: 'BACKGROUND' }
  );
}
