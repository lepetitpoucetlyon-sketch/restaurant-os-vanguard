import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export const HealthFacilityAdapter = {
  emitEquipmentMaintenanceRequired(payload: { tenantId: string; equipmentId: string; type: string; dueDate: string; critical: boolean }) {
    NexusEventBus.emitDurable('health.equipment_maintenance_required', payload);
  },
};
