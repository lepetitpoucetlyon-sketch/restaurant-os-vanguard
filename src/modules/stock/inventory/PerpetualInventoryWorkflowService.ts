import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { AuditLogger } from '@/modules/compliance/securite/AuditLogger';

export interface InventoryCountItem {
  sku: string;
  name: string;
  expectedQuantity: number;
  countedQuantity: number;
  unitCostInMicrounits: number;
}

export interface InventoryReconciliationReport {
  category: string;
  itemsCount: number;
  totalVarianceInMicrounits: number; // Positif = boni de stock, Négatif = coulage / perte
  hasDiscrepancies: boolean;
  reconciledAt: number;
}

/**
 * PerpetualInventoryWorkflowService — Angle mort H5.
 * Inventaire tournant perpétuel par catégorie et valorisation comptable des écarts d'inventaire (perte / coulage / sur-stock).
 */
export class PerpetualInventoryWorkflowService {
  static async reconcileCategoryInventory(
    tenantId: string,
    adminId: string,
    category: string,
    items: InventoryCountItem[]
  ): Promise<InventoryReconciliationReport> {
    let totalVarianceInMicrounits = 0;
    let hasDiscrepancies = false;

    for (const item of items) {
      const varianceUnits = item.countedQuantity - item.expectedQuantity;
      const varianceValue = Math.round(varianceUnits * item.unitCostInMicrounits);
      totalVarianceInMicrounits += varianceValue;

      if (varianceUnits !== 0) {
        hasDiscrepancies = true;
      }
    }

    NexusEventBus.emit('stock.perpetual_inventory_reconciled', {
      v: 1,
      tenantId,
      category,
      countedItemsCount: items.length,
      totalVarianceInMicrounits,
      reconciledAt: Date.now(),
    });

    await AuditLogger.logAction({
      adminId,
      action: 'PERPETUAL_INVENTORY_VARIANCE_POSTED',
      targetId: `INV-${tenantId}-${category}-${Date.now()}`,
      ipAddress: '127.0.0.1',
      metadata: {
        category,
        totalVarianceInMicrounits,
        itemsCount: items.length,
      },
    });

    return {
      category,
      itemsCount: items.length,
      totalVarianceInMicrounits,
      hasDiscrepancies,
      reconciledAt: Date.now(),
    };
  }
}
