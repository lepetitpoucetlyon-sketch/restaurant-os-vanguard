import { NexusEventBus } from '@orchestration/NexusEventBus';

export const AutoOpsAdapter = {
  emitVehicleCheckedIn(payload: { tenantId: string; vehicleId: string; vin: string; customerId: string; mileage: number; checkedInAt: string }) {
    NexusEventBus.emitDurable('auto.vehicle_checked_in', payload);
  },
  emitDiagnosticCompleted(payload: { tenantId: string; vehicleId: string; workOrderId: string; faults: { code: string; severity: 'low' | 'medium' | 'critical' }[] }) {
    NexusEventBus.emitDurable('auto.diagnostic_completed', payload);
  },
  emitRepairStarted(payload: { tenantId: string; workOrderId: string; technicianId: string; startedAt: string }) {
    NexusEventBus.emit('auto.repair_started', payload);
  },
  emitVehicleReleased(payload: { tenantId: string; vehicleId: string; workOrderId: string; customerId: string; releasedAt: string }) {
    NexusEventBus.emitDurable('auto.vehicle_released', payload);
  },
};
