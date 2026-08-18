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

export const CoworkingFinanceAdapter = makeFinanceAdapter();
export const CoworkingFacilityAdapter = makeFacilityAdapter();
export const CoworkingLogisticsAdapter = makeLogisticsAdapter();
export const CoworkingHumanAdapter = makeHumanAdapter();
export const CoworkingIntelligenceAdapter = makeIntelligenceAdapter();
export const CoworkingComplianceAdapter = makeComplianceAdapter();
export const CoworkingMccAdapter = makeMccAdapter<{ occupiedDesks?: number; meetingRoomBookings?: number }>();

export const CoworkingCommerceAdapter = {
  ...makeCommerceAdapter(),
  emitMeetingRoomBooked(payload: { tenantId: string; roomId: string; companyId: string; hours: number }) {
    NexusEventBus.emitDurable('coworking.meeting_room_booked', payload);
  },
};

export const CoworkingOpsAdapter = {
  emitDeskCheckedIn(payload: { tenantId: string; deskId: string; memberId: string; checkedInAt: string }) {
    NexusEventBus.emitDurable('coworking.desk_checked_in', payload);
  },
};
