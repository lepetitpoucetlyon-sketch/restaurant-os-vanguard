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

export const GymFinanceAdapter = makeFinanceAdapter();
export const GymFacilityAdapter = makeFacilityAdapter();
export const GymLogisticsAdapter = makeLogisticsAdapter();
export const GymHumanAdapter = makeHumanAdapter();
export const GymIntelligenceAdapter = makeIntelligenceAdapter();
export const GymComplianceAdapter = makeComplianceAdapter();
export const GymMccAdapter = makeMccAdapter<{ activeMembers?: number; turnstileEntries?: number }>();

export const GymCommerceAdapter = {
  ...makeCommerceAdapter(),
  emitClassBooked(payload: { tenantId: string; classId: string; memberId: string; slot: string }) {
    NexusEventBus.emitDurable('gym.class_booked', payload);
  },
};

export const GymOpsAdapter = {
  emitTurnstileScanned(payload: { tenantId: string; memberId: string; accessGranted: boolean; turnstileId: string }) {
    NexusEventBus.emitDurable('gym.turnstile_scanned', payload);
  },
};
