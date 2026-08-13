import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { SharedKernel } from '@/lib/shared-kernel';
import { assertHandlerTenant } from '../guards/assertHandlerTenant';

export function registerCompEntryHandler() {
  return NexusEventBus.on(
    'order.comp',
    async (payload) => {
      const id = SharedKernel.generateId('PL');
      const data = {
        id,
        orderId: payload.orderId,
        amountInMicrounits: payload.totalValueInMicrounits,
        method: 'comp',
        type: 'comp',
        reason: payload.reason,
        recordedAt: new Date().toISOString(),
        operatorId: payload.operatorId,
      };

      const path = `tenants/${payload.tenantId}/paymentLedger/${id}`;
      assertHandlerTenant('comp-entry', payload.tenantId, path);
      await Nexus.adapter.set(path, data);
    },
    { id: 'comp-entry-handler', priority: 'BACKGROUND' }
  );
}
