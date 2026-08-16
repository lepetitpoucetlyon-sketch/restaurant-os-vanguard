import { describe, it, expect } from 'vitest';
import { AutoProcurementEngine } from './AutoProcurementEngine';
import type { StockItem } from '@/modules/logistics/domain/schemas/inventory';
import type { MercurialeItem } from '../mercuriales/MercurialeTypes';
import type { SupplierEntity } from '../core/domain/supplier.types';
import { toMicrounits } from '@/shared/schemas/primitives';

describe('📦 AutoProcurementEngine — Moteur d’Auto-Approvisionnement Intelligent', () => {
  const mockSuppliers: SupplierEntity[] = [
    {
      id: 'supp_metro',
      tenantId: 'tenant_test',
      name: 'Metro Cash & Carry',
      category: 'meats',
      preferredOrderChannel: 'WHATSAPP',
      contacts: [],
      francoCts: 20000, // 200 € HT Franco
      shippingCostCts: 3000, // 30 € de port si sous Franco
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
    {
      id: 'supp_pomona',
      tenantId: 'tenant_test',
      name: 'Pomona TerreAzur',
      category: 'produce',
      preferredOrderChannel: 'EMAIL_PDF',
      contacts: [],
      francoCts: 10000, // 100 € HT Franco
      shippingCostCts: 2000,
      paymentTerms: '30_DAYS',
      paymentMethod: 'SEPA_DEBIT',
      deliverySchedule: {
        allowedDays: [1, 2, 3, 4, 5, 6],
        cutOffTime: '23:00',
        cutOffDaysBefore: 1,
        deliveryWindow: '05:00-08:00',
      },
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
  ];

  const mockStockItems: StockItem[] = [
    {
      id: 'item_entrecote',
      type: 'stockItem',
      name: 'Entrecôte Black Angus',
      quantityInStock: 2, // Stock sous seuil critique (2kg <= 3kg)
      threshold: 8,
      criticalThreshold: 3,
      unit: 'kg',
      priceInMicrounits: toMicrounits(22_000_000),
      supplierId: 'supp_metro',
      schemaVersion: 2,
      updatedAt: Date.now(),
    },
    {
      id: 'item_avocat',
      type: 'stockItem',
      name: 'Avocat Hass',
      quantityInStock: 4, // Stock bas (4 colis <= seuil 6)
      threshold: 6,
      criticalThreshold: 2,
      unit: 'crate',
      priceInMicrounits: toMicrounits(12_000_000),
      supplierId: 'supp_pomona',
      schemaVersion: 2,
      updatedAt: Date.now(),
    },
    {
      id: 'item_farine',
      type: 'stockItem',
      name: 'Farine T55',
      quantityInStock: 50, // Stock suffisant (> 20kg) -> Ignoré
      threshold: 20,
      criticalThreshold: 5,
      unit: 'kg',
      priceInMicrounits: toMicrounits(1_200_000),
      supplierId: 'supp_metro',
      schemaVersion: 2,
      updatedAt: Date.now(),
    }
  ];

  const mockMercuriales: MercurialeItem[] = [
    {
      id: 'merc_entrecote_metro',
      supplierId: 'supp_metro',
      ingredientId: 'item_entrecote',
      supplierRefCode: 'MET-EA-01',
      name: 'Entrecôte Black Angus',
      packagingLabel: 'Carton 5kg (Sous-vide)',
      packagingQuantity: 5,
      packagingUnit: 'kg',
      conversionFactorToBaseUnit: 5,
      packagePriceHtCts: 11000, // 110.00 € le carton de 5kg (22.00 €/kg)
      unitPriceHtCts: 2200,
      vatRatePct: 5.5,
      validFromUtc: Date.now(),
      isAvailable: true,
    },
    {
      id: 'merc_avocat_pomona',
      supplierId: 'supp_pomona',
      ingredientId: 'item_avocat',
      supplierRefCode: 'POM-AV-18',
      name: 'Avocat Hass Calibre 18',
      packagingLabel: 'Colis 4kg (18 pièces)',
      packagingQuantity: 1,
      packagingUnit: 'unit',
      conversionFactorToBaseUnit: 1,
      packagePriceHtCts: 1400, // 14.00 € le colis
      unitPriceHtCts: 1400,
      vatRatePct: 5.5,
      validFromUtc: Date.now(),
      isAvailable: true,
    },
    {
      id: 'merc_huile_friture',
      supplierId: 'supp_metro',
      ingredientId: 'item_huile',
      supplierRefCode: 'MET-OIL-10',
      name: 'Bidon Huile de Tournesol 10L',
      packagingLabel: 'Bidon 10L',
      packagingQuantity: 1,
      packagingUnit: 'l',
      conversionFactorToBaseUnit: 10,
      packagePriceHtCts: 2500, // 25.00 €
      unitPriceHtCts: 250,
      vatRatePct: 5.5,
      validFromUtc: Date.now(),
      isAvailable: true,
    }
  ];

  it('1. Détecte précisément les urgences critiques et stocks bas', () => {
    const analysis = AutoProcurementEngine.generateRestockRecommendations(
      mockStockItems,
      mockMercuriales,
      mockSuppliers,
      1.2
    );

    expect(analysis.totalItemsScanned).toBe(3);
    expect(analysis.criticalItemsCount).toBe(1); // Entrecôte
    expect(analysis.lowStockItemsCount).toBe(1);  // Avocat
    expect(analysis.supplierBaskets.length).toBe(2);
  });

  it('2. Calcule les colis entiers nécessaires avec facteur de sécurité', () => {
    const analysis = AutoProcurementEngine.generateRestockRecommendations(
      mockStockItems,
      mockMercuriales,
      mockSuppliers,
      1.2
    );

    const metroBasket = analysis.supplierBaskets.find((b) => b.supplierId === 'supp_metro');
    expect(metroBasket).toBeDefined();

    const entrecoteItem = metroBasket?.items.find((i) => i.stockItemId === 'item_entrecote');
    expect(entrecoteItem).toBeDefined();
    expect(entrecoteItem?.urgency).toBe('CRITICAL');
    // Seuil haut = 8, facteur 1.2 -> cible = 9.6 -> Manque 9.6 - 2 = 7.6 kg.
    // Conditionnement = 5kg -> Math.ceil(7.6 / 5) = 2 cartons (10 kg livrés)
    expect(entrecoteItem?.recommendedPackagesCount).toBe(2);
    expect(entrecoteItem?.totalDeliveredQty).toBe(10);
    expect(entrecoteItem?.totalHtCts).toBe(22000); // 2 * 110.00 € = 220.00 €
  });

  it('3. Évalue l’atteinte du Franco et génère des suggestions de comblement', () => {
    const analysis = AutoProcurementEngine.generateRestockRecommendations(
      mockStockItems,
      mockMercuriales,
      mockSuppliers,
      1.2
    );

    // Metro : 220 € HT >= Franco de 200 € -> Franco atteint !
    const metroBasket = analysis.supplierBaskets.find((b) => b.supplierId === 'supp_metro');
    expect(metroBasket?.isFrancoReached).toBe(true);
    expect(metroBasket?.amountToFrancoCts).toBe(0);

    // Pomona : Avocats (4 commandés = 4 * 14€ = 56 € HT) < Franco de 100 €
    const pomonaBasket = analysis.supplierBaskets.find((b) => b.supplierId === 'supp_pomona');
    expect(pomonaBasket?.isFrancoReached).toBe(false);
    expect(pomonaBasket?.amountToFrancoCts).toBe(4400); // Manque 44.00 €
    expect(pomonaBasket?.shippingCostCts).toBe(2000);   // 20.00 € de port
  });

  it('4. Construit un Bon de Commande (PurchaseOrderEntity) prêt à engager', () => {
    const analysis = AutoProcurementEngine.generateRestockRecommendations(
      mockStockItems,
      mockMercuriales,
      mockSuppliers,
      1.2
    );

    const metroBasket = analysis.supplierBaskets.find((b) => b.supplierId === 'supp_metro')!;
    const po = AutoProcurementEngine.buildPurchaseOrderFromBasket(
      'tenant_test',
      metroBasket,
      'emp_chef_1',
      1,
      '2026-08-18'
    );

    expect(po.orderNumber).toMatch(/^BC-\d{8}-0001$/);
    expect(po.supplierId).toBe('supp_metro');
    expect(po.status).toBe('DRAFT');
    expect(po.totalHtCts).toBe(22000);
    expect(po.totalVatCts).toBe(1210); // 22000 * 5.5% = 1210 cts
    expect(po.totalTtcCts).toBe(23210);
    expect(po.francoReached).toBe(true);
    expect(po.items.length).toBe(1);
    expect(po.items[0].packagesCount).toBe(2);
  });
});
