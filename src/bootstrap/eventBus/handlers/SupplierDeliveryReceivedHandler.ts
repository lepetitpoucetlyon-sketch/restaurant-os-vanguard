import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';

/** Ligne de commande fournisseur */
interface SupplierOrderItem {
  itemId: string;
  quantity: number;
  unitPrice?: number;     // prix unitaire (microunits)
}
/** Commande fournisseur (forme Firestore) */
interface SupplierOrder {
  id: string;
  status: string;
  items: SupplierOrderItem[];
}
/** Article de stock avec PRMP */
interface StockRecord {
  quantity: number;
  prmp?: number;          // Prix de Revient Moyen Pondéré (microunits)
  available?: boolean;
}

export function registerSupplierDeliveryReceivedHandler() {
  return NexusEventBus.on(
    'supplier.delivery_received',
    async (payload) => {
      const { tenantId, orderId } = payload;
      
      const order = await Nexus.adapter.get<SupplierOrder>(`tenants/${tenantId}/supplierOrders/${orderId}`);
      if (!order) return;
      
      logger.info(`[Logistics] Réception de la commande fournisseur ${orderId}. Mise à jour des stocks.`);
      
      await Nexus.adapter.runTransaction(async (transaction) => {
        for (const item of order.items) {
          const stockItem = await transaction.get<StockRecord>(`tenants/${tenantId}/stockItems/${item.itemId}`);
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
