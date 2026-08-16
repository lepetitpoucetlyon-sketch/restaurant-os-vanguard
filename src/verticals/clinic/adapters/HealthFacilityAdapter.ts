import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { makeFacilityAdapter } from '@/verticals/_shared/adapters';

/** Facility clinique = socle universel + delta maintenance équipement médical. */
export const HealthFacilityAdapter = {
  ...makeFacilityAdapter(),
  emitEquipmentMaintenanceRequired(payload: { tenantId: string; equipmentId: string; type: string; dueDate: string; critical: boolean }) {
    NexusEventBus.emitDurable('health.equipment_maintenance_required', payload);
  },
};
