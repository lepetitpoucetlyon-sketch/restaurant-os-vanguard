import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';
import { toError } from "@/lib/toError";

import { BusinessClock } from '@/kernel/time/BusinessClock';
import { IdempotencyGuard } from '../IdempotencyGuard';

/**
 * WasteDailyAggregatorHandler (P2-5.1)
 * Écoute `inventory.waste_logged`.
 * Agrége le montant total du gaspillage par jour dans `tenants/{tenantId}/wasteAggregates/{date}`.
 */
export function registerWasteDailyAggregatorHandler(): () => void {
  return NexusEventBus.on(
    'inventory.waste_logged',
    IdempotencyGuard.withIdempotencyGuard(
      'waste-daily-aggregator-handler',
      'inventory.waste_logged',
      async (payload) => {
        const { tenantId, wasteId, items, businessDay, occurredAt } = payload;
        const targetDay = businessDay ?? BusinessClock.resolveServiceDay(occurredAt ?? new Date().toISOString());
        const aggPath = `tenants/${tenantId}/wasteAggregates/${targetDay}`;

        try {
          await Nexus.adapter.runTransaction(async (transaction) => {
            const currentAgg = await transaction.get<{
              totalItemsCount?: number;
              count?: number;
              processedWasteIds?: string[];
            }>(aggPath);

            // Protection anti-rejeu au niveau données
            if (wasteId && currentAgg?.processedWasteIds?.includes(wasteId)) {
              logger.info(`[WasteDailyAggregatorHandler] wasteId ${wasteId} déjà agrégé pour ${targetDay}, skip.`);
              return;
            }

            const addedQty = items.reduce((acc, i) => acc + i.quantity, 0);
            const newCount = (currentAgg?.count ?? 0) + 1;
            const newTotalItems = (currentAgg?.totalItemsCount ?? 0) + addedQty;

            transaction.set(aggPath, {
              date: targetDay,
              totalItemsCount: newTotalItems,
              count: newCount,
              processedWasteIds: wasteId
                ? [...(currentAgg?.processedWasteIds ?? []), wasteId]
                : (currentAgg?.processedWasteIds ?? []),
              updatedAt: new Date().toISOString(),
            });
          });

          logger.info(`[WasteDailyAggregatorHandler] Gaspillage quotidien agrégé pour ${targetDay} (${items.length} article(s))`);

          empireAudit.log({
            module: 'inventory',
            action: 'WASTE_AGGREGATED',
            details: { wasteId, itemsCount: items.length, targetDay },
            severity: 'low',
            timestamp: new Date(),
          });
        } catch (err) {
          logger.error(`[WasteDailyAggregatorHandler] Échec agrégation gaspillage ${wasteId}`, toError(err).message);
        }
      }
    ),
    // `idempotent: false` = opt-out EXPLICITE de l'auto-emballage du bus (mutationEvents) :
    // idempotence déjà assurée par le `withIdempotencyGuard` manuel ci-dessus (+ dedup
    // niveau données via processedWasteIds). Sans false → double-emballage (audit 2026-09).
    { id: 'waste-daily-aggregator-handler', priority: 'BACKGROUND', idempotent: false }
  );
}
