import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';

type StockItem = {
  quantity?: number;
  reorderThreshold?: number;
  name?: string;
};

export function registerStockAdjustedHandler(): () => void {
  return NexusEventBus.on(
    'inventory.stock_adjusted',
    async ({ tenantId, itemId, oldQuantity, newQuantity, reason, adjustedBy }) => {
      const path = `tenants/${tenantId}/stockItems/${itemId}`;
      const existing = await Nexus.adapter.get<StockItem>(path);

      await Nexus.adapter.update(path, {
        quantity: newQuantity,
        updatedAt: new Date().toISOString(),
      });

      const movementId = Nexus.adapter.generateId('stockMovements');
      await Nexus.adapter.set(`tenants/${tenantId}/stockMovements/${movementId}`, {
        id: movementId,
        type: 'adjustment',
        itemId,
        oldQuantity,
        newQuantity,
        delta: newQuantity - oldQuantity,
        reason,
        adjustedBy,
        createdAt: new Date().toISOString(),
      });

      const itemName = existing?.name ?? itemId;
      logger.info(`[StockAdjusted] ${itemName}: ${oldQuantity} → ${newQuantity} (${reason}) par ${adjustedBy}`);

      empireAudit.log({
        module: 'inventory',
        action: 'STOCK_ADJUSTED',
        details: { itemId, oldQuantity, newQuantity, reason, adjustedBy, movementId },
        severity: 'medium',
        timestamp: new Date(),
      });

      const threshold = existing?.reorderThreshold;
      if (threshold !== undefined && newQuantity <= threshold && oldQuantity > threshold) {
        await NexusEventBus.emitDurable('stock.low', {
          v: 1,
          tenantId,
          itemId,
          itemName,
          currentQuantity: newQuantity,
          threshold,
        });
      }

      if (newQuantity <= 0 && oldQuantity > 0) {
        await NexusEventBus.emitDurable('stock.zero', {
          v: 1,
          tenantId,
          itemId,
          itemName,
        });
      }

      await NexusEventBus.emitDurable('finance.food_cost_impacted', {
        v: 1,
        tenantId,
        reason: `stock_adjusted_${itemId}`,
        affectedItems: [itemId],
        impactDate: new Date().toISOString(),
      });
    },
    { id: 'stock-adjusted', priority: 'HIGH' }
  );
}
