import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';

const HISTORY_DAYS = 7;

export function registerMccHealthPingHandler() {
  return NexusEventBus.on(
    'mcc.health_ping',
    async (payload) => {
      const { tenantId, status, ...metrics } = payload;
      const now = new Date();
      const dateKey = now.toISOString().slice(0, 10); // YYYY-MM-DD

      const snapshot = { tenantId, status, metrics, updatedAt: now.toISOString() };

      // 1. État courant (lecture rapide FleetTab)
      await Nexus.adapter.set(`mcc/tenantHealth/${tenantId}`, snapshot);

      // 2. Historique 7 jours — 1 doc par jour (idempotent : écrase si même jour)
      await Nexus.adapter.set(`mcc/tenantHealth/${tenantId}/history/${dateKey}`, snapshot);

      // 3. Purge des entrées > 7 jours (best-effort)
      try {
        const cutoff = new Date(now.getTime() - HISTORY_DAYS * 86_400_000)
          .toISOString()
          .slice(0, 10);
        const old = await Nexus.adapter.query<{ id?: string; updatedAt?: string }>(
          `mcc/tenantHealth/${tenantId}/history`,
          { where: [{ field: 'updatedAt', operator: '<', value: cutoff + 'T00:00:00.000Z' }], limit: 20 },
        );
        if (old.length > 0) {
          const batch = Nexus.adapter.batch();
          for (const entry of old) {
            const key = entry.id ?? entry.updatedAt?.slice(0, 10);
            if (key) batch.delete(`mcc/tenantHealth/${tenantId}/history/${key}`);
          }
          await batch.commit();
        }
      } catch {
        // Non bloquant — la purge réessaiera au prochain ping
      }
    },
    { id: 'mcc-health-ping-handler', priority: 'BACKGROUND' }
  );
}
