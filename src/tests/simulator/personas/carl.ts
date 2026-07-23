import { Nexus } from '@/lib/nexus/NexusAdapter';
import { runAct, type PersonaFn, type PersonaResult } from '../engine/PersonaTypes';

export const carlPersona: PersonaFn = async ({ tenantId, operatorId }): Promise<PersonaResult> => {
  const start = Date.now();
  const acts = [];
  let orderId = '';

  acts.push(await runAct('KDS: onSnapshot(orders) → receive ticket', 'KDS', async () => {
    const orders = await Nexus.adapter.query<{ id: string; status: string }>(
      `tenants/${tenantId}/orders`
    );
    const pending = orders.filter(o => o.status === 'pending');
    orderId = pending[0]?.id ?? '';
    return { pendingCount: pending.length, orderId };
  }));

  if (!orderId) {
    return {
      personaId: 'carl',
      tenantId,
      acts: [
        ...acts,
        {
          label: 'KDS: aucun ticket en attente',
          layer: 'KDS',
          success: false,
          durationMs: 0,
          error: 'No pending orders — Bob must run first',
        },
      ],
      durationMs: Date.now() - start,
      success: false,
      payload: {},
    };
  }

  acts.push(await runAct('KDS: markPreparing()', 'KDS', async () => {
    await Nexus.adapter.update(`tenants/${tenantId}/orders/${orderId}`, {
      status: 'preparing',
      operatorId,
      preparingAt: new Date().toISOString(),
    });
    return { orderId, status: 'preparing' };
  }));

  acts.push(await runAct('KDS: completeTicket() → ORDER_SERVED', 'KDS', async () => {
    await Nexus.adapter.update(`tenants/${tenantId}/orders/${orderId}`, {
      status: 'served',
      servedAt: new Date().toISOString(),
    });
    return { orderId, status: 'served' };
  }));

  const success = acts.every(a => a.success);
  const finalOrder = await Nexus.adapter.get(`tenants/${tenantId}/orders/${orderId}`);

  return {
    personaId: 'carl',
    tenantId,
    acts,
    durationMs: Date.now() - start,
    success,
    payload: { orderId, finalOrder: finalOrder as Record<string, unknown> },
  };
};
