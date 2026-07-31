import { NexusEventBus } from '../NexusEventBus';
import { ProductAvailabilityService } from '@/domain/services/ProductAvailabilityService';

export function registerRecallPOSBlockerHandler() {
  return NexusEventBus.on(
    'recall.declared',
    async (payload) => {
      for (const productId of payload.productIds) {
        await ProductAvailabilityService.flagUnavailable(
          payload.tenantId,
          productId,
          `RAPPEL SANITAIRE: ${payload.reason}`
        );
      }
    },
    { id: 'recall-pos-blocker-handler', priority: 'CRITICAL' }
  );
}
