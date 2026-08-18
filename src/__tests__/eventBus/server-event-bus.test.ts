import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dispatchServerEvent } from '@/shared/eventBus/ServerEventBus';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';

describe('V3-BUS-07: ServerEventBus Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('dispatches server event and auto-normalizes eventId', async () => {
    let receivedPayload: any;

    const unsubscribe = NexusEventBus.on(
      'order.placed',
      (payload) => {
        receivedPayload = payload;
      },
      { id: 'server-bus-test-handler' }
    );

    const payload: any = { orderId: 'ord_srv_123', tenantId: 'resto_srv' };
    await dispatchServerEvent('order.placed', payload);

    expect(receivedPayload).toBeDefined();
    expect(receivedPayload.orderId).toBe('ord_srv_123');
    expect(receivedPayload.eventId).toBeDefined();

    unsubscribe();
  });

  it('persists failed critical server events to Nexus DLQ collection', async () => {
    const setSpy = vi.spyOn(Nexus.adapter, 'set').mockResolvedValue(undefined as any);

    const unsubscribe = NexusEventBus.on(
      'stock.low',
      async () => {
        throw new Error('Database unreachable during server event');
      },
      { id: 'server-bus-failing-handler', priority: 'CRITICAL' }
    );

    const payload: any = { itemId: 'item_dlq_1', quantity: 5, tenantId: 'resto_dlq', eventId: 'evt_fail_1' };

    await expect(dispatchServerEvent('stock.low', payload)).rejects.toThrow(
      'Database unreachable during server event'
    );

    expect(setSpy).toHaveBeenCalledWith(
      expect.stringContaining('tenants/resto_dlq/dead_letter_events/dlq_evt_fail_1_'),
      expect.objectContaining({
        eventId: 'evt_fail_1',
        eventName: 'stock.low',
        error: 'Database unreachable during server event',
        status: 'pending_retry',
      })
    );

    unsubscribe();
  });
});
