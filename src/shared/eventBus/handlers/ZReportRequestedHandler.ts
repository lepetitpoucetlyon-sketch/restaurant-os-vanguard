import { NexusEventBus } from '../NexusEventBus';
import { logger } from '@/lib/logger';
import { toError } from '@/lib/toError';

/**
 * Déclenche la clôture du Ticket Z quand le cron ZReportAutoJob émet
 * `finance.z_report_requested`. Délègue à closeTicketZForDay (importé
 * dynamiquement pour éviter les cycles TicketZHandler → ZReportRequestedHandler).
 */
export function registerZReportRequestedHandler(): () => void {
  return NexusEventBus.on(
    'finance.z_report_requested',
    async (payload) => {
      const { tenantId, requestedAt } = payload;
      const date = requestedAt.split('T')[0];
      logger.info(`[ZReportRequestedHandler] Clôture Z demandée pour ${tenantId} — date ${date}`);
      try {
        const { closeTicketZForDay } = await import('./TicketZHandler');
        await closeTicketZForDay(tenantId, date);
      } catch (err) {
        logger.error(`[ZReportRequestedHandler] Erreur clôture Z pour ${tenantId}/${date}`, toError(err).message);
      }
    },
    { id: 'z-report-requested-handler', priority: 'HIGH' }
  );
}
