import { NexusEventBus } from '../NexusEventBus';
import { closeTicketZForDay } from './TicketZHandler';
import { logger } from '@/lib/logger';

export function registerZReportCloseHandler(): () => void {
  return NexusEventBus.on(
    'finance.z_report_requested',
    async ({ tenantId, operatorId, requestedAt }) => {
      const date = requestedAt
        ? requestedAt.split('T')[0]
        : new Date().toISOString().split('T')[0];

      logger.info(
        `[ZReportClose] Clôture Z demandée par ${operatorId} pour ${tenantId} (${date})`
      );

      await closeTicketZForDay(tenantId, date);
    },
    { id: 'z-report-close', priority: 'HIGH' }
  );
}
