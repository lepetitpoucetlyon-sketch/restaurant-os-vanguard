import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export const CustomMccAdapter = {
  emitHealthPing(payload: { tenantId: string; status: 'healthy' | 'degraded' }) {
    NexusEventBus.emit('mcc.health_ping', { ...payload });
  },
};
