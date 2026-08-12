import { NexusEventBus } from '@orchestration/NexusEventBus';

export const AutoFacilityAdapter = {
  emitLiftMaintenanceRequired(payload: { tenantId: string; liftId: string; issue: string; dueDate: string }) {
    NexusEventBus.emitDurable('auto.lift_maintenance_required', payload);
  },
};
