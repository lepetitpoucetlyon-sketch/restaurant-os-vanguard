import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export const BakeryComplianceAdapter = {
  emitAllergenDeclared(payload: { tenantId: string; productId: string; allergens: string[]; updatedAt: string }) {
    NexusEventBus.emitDurable('bakery.allergen_declared', payload);
  },
  emitOvenTempAlert(payload: { tenantId: string; sensorId: string; temperature: number; durationInMinutes: number }) {
    NexusEventBus.emit('sensor.temperature_anomaly', { v: 1 as const, ...payload });
  },
  emitHaccpCheck(payload: { tenantId: string; checkId: string; operatorId: string; timestamp: number }) {
    NexusEventBus.emitDurable('haccp.check.saved', { v: 1 as const, ...payload });
  },
};
