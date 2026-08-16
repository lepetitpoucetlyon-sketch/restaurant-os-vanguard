import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { makeComplianceAdapter } from '@/verticals/_shared/adapters';

/** Conformité restaurant = socle universel + deltas HACCP, sonde température & rappel. */
export const RestaurantComplianceAdapter = {
  ...makeComplianceAdapter(),
  emitHaccpCheckSaved(payload: { tenantId: string; checkId: string; operatorId: string; timestamp: number }) {
    NexusEventBus.emitDurable('haccp.check.saved', { v: 1 as const, ...payload });
  },
  emitTemperatureAnomaly(payload: { tenantId: string; sensorId: string; temperature: number; durationInMinutes: number }) {
    NexusEventBus.emit('sensor.temperature_anomaly', { v: 1 as const, ...payload });
  },
  emitRecallDeclared(payload: { tenantId: string; recallId: string; productIds: string[]; reason: string }) {
    NexusEventBus.emitDurable('recall.declared', { v: 1 as const, ...payload });
  },
};
