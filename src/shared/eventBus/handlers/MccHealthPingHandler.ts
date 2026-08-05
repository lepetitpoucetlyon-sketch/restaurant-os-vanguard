import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';

export function registerMccHealthPingHandler() {
  return NexusEventBus.on(
    'mcc.health_ping',
    async (payload) => {
      const { tenantId, status, ...metrics } = payload;
      await Nexus.adapter.set(`mcc/tenantHealth/${tenantId}`, {
        tenantId,
        status,
        metrics,
        updatedAt: new Date().toISOString(),
      });
    },
    { id: 'mcc-health-ping-handler', priority: 'BACKGROUND' }
  );
}
