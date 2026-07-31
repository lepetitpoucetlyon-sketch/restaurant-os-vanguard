import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { SharedKernel } from '@/lib/shared-kernel';

export function registerPaymentLedgerHandler() {
  return NexusEventBus.on(
    'order.paid',
    async (payload) => {
      // Ignorer si ce n'est pas un paiement standard (géré par les autres handlers CQRS)
      if (payload.paymentMode === 'split' || payload.paymentMode === 'comp' || payload.totalInMicrounits < 0) {
        return;
      }

      const id = SharedKernel.generateId('PL');
      const data = {
        id,
        orderId: payload.orderId,
        amountInMicrounits: payload.totalInMicrounits,
        method: payload.paymentMode,
        type: 'standard',
        recordedAt: new Date().toISOString(),
        operatorId: payload.operatorId,
      };

      await Nexus.adapter.set(`tenants/${payload.tenantId}/paymentLedger/${id}`, data);
    },
    { id: 'payment-ledger-handler', priority: 'BACKGROUND' }
  );
}
