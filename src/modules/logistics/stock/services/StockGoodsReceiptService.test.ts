import { describe, it, expect } from 'vitest';
import { StockGoodsReceiptService, CurrentStockItem, ReceivedGoodsLine } from './StockGoodsReceiptService';

describe('StockGoodsReceiptService', () => {
  it('processes goods receipt, updates quantity and recalculates PUMP accurately', () => {
    // Situation initiale : 10 kg de beurre à 8,00 € / kg (800 cts) -> Valeur = 80,00 €
    const currentStockMap = new Map<string, CurrentStockItem>([
      [
        'ing-beurre',
        {
          id: 'stock-1',
          tenantId: 'tenant-lyon',
          ingredientId: 'ing-beurre',
          ingredientName: 'Beurre Doux',
          currentQuantity: 10,
          currentPumpCts: 800,
        },
      ],
    ]);

    // Livraison reçue : 2 cartons de 10kg = 20 kg à 9,50 € / kg (950 cts) -> Valeur = 190,00 €
    // Nouveau stock = 10 + 20 = 30 kg
    // Nouvelle valeur = 80 + 190 = 270,00 €
    // Nouveau PUMP = 270 / 30 = 9,00 € / kg (900 cts)
    const receivedLines: ReceivedGoodsLine[] = [
      {
        ingredientId: 'ing-beurre',
        ingredientName: 'Beurre Doux',
        packagesCount: 2,
        conversionFactorToBaseUnit: 10,
        unitPriceHtCts: 950,
        batchNumber: 'LOT-TG-2026-0816',
        expiryDateUtc: Date.UTC(2026, 9, 30),
      },
    ];

    const result = StockGoodsReceiptService.processGoodsReceipt({
      tenantId: 'tenant-lyon',
      supplierId: 'supp-transgourmet',
      deliveryNoteNumber: 'BL-99120',
      currentStockMap,
      receivedLines,
    });

    expect(result.updatedStockItems).toHaveLength(1);
    const updated = result.updatedStockItems[0];
    expect(updated.currentQuantity).toBe(30);
    expect(updated.currentPumpCts).toBe(900); // 9.00 € / kg
    expect(result.totalValueAddedCts).toBe(19000); // 190.00 €

    expect(result.movements).toHaveLength(1);
    const movement = result.movements[0];
    expect(movement.type).toBe('GOODS_RECEIPT');
    expect(movement.quantityDelta).toBe(20);
    expect(movement.previousPumpCts).toBe(800);
    expect(movement.newPumpCts).toBe(900);
    expect(movement.batchNumber).toBe('LOT-TG-2026-0816');
  });

  it('handles first-time receipt of an ingredient not previously in stock', () => {
    const currentStockMap = new Map<string, CurrentStockItem>();

    const receivedLines: ReceivedGoodsLine[] = [
      {
        ingredientId: 'ing-truffe',
        ingredientName: 'Truffe Noire',
        packagesCount: 1,
        conversionFactorToBaseUnit: 0.5, // 500g
        unitPriceHtCts: 120000, // 1200.00 € / kg
        batchNumber: 'LOT-TRUF-01',
        expiryDateUtc: Date.UTC(2026, 8, 15),
      },
    ];

    const result = StockGoodsReceiptService.processGoodsReceipt({
      tenantId: 'tenant-lyon',
      supplierId: 'supp-gourmet',
      deliveryNoteNumber: 'BL-4421',
      currentStockMap,
      receivedLines,
    });

    const item = result.updatedStockItems[0];
    expect(item.currentQuantity).toBe(0.5);
    expect(item.currentPumpCts).toBe(120000);
  });
});
