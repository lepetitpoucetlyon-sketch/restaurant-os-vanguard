import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { SharedKernel } from '@/lib/shared-kernel';

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

      await Nexus.adapter.set(`tenants/${payload.tenantId}/paymentLedger/${id}`, data);
    },
    { id: 'comp-entry-handler', priority: 'BACKGROUND' }
  );
}
