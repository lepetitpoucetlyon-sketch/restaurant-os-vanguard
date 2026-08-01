import { NexusEventBus } from '../NexusEventBus';
import { SharedKernel } from '@/lib/shared-kernel';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/infrastructure/services/audit';

export function registerAutoSupplierDraftHandler() {
  return NexusEventBus.on(
    'stock.low',
    async (payload) => {
      const { tenantId, itemId, currentQuantity, threshold } = payload;
      
      logger.info(`[Logistics] Seuil bas atteint pour ${itemId} (${currentQuantity} <= ${threshold}).`);
      
      const stockItem = await Nexus.adapter.get(`tenants/${tenantId}/stockItems/${itemId}`) as any;
      if (!stockItem || !stockItem.supplierId) return;

      const supplierId = stockItem.supplierId;

      // On cherche s'il existe déjà un brouillon pour ce fournisseur
      const existingDrafts = await Nexus.adapter.query(`tenants/${tenantId}/supplierOrders`, {
        where: [
          { field: 'supplierId', operator: '==', value: supplierId },
          { field: 'status', operator: '==', value: 'draft' },
        ],
      });

      let draftOrder: any = existingDrafts.length > 0 ? existingDrafts[0] : null;
      
      const qtyToOrder = Math.max(stockItem.idealStock || 0, threshold * 2) - currentQuantity;
      if (qtyToOrder <= 0) return;
      
      if (!draftOrder) {
        const orderId = SharedKernel.generateId('SUPPLIER_ORDER');
        draftOrder = {
          id: orderId,
          supplierId,
          status: 'draft',
          items: [{ itemId, quantity: qtyToOrder }],
          createdAt: new Date().toISOString(),
        };
        await Nexus.adapter.set(`tenants/${tenantId}/supplierOrders/${orderId}`, draftOrder);
        logger.info(`[Logistics] Nouveau brouillon fournisseur créé pour ${supplierId}`);
      } else {
        const itemIndex = draftOrder.items.findIndex((i: any) => i.itemId === itemId);
        if (itemIndex > -1) {
          draftOrder.items[itemIndex].quantity += qtyToOrder;
        } else {
          draftOrder.items.push({ itemId, quantity: qtyToOrder });
        }
        await Nexus.adapter.update(`tenants/${tenantId}/supplierOrders/${draftOrder.id}`, { items: draftOrder.items });
        logger.info(`[Logistics] Brouillon ${draftOrder.id} mis à jour avec ${itemId}`);
      }
      
      empireAudit.log({
        module: 'inventory',
        action: 'SUPPLIER_DRAFT_AUTO_UPDATED',
        details: { itemId, supplierId, qtyToOrder },
        severity: 'low',
        timestamp: new Date(),
      });
    },
    { id: 'auto-supplier-draft-handler', priority: 'BACKGROUND' }
  );
}
