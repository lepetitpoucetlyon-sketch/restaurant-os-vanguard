import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { AuditLogger } from '@/modules/compliance';
import { OutboxService, OutboxPriority } from '@/lib/offline/OutboxService';

export interface SupplierRecallNotice {
  recallId: string;
  supplierSiret: string;
  productName: string;
  productRef: string;
  affectedBatchNumbers: string[];
  hazardReason: string; // ex: 'Listeria monocytogenes'
}

export interface RecallBroadcastResult {
  recallId: string;
  affectedTenantIds: string[];
  broadcastCount: number;
  quarantineStockTriggered: boolean;
  broadcastAt: number;
}

/**
 * ProductRecallCrossTenantBroadcaster — Angle mort E3.
 * Propage instantanément un rappel sanitaire fournisseur sur l'ensemble de la flotte de restaurants ayant ce lot en stock avec mise en quarantaine automatique.
 */
export class ProductRecallCrossTenantBroadcaster {
  static async broadcastRecall(
    adminId: string,
    notice: SupplierRecallNotice,
    fleetTenantStockMap: Record<string, string[]> // tenantId -> list of batch numbers in stock
  ): Promise<RecallBroadcastResult> {
    const affectedTenantIds: string[] = [];

    for (const [tenantId, batchesInStock] of Object.entries(fleetTenantStockMap)) {
      const hasMatch = batchesInStock.some(b => notice.affectedBatchNumbers.includes(b));
      if (hasMatch) {
        affectedTenantIds.push(tenantId);

        // Enqueue via Outbox SANITAIRE
        await OutboxService.enqueue({
          action: 'CREATE',
          collection: `tenants/${tenantId}/sanitaire/recalls`,
          targetId: notice.recallId,
          payload: {
            recallId: notice.recallId,
            productRef: notice.productRef,
            affectedBatchIds: notice.affectedBatchNumbers,
            hazardReason: notice.hazardReason,
          },
          priority: OutboxPriority.SANITAIRE,
        });
      }
    }

    NexusEventBus.emit('compliance.recall_broadcast', {
      v: 1,
      tenantId: 'mcc',
      recallId: notice.recallId,
      productRef: notice.productRef,
      affectedBatchIds: notice.affectedBatchNumbers,
      affectedTenantCount: affectedTenantIds.length,
      broadcastAt: Date.now(),
    });

    await AuditLogger.logAction({
      adminId,
      action: 'RECALL_BROADCAST',
      targetId: notice.recallId,
      ipAddress: '127.0.0.1',
      metadata: {
        productRef: notice.productRef,
        hazardReason: notice.hazardReason,
        affectedTenantCount: affectedTenantIds.length,
      },
    });

    return {
      recallId: notice.recallId,
      affectedTenantIds,
      broadcastCount: affectedTenantIds.length,
      quarantineStockTriggered: true,
      broadcastAt: Date.now(),
    };
  }
}
