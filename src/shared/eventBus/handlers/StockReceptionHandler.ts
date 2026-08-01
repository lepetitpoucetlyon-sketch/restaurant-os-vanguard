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
      const { tenantId, deliveryId, purchaseOrderId, items } = payload;
      
      let purchaseOrder: any = null;
      if (purchaseOrderId) {
        purchaseOrder = await Nexus.adapter.get(`tenants/${tenantId}/purchaseOrders/${purchaseOrderId}`);
      }

      const driftReport: { itemId: string; expected: number; received: number; diff: number }[] = [];

      for (const item of items) {
        // ... (update stock logic)
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

        // Calcul écart si BC existe
        if (purchaseOrder && purchaseOrder.items) {
          const expectedItem = purchaseOrder.items.find((i: any) => i.itemId === item.itemId);
          const expectedQty = expectedItem ? expectedItem.quantity : 0;
          if (expectedQty !== item.quantity) {
            driftReport.push({
              itemId: item.itemId,
              expected: expectedQty,
              received: item.quantity,
              diff: item.quantity - expectedQty
            });
          }
        }

        logger.info(`[StockReception] Article ${item.itemId} +${item.quantity} → nouveau stock ${newQty} (BL: ${deliveryId})`);

        empireAudit.log({
          module: 'inventory',
          action: 'STOCK_RECEIVED',
          details: { itemId: item.itemId, deliveryId, added: item.quantity, newQty },
          severity: 'low',
          timestamp: new Date(),
        });
      }

      if (driftReport.length > 0) {
        const driftId = `drift_${deliveryId}_${Date.now()}`;
        await Nexus.adapter.set(`tenants/${tenantId}/inventoryDrifts/${driftId}`, {
          id: driftId,
          deliveryId,
          purchaseOrderId,
          drifts: driftReport,
          createdAt: Date.now()
        });
        logger.warn(`[StockReception] Écart détecté pour BL ${deliveryId}. Report sauvegardé: ${driftId}`);
        empireAudit.log({
          module: 'inventory',
          action: 'INVENTORY_DRIFT_DETECTED',
          details: { deliveryId, purchaseOrderId, driftCount: driftReport.length },
          severity: 'medium',
          timestamp: new Date(),
        });
      }
    },
    { id: 'stock-reception', priority: 'HIGH' }
  );
}
