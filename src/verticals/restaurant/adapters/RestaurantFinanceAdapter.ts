import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { makeFinanceAdapter } from '@/verticals/_shared/adapters';

/** Finance restaurant = socle universel (ZReport/Refund/ServiceSealed) + alias sceau commande. */
export const RestaurantFinanceAdapter = {
  ...makeFinanceAdapter(),
  emitOrderFiscalSeal(payload: { tenantId: string; orderId: string; totalInMicrounits: number; operatorId: string }) {
    NexusEventBus.emitDurable('finance.order_sealed', payload);
  },
};
