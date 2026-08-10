import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';
import { toError } from "@/lib/toError";

/**
 * WasteDailyAggregatorHandler (P2-5.1)
 * Écoute `inventory.waste_logged`.
 * Agrége le montant total du gaspillage par jour dans `tenants/{tenantId}/wasteAggregates/{date}`.
 */
export function registerWasteDailyAggregatorHandler(): () => void {
  return NexusEventBus.on(
    'inventory.waste_logged',
    async (payload) => {
      const { tenantId, wasteId, items } = payload;
      const todayStr = new Date().toISOString().split('T')[0];
      const aggPath = `tenants/${tenantId}/wasteAggregates/${todayStr}`;

      try {
        await Nexus.adapter.runTransaction(async (transaction) => {
          const currentAgg = await transaction.get<{ totalItemsCount?: number; count?: number }>(aggPath);
          const addedQty = items.reduce((acc, i) => acc + i.quantity, 0);
          const newCount = (currentAgg?.count ?? 0) + 1;
          const newTotalItems = (currentAgg?.totalItemsCount ?? 0) + addedQty;

          transaction.set(aggPath, {
            date: todayStr,
            totalItemsCount: newTotalItems,
            count: newCount,
            updatedAt: new Date().toISOString(),
          });
        });

        logger.info(`[WasteDailyAggregatorHandler] Gaspillage quotidien agrégé (${items.length} article(s) enregistrés)`);

        empireAudit.log({
          module: 'inventory',
          action: 'WASTE_AGGREGATED',
          details: { wasteId, itemsCount: items.length },
          severity: 'low',
          timestamp: new Date(),
        });
      } catch (err) {
        logger.error(`[WasteDailyAggregatorHandler] Échec agrégation gaspillage ${wasteId}`, toError(err).message);
        throw err;
      }
    },
    { id: 'waste-daily-aggregator-handler', priority: 'BACKGROUND' }
  );
}
