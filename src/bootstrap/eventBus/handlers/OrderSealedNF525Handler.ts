import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { FiscalSealer } from '@/modules/finance/fiscalite/FiscalSealer';
import { logger } from '@/lib/logger';

export function registerOrderSealedNF525Handler(): () => void {
  return NexusEventBus.on(
    'finance.order_sealed',
    async ({ tenantId, orderId, totalInMicrounits, operatorId }) => {
      try {
        const dataSnapshot = JSON.stringify({ orderId, totalInMicrounits, operatorId, sealedAt: new Date().toISOString() });
        await FiscalSealer.sealDataAtomically(dataSnapshot, tenantId, false, {
          id: `order-${orderId}`,
          type: 'SALE',
          orderId,
          totalInMicrounits,
          operatorId,
        });
        logger.info(`[OrderSealedNF525Handler] Order ${orderId} scellé NF525 pour tenant ${tenantId}`);
      } catch (err) {
        logger.error(`[OrderSealedNF525Handler] Échec scellement order ${orderId}`, err);
        throw err; // NF525 — scellement fiscal obligatoire → DLQ pour retry
      }
    },
    { id: 'order-sealed-nf525', priority: 'CRITICAL' }
  );
}
