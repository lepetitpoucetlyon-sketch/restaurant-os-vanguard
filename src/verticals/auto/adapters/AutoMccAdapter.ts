import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export const AutoMccAdapter = {
  emitHealthPing(payload: { tenantId: string; status: 'healthy' | 'degraded'; liftsOperational: number; activeWorkOrders: number }) {
    NexusEventBus.emit('mcc.health_ping', payload);
  },
};
