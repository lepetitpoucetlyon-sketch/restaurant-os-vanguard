import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/infrastructure/services/audit';

export function registerSupplierDeliveryReceivedHandler() {
  return NexusEventBus.on(
    'supplier.delivery_received',
    async (payload) => {
      const { tenantId, orderId } = payload;
      
      const order = await Nexus.adapter.get(`tenants/${tenantId}/supplierOrders/${orderId}`) as any;
      if (!order) return;
      
      logger.info(`[Logistics] Réception de la commande fournisseur ${orderId}. Mise à jour des stocks.`);
      
      await Nexus.adapter.runTransaction(async (transaction) => {
        for (const item of order.items) {
          const stockItem = await transaction.get(`tenants/${tenantId}/stockItems/${item.itemId}`) as any;
          if (stockItem) {
            // Incrémentation du stock
            const newQty = stockItem.quantity + item.quantity;
            
            // Recalcul du PRMP (Prix de Revient Moyen Pondéré)
            // prmp = ((oldQty * oldPrice) + (newQty * newPrice)) / (oldQty + newQty)
            const oldTotalValue = (stockItem.quantity || 0) * (stockItem.prmp || 0);
            const newDeliveryValue = (item.quantity || 0) * (item.unitPrice || stockItem.prmp || 0);
            const newPrmp = newQty > 0 ? (oldTotalValue + newDeliveryValue) / newQty : 0;
            
            transaction.update(`tenants/${tenantId}/stockItems/${item.itemId}`, {
              quantity: newQty,
              prmp: newPrmp,
              available: newQty > 0, // Réactiver si c'était à zéro
            });
          }
        }
        
        transaction.update(`tenants/${tenantId}/supplierOrders/${orderId}`, {
          status: 'received',
          receivedAt: new Date().toISOString(),
        });
      });
      
      empireAudit.log({
        module: 'inventory',
        action: 'SUPPLIER_DELIVERY_PROCESSED',
        details: { orderId },
        severity: 'low',
        timestamp: new Date(),
      });
    },
    { id: 'supplier-delivery-received-handler', priority: 'HIGH' }
  );
}
