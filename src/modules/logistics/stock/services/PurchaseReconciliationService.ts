import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import type { CurrentStockItem } from './StockGoodsReceiptService';

export interface GoodsReceiptRecord {
  id: string;
  tenantId: string;
  supplierId: string;
  deliveryNoteNumber: string;
  status: 'received_provisional' | 'reconciled' | 'cancelled';
  receivedAt: string;
  businessDay?: string;
  lines: Array<{
    stockItemId: string;
    quantity: number;
    provisionalUnitPriceCts: number;
  }>;
  invoiceId?: string;
  reconciledAt?: string;
}

export interface InventoryVarianceRecord {
  id: string;
  tenantId: string;
  supplierId: string;
  invoiceId: string;
  receiptId: string;
  stockItemId: string;
  quantityReceived: number;
  provisionalPriceCts: number;
  actualPriceCts: number;
  varianceAmountCts: number; // Positif = surcoût, Négatif = économie
  createdAt: string;
}

export class PurchaseReconciliationService {
  /**
   * Réconcilie une facture fournisseur arrivée tardivement avec une réception de marchandises passée.
   * Calcule les écarts de prix, réajuste le PUMP et crée une écriture d'écart régularisée.
   */
  public static async reconcileInvoiceWithReceipt(params: {
    tenantId: string;
    supplierId: string;
    invoiceId: string;
    receiptId: string;
    invoiceLines: Array<{
      stockItemId: string;
      actualUnitPriceCts: number;
    }>;
    approvedBy?: string;
  }): Promise<{
    variances: InventoryVarianceRecord[];
    totalVarianceCts: number;
  }> {
    const { tenantId, supplierId, invoiceId, receiptId, invoiceLines, approvedBy } = params;

    const receiptPath = `tenants/${tenantId}/goodsReceipts/${receiptId}`;
    const receipt = await Nexus.adapter.get<GoodsReceiptRecord>(receiptPath);

    if (!receipt) {
      throw new Error(`[PurchaseReconciliation] Réception ${receiptId} introuvable pour le tenant ${tenantId}`);
    }

    const variances: InventoryVarianceRecord[] = [];
    let totalVarianceCts = 0;

    for (const invLine of invoiceLines) {
      const receiptLine = receipt.lines.find((l) => l.stockItemId === invLine.stockItemId);
      if (!receiptLine) continue;

      const provisionalPrice = receiptLine.provisionalUnitPriceCts;
      const actualPrice = invLine.actualUnitPriceCts;
      const priceDiffPerUnit = actualPrice - provisionalPrice;

      if (priceDiffPerUnit !== 0) {
        const lineVarianceCts = Math.round(priceDiffPerUnit * receiptLine.quantity);
        totalVarianceCts += lineVarianceCts;

        const varianceId = `var_${receiptId}_${invoiceId}_${invLine.stockItemId}`;
        const varianceRecord: InventoryVarianceRecord = {
          id: varianceId,
          tenantId,
          supplierId,
          invoiceId,
          receiptId,
          stockItemId: invLine.stockItemId,
          quantityReceived: receiptLine.quantity,
          provisionalPriceCts: provisionalPrice,
          actualPriceCts: actualPrice,
          varianceAmountCts: lineVarianceCts,
          createdAt: new Date().toISOString(),
        };

        // Sauvegarder la traçabilité de l'écart
        await Nexus.adapter.set(
          `tenants/${tenantId}/inventory_variances/${varianceId}`,
          varianceRecord
        );
        variances.push(varianceRecord);

        // Réajuster le PUMP du stockItem
        const stockPath = `tenants/${tenantId}/stockItems/${invLine.stockItemId}`;
        await Nexus.adapter.runTransaction(async (tx) => {
          const currentItem = await tx.get<CurrentStockItem>(stockPath);
          if (currentItem) {
            const currentQty = currentItem.currentQuantity || 1;
            // On intègre le différentiel d'écart au PUMP au prorata des quantités
            const adjustedPumpCts = Math.max(
              0,
              Math.round(currentItem.currentPumpCts + lineVarianceCts / currentQty)
            );

            tx.update(stockPath, {
              currentPumpCts: adjustedPumpCts,
              updatedAt: new Date().toISOString(),
            });
          }
        });

        await NexusEventBus.emitDurable('finance.purchase_variance_detected', {
          v: 1,
          tenantId,
          supplierId,
          invoiceId,
          receiptId,
          stockItemId: invLine.stockItemId,
          quantity: receiptLine.quantity,
          provisionalPriceCts: provisionalPrice,
          actualPriceCts: actualPrice,
          varianceAmountCts: lineVarianceCts,
          reconciledBy: approvedBy,
        });

        logger.info(
          `[PurchaseReconciliation] Écart détecté sur ${invLine.stockItemId} : diff=${priceDiffPerUnit}cts/u, total=${lineVarianceCts}cts`
        );
      }
    }

    // Marquer la réception comme réconciliée
    await Nexus.adapter.update(receiptPath, {
      status: 'reconciled',
      invoiceId,
      reconciledAt: new Date().toISOString(),
    });

    empireAudit.log({
      module: 'finance',
      action: 'PURCHASE_INVOICE_RECONCILED',
      details: {
        receiptId,
        invoiceId,
        variancesCount: variances.length,
        totalVarianceCts,
      },
      severity: variances.length > 0 ? 'medium' : 'low',
      timestamp: new Date(),
    });

    return { variances, totalVarianceCts };
  }
}
