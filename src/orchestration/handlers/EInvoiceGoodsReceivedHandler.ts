import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';
import { assertHandlerTenant } from '../guards/assertHandlerTenant';

export function registerEInvoiceGoodsReceivedHandler() {
  return NexusEventBus.on(
    'einvoice.goods_received',
    async (payload) => {
      const { tenantId, invoiceId, deliveryNoteId, receivedBy, items, allAccepted } = payload;

      const dnPath = `tenants/${tenantId}/deliveryNotes/${deliveryNoteId}`;
      assertHandlerTenant('goods-received-dn', tenantId, dnPath);

      await Nexus.adapter.set(dnPath, {
        id: deliveryNoteId,
        invoiceId,
        receivedBy,
        receivedAt: new Date().toISOString(),
        items,
        allAccepted,
        status: allAccepted ? 'signed' : 'disputed',
      });

      const acceptedItems = items.filter(i => i.accepted);
      if (acceptedItems.length > 0) {
        await Promise.all(acceptedItems.map(async (item) => {
          const stockPath = `tenants/${tenantId}/stockItems/${item.productId}`;
          assertHandlerTenant('goods-received-stock', tenantId, stockPath);

          const existing = await Nexus.adapter.get<{ quantity?: number }>(stockPath);
          const currentQty = existing?.quantity ?? 0;

          await Nexus.adapter.set(stockPath, {
            ...(existing ?? {}),
            id: item.productId,
            quantity: currentQty + item.quantityReceived,
            lastReceivedAt: new Date().toISOString(),
            lastReceivedBy: receivedBy,
            updatedAt: new Date().toISOString(),
          }, { merge: true });

          const movementId = `mov_${deliveryNoteId}_${item.productId}`;
          const movPath = `tenants/${tenantId}/inventoryMovements/${movementId}`;
          assertHandlerTenant('goods-received-movement', tenantId, movPath);

          await Nexus.adapter.set(movPath, {
            id: movementId,
            type: 'reception',
            source: 'einvoice',
            invoiceId,
            deliveryNoteId,
            productId: item.productId,
            quantity: item.quantityReceived,
            recordedBy: receivedBy,
            recordedAt: new Date().toISOString(),
          });
        }));

        await NexusEventBus.emitDurable('stock.received', {
          v: 1,
          tenantId,
          deliveryId: deliveryNoteId,
          items: acceptedItems.map(i => ({
            itemId: i.productId,
            quantity: i.quantityReceived,
          })),
        });
      }

      const rejectedItems = items.filter(i => !i.accepted);
      if (rejectedItems.length > 0) {
        const receptionLogId = `reclog_${deliveryNoteId}_${Date.now()}`;
        const logPath = `tenants/${tenantId}/receptionLogs/${receptionLogId}`;
        assertHandlerTenant('goods-received-reclog', tenantId, logPath);

        await Nexus.adapter.set(logPath, {
          id: receptionLogId,
          invoiceId,
          deliveryNoteId,
          type: 'partial_rejection',
          rejectedItems: rejectedItems.map(i => ({
            productId: i.productId,
            quantityExpected: i.quantityExpected,
            quantityReceived: i.quantityReceived,
            reason: i.rejectionReason ?? 'Non conforme',
          })),
          recordedBy: receivedBy,
          recordedAt: new Date().toISOString(),
        });
      }

      await Nexus.adapter.update(`tenants/${tenantId}/inboundInvoices/${invoiceId}`, {
        linkedDeliveryNoteId: deliveryNoteId,
        threeWayMatchStatus: allAccepted ? 'matched' : 'discrepancy',
        updatedAt: new Date().toISOString(),
      });

      logger.info(
        `[GoodsReceived] BL ${deliveryNoteId} pour facture ${invoiceId} — ` +
        `${acceptedItems.length} accepté(s), ${rejectedItems.length} rejeté(s)`,
      );

      empireAudit.log({
        module: 'inventory',
        action: 'EINVOICE_GOODS_RECEIVED',
        details: {
          tenantId, invoiceId, deliveryNoteId, receivedBy,
          acceptedCount: acceptedItems.length,
          rejectedCount: rejectedItems.length,
        },
        severity: rejectedItems.length > 0 ? 'medium' : 'low',
        timestamp: new Date(),
      });
    },
    { id: 'einvoice-goods-received', priority: 'HIGH' },
  );
}
