import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { makeLogisticsAdapter } from '@/verticals/_shared/adapters';

/** Logistique clinique = socle universel (stock alert) + deltas médicaments & réappro. */
export const HealthLogisticsAdapter = {
  ...makeLogisticsAdapter(),
  emitMedicationDispensed(payload: { tenantId: string; patientId: string; medicationId: string; quantity: number; dispensedBy: string }) {
    NexusEventBus.emitDurable('health.medication_dispensed', payload);
  },
  emitSupplyReorderNeeded(payload: { tenantId: string; supplyId: string; currentStock: number; reorderThreshold: number }) {
    NexusEventBus.emitDurable('health.supply_reorder_needed', payload);
  },
};
