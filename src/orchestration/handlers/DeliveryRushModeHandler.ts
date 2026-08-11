/* eslint-disable no-restricted-imports -- tolerated structural inversion */
import { NexusEventBus } from '../NexusEventBus';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { AggregatorMappingService } from '@/modules/commerce';

export function registerDeliveryRushModeHandler() {
  return NexusEventBus.on(
    'store.rush_mode_toggled',
    async (payload) => {
      const { tenantId, isPaused, requestedBy } = payload;
      
      logger.info(`[DeliveryRushMode] Le tenant ${tenantId} a basculé le mode Rush (Pause=${isPaused}) par ${requestedBy}.`);

      const activeIntegrations = await AggregatorMappingService.getActiveAdapters(tenantId);
      let successCount = 0;

      for (const { adapter } of activeIntegrations) {
          let success = false;
          if (isPaused) {
              success = await adapter.suspendStore(tenantId);
          } else {
              success = await adapter.resumeStore(tenantId);
          }
          if (success) successCount++;
      }
      
      empireAudit.log({
        module: 'ops',
        action: 'DELIVERY_RUSH_MODE_TOGGLED',
        details: { isPaused, requestedBy, successCount },
        severity: 'high',
        timestamp: new Date(),
      });
    },
    { id: 'delivery-rush-mode', priority: 'HIGH' }
  );
}
