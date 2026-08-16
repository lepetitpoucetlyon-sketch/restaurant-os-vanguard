import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { makeFacilityAdapter } from '@/verticals/_shared/adapters';

/** Facility garage = socle universel + delta maintenance pont élévateur. */
export const AutoFacilityAdapter = {
  ...makeFacilityAdapter(),
  emitLiftMaintenanceRequired(payload: { tenantId: string; liftId: string; issue: string; dueDate: string }) {
    NexusEventBus.emitDurable('auto.lift_maintenance_required', payload);
  },
};
