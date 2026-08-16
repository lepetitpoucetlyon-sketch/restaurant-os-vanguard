import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { makeFinanceAdapter } from '@/verticals/_shared/adapters';

/** Finance retail = socle universel (Refund/ZReport/ServiceSealed) + alias métier emitSaleSealed. */
export const RetailFinanceAdapter = {
  ...makeFinanceAdapter(),
  emitSaleSealed(payload: { tenantId: string; orderId: string; totalInMicrounits: number; operatorId: string }) {
    NexusEventBus.emitDurable('finance.order_sealed', payload);
  },
};
