import { NexusEventBus } from '../NexusEventBus';
import { ProductAvailabilityService } from '@/domain/services/ProductAvailabilityService';

export function registerQuarantineActivatedHandler() {
  return NexusEventBus.on(
    'inventory.quarantine_activated',
    async (payload) => {
      for (const productId of payload.productIds) {
        await ProductAvailabilityService.flagUnavailable(
          payload.tenantId,
          productId,
          `HACCP Quarantine: ${payload.reason}`
        );
      }
    },
    { id: 'quarantine-activated-handler', priority: 'CRITICAL' }
  );
}
