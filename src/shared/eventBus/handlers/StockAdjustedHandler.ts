import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';
import { toError } from '@/lib/toError';

interface StockItemRecord {
  id: string;
  name?: string;
  minimumQuantity?: number;
  isPerishable?: boolean;
  dlcDate?: string;
}

export function registerStockAdjustedHandler(): () => void {
  return NexusEventBus.on(
    'inventory.stock_adjusted',
    async (payload) => {
      if (payload.isSimulation) return;
      const { tenantId, itemId, oldQuantity, newQuantity, reason, adjustedBy } = payload;

      logger.info(
        `[StockAdjustedHandler] Item ${itemId} ajusté de ${oldQuantity} → ${newQuantity} par ${adjustedBy} (${reason})`
      );

      try {
        const stockItem = await Nexus.adapter.get<StockItemRecord>(`tenants/${tenantId}/stockItems/${itemId}`);

        // Alerte si stock sous seuil minimum
        if (stockItem?.minimumQuantity !== undefined && newQuantity < stockItem.minimumQuantity) {
          await NexusEventBus.emitDurable('stock.low', {
            tenantId,
            itemId,
            itemName: stockItem.name ?? itemId,
            currentQuantity: newQuantity,
            threshold: stockItem.minimumQuantity,
          } as never);
          logger.warn(`[StockAdjustedHandler] Stock ${itemId} sous seuil minimum (${newQuantity}/${stockItem.minimumQuantity})`);
        }

        // Trace HACCP si article périssable
        if (stockItem?.isPerishable) {
          await Nexus.adapter.set(`tenants/${tenantId}/haccpLogs/stock_${itemId}_${Date.now()}`, {
            type: 'STOCK_ADJUSTMENT',
            itemId,
            itemName: stockItem.name ?? itemId,
            oldQuantity,
            newQuantity,
            reason,
            adjustedBy,
            dlcDate: stockItem.dlcDate,
            loggedAt: new Date().toISOString(),
          });
        }

        empireAudit.log({
          module: 'inventory',
          action: 'STOCK_ADJUSTED',
          instanceId: tenantId,
          details: { itemId, oldQuantity, newQuantity, reason, adjustedBy },
          severity: newQuantity <= 0 ? 'medium' : 'low',
          timestamp: new Date(),
        });
      } catch (err) {
        logger.error('[StockAdjustedHandler] Erreur traitement ajustement stock', toError(err).message);
      }
    },
    { id: 'stock-adjusted-handler', priority: 'BACKGROUND' }
  );
}
