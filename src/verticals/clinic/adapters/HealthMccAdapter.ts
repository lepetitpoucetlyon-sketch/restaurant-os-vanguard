import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export const HealthMccAdapter = {
  emitHealthPing(payload: { tenantId: string; status: 'healthy' | 'degraded'; hdsCompliant: boolean; bedsAvailable: number }) {
    NexusEventBus.emit('mcc.health_ping', payload);
  },
};
