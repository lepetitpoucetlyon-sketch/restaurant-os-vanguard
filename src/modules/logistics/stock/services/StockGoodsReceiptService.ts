/**
 * StockGoodsReceiptService.ts
 * 
 * Moteur d'entrée en stock lors de la validation des réceptions de livraison.
 * Invariants :
 * - Calcul du PUMP (Prix Unitaire Moyen Pondéré) en microunités / centimes entiers (zéro flottant).
 * - Traçabilité obligatoire du numéro de lot et de la DLC (HACCP).
 */

export interface CurrentStockItem {
  id: string;
  tenantId: string;
  ingredientId: string;
  ingredientName: string;
  currentQuantity: number;       // En unité de base (ex: kg, L, unités)
  currentPumpCts: number;         // Prix Unitaire Moyen Pondéré actuel en centimes
  storageLocationId?: string;
}

export interface ReceivedGoodsLine {
  ingredientId: string;
  ingredientName: string;
  packagesCount: number;
  conversionFactorToBaseUnit: number; // Ex: 10 pour un carton de 10kg
  unitPriceHtCts: number;             // Prix d'achat unitaire HT ramené à l'unité de base en centimes
  batchNumber: string;                // N° de lot fournisseur
  expiryDateUtc: number;              // Date Limite de Consommation (DLC) en millisecondes UTC
}

export interface StockMovementRecord {
  id: string;
  tenantId: string;
  ingredientId: string;
  type: 'GOODS_RECEIPT';
  quantityDelta: number;
  previousQuantity: number;
  newQuantity: number;
  previousPumpCts: number;
  newPumpCts: number;
  purchasePriceCts: number;
  batchNumber: string;
  expiryDateUtc: number;
  deliveryNoteNumber: string;
  supplierId: string;
  createdAt: number;
}

export interface GoodsReceiptResult {
  updatedStockItems: CurrentStockItem[];
  movements: StockMovementRecord[];
  totalValueAddedCts: number;
}

export class StockGoodsReceiptService {
  /**
   * Intègre les marchandises reçues dans le stock réel et recalcule le PUMP.
   */
  public static processGoodsReceipt(params: {
    tenantId: string;
    supplierId: string;
    deliveryNoteNumber: string;
    currentStockMap: Map<string, CurrentStockItem>;
    receivedLines: ReceivedGoodsLine[];
    nowUtc?: number;
  }): GoodsReceiptResult {
    const now = params.nowUtc ?? Date.now();
    const updatedStockItems: CurrentStockItem[] = [];
    const movements: StockMovementRecord[] = [];
    let totalValueAddedCts = 0;

    for (const line of params.receivedLines) {
      const deliveredQty = line.packagesCount * line.conversionFactorToBaseUnit;
      if (deliveredQty <= 0) continue;

      const currentItem = params.currentStockMap.get(line.ingredientId) || {
        id: `stock_${params.tenantId}_${line.ingredientId}`,
        tenantId: params.tenantId,
        ingredientId: line.ingredientId,
        ingredientName: line.ingredientName,
        currentQuantity: 0,
        currentPumpCts: line.unitPriceHtCts,
      };

      const prevQty = currentItem.currentQuantity;
      const prevPump = currentItem.currentPumpCts;
      const newQty = prevQty + deliveredQty;

      // Calcul PUMP en centimes entiers : ((Ancienne Valeur) + (Nouvelle Valeur d'Achat)) / Nouvelle Qté
      const previousTotalValueCts = Math.round(prevQty * prevPump);
      const incomingValueCts = Math.round(deliveredQty * line.unitPriceHtCts);
      totalValueAddedCts += incomingValueCts;

      const newPumpCts = newQty > 0
        ? Math.round((previousTotalValueCts + incomingValueCts) / newQty)
        : line.unitPriceHtCts;

      const updatedItem: CurrentStockItem = {
        ...currentItem,
        currentQuantity: newQty,
        currentPumpCts: newPumpCts,
      };

      updatedStockItems.push(updatedItem);

      movements.push({
        id: `mov_${now}_${Math.random().toString(36).slice(2, 7)}`,
        tenantId: params.tenantId,
        ingredientId: line.ingredientId,
        type: 'GOODS_RECEIPT',
        quantityDelta: deliveredQty,
        previousQuantity: prevQty,
        newQuantity: newQty,
        previousPumpCts: prevPump,
        newPumpCts: newPumpCts,
        purchasePriceCts: line.unitPriceHtCts,
        batchNumber: line.batchNumber,
        expiryDateUtc: line.expiryDateUtc,
        deliveryNoteNumber: params.deliveryNoteNumber,
        supplierId: params.supplierId,
        createdAt: now,
      });
    }

    return {
      updatedStockItems,
      movements,
      totalValueAddedCts,
    };
  }
}
