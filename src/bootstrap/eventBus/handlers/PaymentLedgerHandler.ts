import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';

export function registerPaymentLedgerHandler() {
  return NexusEventBus.on(
    'order.paid',
    async (payload) => {
      const { orderId, tenantId, paymentMode, totalInMicrounits, splits } = payload;
      
      const payments = splits?.length 
        ? splits 
        : [{ amount: totalInMicrounits, mode: paymentMode }];

      // Enregistrer le détail du paiement dans la ledger de caisse
      for (const [index, split] of payments.entries()) {
        const entryId = splits?.length ? `${orderId}_split_${index}` : orderId;
        await Nexus.adapter.set(`tenants/${tenantId}/paymentLedger/${entryId}`, {
          mode: split.mode,
          amountInMicrounits: split.amount,
          recordedAt: new Date().toISOString(),
          orderId,
          isSplit: !!splits?.length
        });
      }
    },
    { id: 'payment-ledger-handler', priority: 'BACKGROUND' }
  );
}
