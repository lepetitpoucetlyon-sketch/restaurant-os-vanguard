import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export const AutoHumanAdapter = {
  emitTechnicianAssigned(payload: { tenantId: string; technicianId: string; workOrderId: string; estimatedHours: number }) {
    NexusEventBus.emit('auto.technician_assigned', payload);
  },
};
