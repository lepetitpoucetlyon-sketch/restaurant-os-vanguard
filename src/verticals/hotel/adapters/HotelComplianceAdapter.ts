import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { makeComplianceAdapter } from '@/verticals/_shared/adapters';

/** @wip vertical-forge — Échéance: 2026-11-01. Conformité hôtel = socle universel + delta contrôle sécurité incendie. */
export const HotelComplianceAdapter = {
  ...makeComplianceAdapter(),
  emitFireSafetyCheck(payload: { tenantId: string; checkId: string; result: 'ok' | 'nok'; floor: number }) {
    NexusEventBus.emitDurable('hotel.fire_safety_check', payload);
  },
};
