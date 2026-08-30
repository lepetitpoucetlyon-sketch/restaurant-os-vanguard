import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { SharedKernel } from '@/lib/shared-kernel';

export function registerSplitPaymentHandler() {
  return NexusEventBus.on(
    'order.split',
    async (payload) => {
      const records = payload.payments.map((p) => {
        const id = SharedKernel.generateId('PL');
        return {
          id,
          orderId: payload.orderId,
          amountInMicrounits: p.amountInMicrounits,
          method: p.method,
          guest: p.guest,
          type: 'split',
          recordedAt: new Date().toISOString(),
          operatorId: payload.operatorId,
        };
      });

      // Simulation of a batch write for simplicity (in a real app, use transaction/batch if available)
      for (const data of records) {
        await Nexus.adapter.set(`tenants/${payload.tenantId}/paymentLedger/${data.id}`, data);
      }
    },
    { id: 'split-payment-handler', priority: 'BACKGROUND' }
  );
}
