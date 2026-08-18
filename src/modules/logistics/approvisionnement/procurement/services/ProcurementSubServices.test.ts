import { describe, it, expect } from 'vitest';
import { ProcurementStockScanner } from './ProcurementStockScanner';
import { ProcurementOfferMatcher } from './ProcurementOfferMatcher';
import { ProcurementBasketOptimizer } from './ProcurementBasketOptimizer';
import type { StockItem } from '../../../domain/schemas/inventory';
import type { MercurialeItem } from '../../mercuriales/MercurialeTypes';
import type { SupplierEntity } from '../../core/domain/supplier.types';

describe('📦 Procurement Sub-Services Unit Tests', () => {
  const mockSuppliers: SupplierEntity[] = [
    {
      id: 'supp_transgourmet',
      tenantId: 'tenant_test',
      name: 'Transgourmet Test',
      category: 'meats',
      preferredOrderChannel: 'EMAIL_PDF',
      contacts: [],
      francoCts: 15000,
      shippingCostCts: 2500,
      paymentTerms: '30_DAYS',
      paymentMethod: 'SEPA_DEBIT',
      deliverySchedule: {
        allowedDays: [1, 2, 3, 4, 5],
        cutOffTime: '22:00',
        cutOffDaysBefore: 1,
        deliveryWindow: '06:00-09:00',
      },
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ];

  const mockMercuriale: MercurialeItem[] = [
    {
      id: 'merc_beurre',
      supplierId: 'supp_transgourmet',
      ingredientId: 'item_beurre',
      supplierRefCode: 'TG-BEURRE-01',
      name: 'Beurre Doux 82% MG',
      packagingLabel: 'Carton 10x250g (2.5kg)',
      packagingQuantity: 10,
      packagingUnit: 'kg',
      packagePriceHtCts: 1850,
      conversionFactorToBaseUnit: 2.5,
      unitPriceHtCts: 740,
      vatRatePct: 5.5,
      validFromUtc: Date.now(),
      isAvailable: true,
    },
    {
      id: 'merc_huile',
      supplierId: 'supp_transgourmet',
      ingredientId: 'item_huile',
      supplierRefCode: 'TG-HUILE-01',
      name: 'Huile de Tournesol',
      packagingLabel: 'Bidon 5L',
      packagingQuantity: 1,
      packagingUnit: 'l',
      packagePriceHtCts: 1200,
      conversionFactorToBaseUnit: 5,
      unitPriceHtCts: 240,
      vatRatePct: 5.5,
      validFromUtc: Date.now(),
      isAvailable: true,
    },
  ];

  it('ProcurementStockScanner should accurately detect sub-threshold and urgency', () => {
    const stockItems: StockItem[] = [
      {
        id: 'item_beurre',
        type: 'stockItem',
        name: 'Beurre Doux',
        quantityInStock: 1,
        threshold: 5,
        criticalThreshold: 2,
        unit: 'kg',
        category: 'dairy',
        supplierId: 'supp_transgourmet',
        schemaVersion: 2,
        updatedAt: Date.now(),
      },
      {
        id: 'item_full',
        type: 'stockItem',
        name: 'Stock Suffisant',
        quantityInStock: 20,
        threshold: 5,
        criticalThreshold: 2,
        unit: 'kg',
        category: 'dairy',
        schemaVersion: 2,
        updatedAt: Date.now(),
      },
    ];

    const result = ProcurementStockScanner.scan(stockItems, 1.2);
    expect(result.itemsToRestock).toHaveLength(1);
    expect(result.criticalCount).toBe(1);
    expect(result.lowStockCount).toBe(0);
    expect(result.itemsToRestock[0].stockItem.id).toBe('item_beurre');
  });

  it('ProcurementOfferMatcher should correctly match best available mercuriale', () => {
    const scanned = {
      stockItem: {
        id: 'item_beurre',
        type: 'stockItem' as const,
        name: 'Beurre Doux',
        quantityInStock: 1,
        threshold: 5,
        criticalThreshold: 2,
        unit: 'kg' as const,
        category: 'dairy' as const,
        supplierId: 'supp_transgourmet',
        schemaVersion: 2 as const,
        updatedAt: Date.now(),
      },
      currentQty: 1,
      threshold: 5,
      criticalThreshold: 2,
      targetQuantity: 6,
      missingQty: 5,
      urgency: 'CRITICAL' as const,
    };

    const mercurialeIndex = ProcurementOfferMatcher.indexMercuriales(mockMercuriale);
    const suppliersMap = new Map(mockSuppliers.map((s) => [s.id, s]));

    const recommendation = ProcurementOfferMatcher.matchOffer(
      scanned,
      mercurialeIndex,
      suppliersMap
    );

    expect(recommendation.mercurialeItemId).toBe('merc_beurre');
    expect(recommendation.recommendedPackagesCount).toBe(2); // 5kg missing / 2.5kg = 2 cartons
    expect(recommendation.totalDeliveredQty).toBe(5);
    expect(recommendation.totalHtCts).toBe(3700); // 2 * 1850
  });

  it('ProcurementBasketOptimizer should calculate shipping and Franco fillers', () => {
    const recommendation = {
      stockItemId: 'item_beurre',
      name: 'Beurre Doux',
      currentQuantity: 1,
      threshold: 5,
      criticalThreshold: 2,
      targetQuantity: 6,
      unit: 'kg',
      missingQuantity: 5,
      urgency: 'CRITICAL' as const,
      selectedSupplierId: 'supp_transgourmet',
      selectedSupplierName: 'Transgourmet Test',
      mercurialeItemId: 'merc_beurre',
      packagingLabel: 'Carton 10x250g (2.5kg)',
      conversionFactor: 2.5,
      packagePriceHtCts: 1850,
      recommendedPackagesCount: 2,
      totalDeliveredQty: 5,
      totalHtCts: 3700, // 37.00 € (Franco = 150.00 €)
    };

    const suppliersMap = new Map(mockSuppliers.map((s) => [s.id, s]));
    const optimization = ProcurementBasketOptimizer.optimizeBaskets(
      [recommendation],
      suppliersMap,
      mockMercuriale
    );

    expect(optimization.supplierBaskets).toHaveLength(1);
    const basket = optimization.supplierBaskets[0];
    expect(basket.isFrancoReached).toBe(false);
    expect(basket.amountToFrancoCts).toBe(11300); // 15000 - 3700
    expect(basket.suggestedFrancoFillers.length).toBeGreaterThan(0);
    expect(basket.suggestedFrancoFillers[0].mercurialeItemId).toBe('merc_huile');
  });
});
