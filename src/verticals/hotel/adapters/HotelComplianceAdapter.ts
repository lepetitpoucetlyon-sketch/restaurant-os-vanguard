import { NexusEventBus } from '@orchestration/NexusEventBus';

export const HotelComplianceAdapter = {
  emitFireSafetyCheck(payload: { tenantId: string; checkId: string; result: 'ok' | 'nok'; floor: number }) {
    NexusEventBus.emitDurable('hotel.fire_safety_check', payload);
  },
};
