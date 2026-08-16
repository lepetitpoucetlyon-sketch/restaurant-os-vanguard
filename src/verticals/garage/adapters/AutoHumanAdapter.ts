import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { makeHumanAdapter } from '@/verticals/_shared/adapters';

/** RH garage = socle universel (shift/heures sup) + delta affectation technicien. */
export const AutoHumanAdapter = {
  ...makeHumanAdapter(),
  emitTechnicianAssigned(payload: { tenantId: string; technicianId: string; workOrderId: string; estimatedHours: number }) {
    NexusEventBus.emit('auto.technician_assigned', payload);
  },
};
