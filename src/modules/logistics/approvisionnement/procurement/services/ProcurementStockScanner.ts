import type { StockItem } from '../../../domain/schemas/inventory';
import type { RestockUrgency } from '../types';

export interface ScannedStockItem {
  stockItem: StockItem;
  currentQty: number;
  threshold: number;
  criticalThreshold: number;
  targetQuantity: number;
  missingQty: number;
  urgency: RestockUrgency;
}

export interface StockScanSummary {
  itemsToRestock: ScannedStockItem[];
  criticalCount: number;
  lowStockCount: number;
}

export class ProcurementStockScanner {
  /**
   * Scanne les articles en stock et filtre ceux se trouvant en sous-seuil.
   */
  public static scan(
    stockItems: StockItem[],
    targetSafetyFactor: number = 1.2
  ): StockScanSummary {
    const itemsToRestock: ScannedStockItem[] = [];
    let criticalCount = 0;
    let lowStockCount = 0;

    for (const item of stockItems) {
      const threshold = item.threshold ?? 5;
      const criticalThreshold = item.criticalThreshold ?? 2;
      const currentQty = item.quantityInStock ?? 0;

      if (currentQty > threshold) {
        continue;
      }

      const urgency: RestockUrgency = currentQty <= criticalThreshold ? 'CRITICAL' : 'LOW_STOCK';
      if (urgency === 'CRITICAL') {
        criticalCount++;
      } else {
        lowStockCount++;
      }

      const targetQuantity = Math.max(threshold * targetSafetyFactor, threshold + 1);
      const missingQty = Math.max(0, targetQuantity - currentQty);

      itemsToRestock.push({
        stockItem: item,
        currentQty,
        threshold,
        criticalThreshold,
        targetQuantity,
        missingQty,
        urgency,
      });
    }

    return {
      itemsToRestock,
      criticalCount,
      lowStockCount,
    };
  }
}
