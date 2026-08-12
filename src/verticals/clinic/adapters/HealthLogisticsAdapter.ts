import { NexusEventBus } from '@orchestration/NexusEventBus';

export const HealthLogisticsAdapter = {
  emitMedicationDispensed(payload: { tenantId: string; patientId: string; medicationId: string; quantity: number; dispensedBy: string }) {
    NexusEventBus.emitDurable('health.medication_dispensed', payload);
  },
  emitSupplyReorderNeeded(payload: { tenantId: string; supplyId: string; currentStock: number; reorderThreshold: number }) {
    NexusEventBus.emitDurable('health.supply_reorder_needed', payload);
  },
};
