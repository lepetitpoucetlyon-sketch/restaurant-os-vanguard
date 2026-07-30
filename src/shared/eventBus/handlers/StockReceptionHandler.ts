import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/infrastructure/services/audit';

/**
 * StockReceptionHandler (P1)
 * Consomme l'événement 'stock.received' (émis par ProcurementBridge lors de la signature du BL)
 * et met à jour le stock physique de chaque article livré.
 */
export function registerStockReceptionHandler(): () => void {
  return NexusEventBus.on(
    'stock.received',
    async (payload) => {
      const { tenantId, deliveryId, items } = payload;
      
      for (const item of items) {
        const stockPath = `tenants/${tenantId}/stockItems/${item.itemId}`;
        const existing = await Nexus.adapter.get<{ quantity?: number; name?: string }>(stockPath);
        const currentQty = existing?.quantity ?? 0;
        const newQty = currentQty + item.quantity;

        await Nexus.adapter.set(stockPath, {
          ...existing, // préserver les autres attributs s'ils existent (P1 n'écrase pas)
          id: item.itemId,
          quantity: newQty,
          updatedAt: new Date().toISOString(),
          lastDeliveryNoteId: deliveryId,
        });

        logger.info(`[StockReception] Article ${item.itemId} +${item.quantity} → nouveau stock ${newQty} (BL: ${deliveryId})`);

        empireAudit.log({
          module: 'inventory',
          action: 'STOCK_RECEIVED',
          details: { itemId: item.itemId, deliveryId, added: item.quantity, newQty },
          severity: 'low',
          timestamp: new Date(),
        });
      }
    },
    { id: 'stock-reception', priority: 'HIGH' }
  );
}
