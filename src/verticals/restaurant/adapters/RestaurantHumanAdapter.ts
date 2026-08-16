import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { makeHumanAdapter } from '@/verticals/_shared/adapters';

/** RH restaurant = socle universel (shift/heures sup) + delta répartition pourboires. */
export const RestaurantHumanAdapter = {
  ...makeHumanAdapter(),
  emitTipDistributed(payload: { tenantId: string; orderId: string; tipInMicrounits: number; staffIds: string[] }) {
    NexusEventBus.emit('hr.tip_distributed', payload);
  },
};
