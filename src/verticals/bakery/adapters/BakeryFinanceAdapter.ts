import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { makeFinanceAdapter } from '@/verticals/_shared/adapters';

/** Finance boulangerie = socle universel (ZReport/Refund/ServiceSealed) + alias métier emitSaleSealed. */
export const BakeryFinanceAdapter = {
  ...makeFinanceAdapter(),
  emitSaleSealed(payload: { tenantId: string; orderId: string; totalInMicrounits: number; operatorId: string }) {
    NexusEventBus.emitDurable('finance.order_sealed', payload);
  },
};
