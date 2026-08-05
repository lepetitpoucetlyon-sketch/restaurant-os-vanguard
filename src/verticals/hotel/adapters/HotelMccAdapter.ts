import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export const HotelMccAdapter = {
  emitHealthPing(payload: { tenantId: string; status: 'healthy' | 'degraded'; pmsOnline: boolean; occupancy: number }) {
    NexusEventBus.emit('mcc.health_ping', payload);
  },
};
