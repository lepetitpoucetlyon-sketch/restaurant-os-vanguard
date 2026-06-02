import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';

/**
 * Déduit les stocks consommés lors d'un paiement validé.
 * S'appuie sur le lien product → stockItem via le champ linkedStockItemId.
 * Enregistré en HIGH (parallèle avec FinancialBridge).
 */
export function registerStockDeductionHandler(): () => void {
  return NexusEventBus.on(
    'order.paid',
    async ({ tenantId, items, orderId }) => {
      const deductions: Array<{ itemId: string; delta: number; name: string }> = [];

      for (const item of items) {
        // Résolution product → stockItem
        const product = await Nexus.adapter.get<{ linkedStockItemId?: string; quantity?: number; reorderThreshold?: number }>(
          `tenants/${tenantId}/products/${item.productId}`
        );
        if (!product?.linkedStockItemId) continue;

        deductions.push({
          itemId: product.linkedStockItemId,
          delta: item.quantity,
          name: item.name,
        });
      }

      if (deductions.length === 0) return;

      // Déductions en parallèle
      await Promise.allSettled(
        deductions.map(async ({ itemId, delta, name }) => {
          const path = `tenants/${tenantId}/stockItems/${itemId}`;
          const stockItem = await Nexus.adapter.get<{ quantity?: number; reorderThreshold?: number }>(path);
          if (!stockItem) return;

          const newQty = Math.max(0, (stockItem.quantity ?? 0) - delta);
          await Nexus.adapter.update(path, {
            quantity: newQty,
            updatedAt: new Date().toISOString(),
          });

          logger.info(`[StockDeduction] ${name} ×${delta} → stock ${newQty}`);

          // Alerte seuil bas
          if (stockItem.reorderThreshold && newQty <= stockItem.reorderThreshold) {
            await NexusEventBus.emit('stock.low', {
              tenantId,
              itemId,
              itemName: name,
              currentQuantity: newQty,
              threshold: stockItem.reorderThreshold,
            });
          }
        })
      );

      empireAudit.log({
        module: 'inventory',
        action: 'STOCK_DEDUCTED',
        details: { orderId, deductions: deductions.map(d => d.name) },
        severity: 'low',
        timestamp: new Date(),
      });
    },
    { id: 'stock-deduction', priority: 'HIGH' }
  );
}
