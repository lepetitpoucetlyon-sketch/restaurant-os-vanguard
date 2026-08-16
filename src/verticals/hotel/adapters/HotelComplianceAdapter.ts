import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { makeComplianceAdapter } from '@/verticals/_shared/adapters';

/** Conformité hôtel = socle universel + delta contrôle sécurité incendie. */
export const HotelComplianceAdapter = {
  ...makeComplianceAdapter(),
  emitFireSafetyCheck(payload: { tenantId: string; checkId: string; result: 'ok' | 'nok'; floor: number }) {
    NexusEventBus.emitDurable('hotel.fire_safety_check', payload);
  },
};
