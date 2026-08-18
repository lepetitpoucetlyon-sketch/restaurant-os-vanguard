import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import {
  makeFinanceAdapter,
  makeMccAdapter,
  makeFacilityAdapter,
  makeCommerceAdapter,
  makeLogisticsAdapter,
  makeHumanAdapter,
  makeIntelligenceAdapter,
  makeComplianceAdapter,
} from '@/verticals/_shared/adapters';

export const FloristFinanceAdapter = makeFinanceAdapter();
export const FloristFacilityAdapter = makeFacilityAdapter();
export const FloristHumanAdapter = makeHumanAdapter();
export const FloristIntelligenceAdapter = makeIntelligenceAdapter();
export const FloristComplianceAdapter = makeComplianceAdapter();
export const FloristMccAdapter = makeMccAdapter<{ deliveriesToday?: number; freshStemsInStock?: number }>();

export const FloristCommerceAdapter = {
  ...makeCommerceAdapter(),
  emitOrderCustomArrangement(payload: { tenantId: string; orderId: string; customerId: string; flowers: string[] }) {
    NexusEventBus.emitDurable('florist.arrangement_created', payload);
  },
};

export const FloristLogisticsAdapter = {
  ...makeLogisticsAdapter(),
  emitPerishableStemLogged(payload: { tenantId: string; stemType: string; quantity: number; expiryDate: string }) {
    NexusEventBus.emitDurable('florist.perishable_stem_logged', payload);
  },
  emitDeliveryDispatched(payload: { tenantId: string; deliveryId: string; recipientAddress: string }) {
    NexusEventBus.emitDurable('florist.delivery_dispatched', payload);
  },
};

export const FloristOpsAdapter = {
  emitArrangementCreated(payload: { tenantId: string; arrangementId: string; recipeId: string; floristId: string }) {
    NexusEventBus.emitDurable('florist.arrangement_created', payload);
  },
};
