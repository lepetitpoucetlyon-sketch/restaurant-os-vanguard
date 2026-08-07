import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

export function registerSalesDataReadyHandler(): () => void {
  return NexusEventBus.on(
    'analytics.sales_data_ready',
    async ({ tenantId, periodStart, periodEnd, totalInMicrounits, covers }) => {
      try {
        const snapshotId = `${periodStart}_${periodEnd}`;
        await Nexus.adapter.set(`tenants/${tenantId}/analytics/snapshots/${snapshotId}`, {
          periodStart,
          periodEnd,
          totalInMicrounits,
          covers,
          averageTicketInMicrounits: covers > 0 ? Math.round(totalInMicrounits / covers) : 0,
          recordedAt: new Date().toISOString(),
        });
        logger.info(`[SalesDataReadyHandler] Snapshot enregistré ${snapshotId} pour ${tenantId}`);
      } catch (err: unknown) {
        logger.error(`[SalesDataReadyHandler] Échec enregistrement snapshot: ${String(err)}`);
      }
    },
    { id: 'sales-data-ready', priority: 'BACKGROUND' },
  );
}
