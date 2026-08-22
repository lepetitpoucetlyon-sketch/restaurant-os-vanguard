import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AutoProcurementEngine } from '@/modules/logistics/approvisionnement/procurement/AutoProcurementEngine';
import { ProcurementBridge } from '@/modules/logistics/approvisionnement/procurement/ProcurementBridge';
import { ThreeWayMatchEngine, type SupplierInvoice } from '@/modules/logistics/approvisionnement/procurement/ThreeWayMatchEngine';
import type { PurchaseOrder, DeliveryNote } from '@/modules/logistics/approvisionnement/procurement/types';
import type { StockItem } from '@/modules/logistics/domain/schemas/inventory';
import type { MercurialeItem } from '@/modules/logistics/approvisionnement/mercuriales/MercurialeTypes';
import type { SupplierEntity } from '@/modules/logistics/approvisionnement/core/domain/supplier.types';

describe('🏛️ E2E Procurement Lifecycle: Approvisionnement ➔ Engagement ➔ Réception BL ➔ 3-Way Match', () => {
  const tenantId = 'tenant_e2e_restaurant';

  const mockSuppliers: SupplierEntity[] = [
    {
      id: 'supp_transgourmet',
      tenantId,
      name: 'Transgourmet Test',
      category: 'meats',
      preferredOrderChannel: 'EMAIL_PDF',
      contacts: [],
      francoCts: 15000, // 150.00 €
      shippingCostCts: 2500, // 25.00 €
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
      id: 'merc_entrecote',
      supplierId: 'supp_transgourmet',
      ingredientId: 'item_entrecote',
      supplierRefCode: 'TG-VIANDE-01',
      name: 'Entrecôte Black Angus',
      packagingLabel: 'Carton 5x1kg (5kg)',
      packagingQuantity: 5,
      packagingUnit: 'kg',
      packagePriceHtCts: 12500, // 125.00 € / carton (25.00 €/kg)
      conversionFactorToBaseUnit: 5,
      unitPriceHtCts: 2500,
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
      packagePriceHtCts: 1500, // 15.00 € / bidon
      conversionFactorToBaseUnit: 5,
      unitPriceHtCts: 300,
      vatRatePct: 5.5,
      validFromUtc: Date.now(),
      isAvailable: true,
    },
  ];

  const mockStock: StockItem[] = [
    {
      id: 'item_entrecote',
      type: 'stockItem',
      name: 'Entrecôte Black Angus',
      quantityInStock: 2, // Seuil critique <= 3kg
      threshold: 10,
      criticalThreshold: 3,
      unit: 'kg',
      category: 'meats',
      supplierId: 'supp_transgourmet',
      schemaVersion: 2,
      updatedAt: Date.now(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait exécuter la boucle complète de réapprovisionnement, d’engagement et de rapprochement fiscal', async () => {
    // ── Étape 1 : Analyse intelligente du besoin en stock ────────────────────
    const analysis = AutoProcurementEngine.generateRestockRecommendations(
      mockStock,
      mockMercuriale,
      mockSuppliers,
      1.2
    );

    expect(analysis.totalItemsScanned).toBe(1);
    expect(analysis.criticalItemsCount).toBe(1);
    expect(analysis.supplierBaskets).toHaveLength(1);

    const basket = analysis.supplierBaskets[0];
    expect(basket.supplierId).toBe('supp_transgourmet');
    expect(basket.items).toHaveLength(1);

    // ── Étape 2 : Génération du Bon de Commande (Purchase Order) ────────────
    const po: PurchaseOrder = {
      id: 'PO-2026-08-001',
      supplierId: basket.supplierId,
      items: basket.items.map((item) => ({
        productId: item.mercurialeItemId,
        quantityOrdered: item.recommendedPackagesCount,
        unitPriceInCents: item.packagePriceHtCts,
      })),
      totalAmountInCents: basket.basketTotalHtCts,
      status: 'submitted',
      createdAt: new Date().toISOString(),
    };

    expect(po.totalAmountInCents).toBeGreaterThan(0);

    // ── Étape 3 : Enregistrement de l'engagement hors-bilan ──────────────────
    await expect(ProcurementBridge.engagePurchaseOrder(po, tenantId)).resolves.not.toThrow();

    // ── Étape 4 : Réception physique, signature BL et conversion en dette ────
    const deliveryNote: DeliveryNote = {
      id: 'BL-2026-08-999',
      purchaseOrderId: po.id,
      supplierId: po.supplierId,
      totalAmountInCents: po.totalAmountInCents,
      status: 'pending',
      deliveredItems: po.items.map((item) => ({
        productId: item.productId,
        quantityDelivered: item.quantityOrdered ?? 1,
        unitPriceInCents: item.unitPriceInCents,
      })),
      receivedAt: Date.now(),
    };

    const signature = await ProcurementBridge.signDeliveryNote(deliveryNote, tenantId);
    expect(signature).toBeDefined();
    expect(typeof signature).toBe('string');

    // ── Étape 5 : Contrôle anti-fraude Three-Way Match (Cas Conforme) ────────
    const validInvoice: SupplierInvoice = {
      id: 'INV-TG-2026-001',
      supplierId: po.supplierId || 'supp_transgourmet',
      purchaseOrderId: po.id,
      deliveryNoteId: deliveryNote.id,
      lines: deliveryNote.deliveredItems.map((item) => ({
        productId: item.productId,
        quantityBilled: item.quantityDelivered,
        unitPriceInCents: item.unitPriceInCents ?? 0,
      })),
      totalAmountInCents: deliveryNote.totalAmountInCents,
      issueDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString(),
      status: 'pending_approval',
    };

    const matchResult = await ThreeWayMatchEngine.performMatch(
      po,
      deliveryNote,
      validInvoice,
      tenantId
    );

    expect(matchResult.isValid).toBe(true);
    expect(matchResult.discrepancies).toHaveLength(0);
    expect(matchResult.matchType).toBe('3-way');

    // ── Étape 6 : Contrôle anti-fraude (Cas Frauduleux / Surfacturation) ─────
    const fraudulentInvoice: SupplierInvoice = {
      ...validInvoice,
      id: 'INV-TG-FRAUD-002',
      lines: deliveryNote.deliveredItems.map((item) => ({
        productId: item.productId,
        quantityBilled: item.quantityDelivered + 5, // 5 colis facturés en trop
        unitPriceInCents: (item.unitPriceInCents ?? 0) + 1500, // +15 € par colis
      })),
      totalAmountInCents: deliveryNote.totalAmountInCents + 20000,
    };

    const fraudMatch = await ThreeWayMatchEngine.performMatch(
      po,
      deliveryNote,
      fraudulentInvoice,
      tenantId
    );

    expect(fraudMatch.isValid).toBe(false);
    expect(fraudMatch.discrepancies.length).toBeGreaterThan(0);
    expect(fraudMatch.discrepancies.some((d) => d.includes('Montant facturé'))).toBe(true);
  });
});
