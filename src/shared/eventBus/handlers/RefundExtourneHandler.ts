import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { SharedKernel } from '@/lib/shared-kernel';

export function registerRefundExtourneHandler() {
  return NexusEventBus.on(
    'order.refunded',
    async (payload) => {
      const id = SharedKernel.generateId('PL');
      const data = {
        id,
        orderId: payload.orderId,
        amountInMicrounits: -payload.amountInMicrounits,
        method: payload.originalPaymentMode,
        type: 'refund',
        recordedAt: new Date().toISOString(),
        operatorId: payload.operatorId,
      };

      await Nexus.adapter.set(`tenants/${payload.tenantId}/paymentLedger/${id}`, data);
    },
    { id: 'refund-extourne-handler', priority: 'BACKGROUND' }
  );
}
