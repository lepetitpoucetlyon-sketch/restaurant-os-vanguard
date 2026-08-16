import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EquipmentAssetService } from '@/modules/facility/services/EquipmentAssetService';
import { EquipmentKnowledgeService } from '@/modules/facility/services/EquipmentKnowledgeService';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

describe('Pilier 8 Facility : EquipmentAssetService & Factures / Garanties / Tutos', () => {
  const tenantId = 'brasserie-paris-lux';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait enregistrer un équipement avec sa facture et sa garantie, et émettre l événement EventBus', async () => {
    const eventSpy = vi.fn();
    NexusEventBus.on('facility.equipment_registered', eventSpy, { id: 'test-eq-registered' });

    const now = new Date();
    const warrantyExpiry = new Date();
    warrantyExpiry.setMonth(warrantyExpiry.getMonth() + 24);

    const asset = await EquipmentAssetService.registerAsset(
      tenantId,
      {
        name: 'Four Mixte Professionnel Rational',
        category: 'COOKING',
        brand: 'Rational',
        model: 'iCombi Pro 10 GN',
        serialNumber: 'SN-RAT-998822',
        location: 'Cuisine Chaude',
        status: 'OPERATIONAL',
        purchase: {
          supplierName: 'Grandes Cuisines de France',
          invoiceNumber: 'FACT-2024-089',
          invoiceUrl: 'https://storage.empire.fr/invoices/rational-four.pdf',
          purchaseDate: now.toISOString(),
          purchasePriceInCents: 1250000, // 12 500 € HT
          taxRatePercent: 20,
          warrantyDurationMonths: 24,
          warrantyExpiresAt: warrantyExpiry.toISOString(),
          depreciationPeriodYears: 5,
          pcgAccount: '2183',
        },
        maintenanceFrequencyDays: 90,
        nextMaintenanceDueAt: new Date(Date.now() + 90 * 86400000).toISOString(),
        supportContact: {
          companyName: 'Rational France SAV',
          phone: '01 44 00 11 22',
        },
      },
      'chef_antoine'
    );

    expect(asset.id).toBeDefined();
    expect(asset.name).toBe('Four Mixte Professionnel Rational');
    expect(asset.purchase?.purchasePriceInCents).toBe(1250000);
    expect(asset.purchase?.invoiceUrl).toBe('https://storage.empire.fr/invoices/rational-four.pdf');
    expect(eventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId,
        equipmentId: asset.id,
        name: 'Four Mixte Professionnel Rational',
        registeredBy: 'chef_antoine',
      })
    );
  });

  it('devrait calculer correctement le tableau d amortissement linéaire PCG', () => {
    const purchase = {
      supplierName: 'Fournisseur Test',
      purchaseDate: '2024-01-15T00:00:00.000Z',
      purchasePriceInCents: 1000000, // 10 000 €
      taxRatePercent: 20,
      warrantyDurationMonths: 24,
      warrantyExpiresAt: '2026-01-15T00:00:00.000Z',
      depreciationPeriodYears: 5,
      pcgAccount: '2183',
    };

    const schedule = EquipmentAssetService.calculateDepreciationSchedule(purchase);

    expect(schedule).toHaveLength(5);
    expect(schedule[0].annualDepreciationInCents).toBe(200000); // 2 000 €
    expect(schedule[0].bookValueInCents).toBe(800000); // 8 000 €
    expect(schedule[4].bookValueInCents).toBe(0); // 0 € à l'issue
    expect(schedule[4].accumulatedDepreciationInCents).toBe(1000000);
  });

  it('devrait déclarer une panne critique, dégrader le statut de la machine et émettre facility.equipment_breakdown', async () => {
    const breakdownSpy = vi.fn();
    NexusEventBus.on('facility.equipment_breakdown', breakdownSpy, { id: 'test-eq-breakdown' });

    const asset = await EquipmentAssetService.registerAsset(tenantId, {
      name: 'Machine Espresso La Marzocco Linea PB',
      category: 'BEVERAGE_COFFEE',
      brand: 'La Marzocco',
      model: 'Linea PB 3G',
      serialNumber: 'LM-PB-1234',
      location: 'Bar Comptoir',
      status: 'OPERATIONAL',
      maintenanceFrequencyDays: 30,
      nextMaintenanceDueAt: new Date().toISOString(),
    });

    const breakdown = await EquipmentAssetService.declareBreakdown(tenantId, asset.id, {
      symptom: 'Fuite massive groupe 2 et pression chaudière tombée à zéro',
      severity: 'critical',
      errorCode: 'ERR_BOILER_PRESS',
      declaredBy: 'barista_lucas',
    });

    expect(breakdown.id).toBeDefined();
    expect(breakdown.severity).toBe('critical');

    // Vérification du statut de l'équipement
    const updatedAsset = await EquipmentAssetService.getAssetById(tenantId, asset.id);
    expect(updatedAsset?.status).toBe('OUT_OF_ORDER');
    expect(breakdownSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId,
        equipmentId: asset.id,
        severity: 'critical',
        errorCode: 'ERR_BOILER_PRESS',
      })
    );

    // Clôture / Réparation
    const repaired = await EquipmentAssetService.resolveBreakdown(tenantId, breakdown.id, {
      technicianName: 'Marc Dépannage Café',
      resolutionNotes: 'Remplacement joint de bride et soupape de sécurité',
      costInMicrounits: 140000000, // 140 €
      partsReplaced: ['Joint de bride', 'Soupape 1.8 bar'],
    });

    expect(repaired.status).toBe('RESOLVED');
    const restoredAsset = await EquipmentAssetService.getAssetById(tenantId, asset.id);
    expect(restoredAsset?.status).toBe('OPERATIONAL');
  });

  it('devrait attacher des guides et tutos avec EquipmentKnowledgeService', async () => {
    const asset = await EquipmentAssetService.registerAsset(tenantId, {
      name: 'Lave-vaisselle à capot Hobart',
      category: 'WASHING',
      brand: 'Hobart',
      model: 'AMX-10',
      serialNumber: 'HB-AMX-7766',
      location: 'Plonge Centrale',
      status: 'OPERATIONAL',
      maintenanceFrequencyDays: 60,
      nextMaintenanceDueAt: new Date().toISOString(),
    });

    // Ajout d'un tuto YouTube
    const guide1 = await EquipmentKnowledgeService.addGuide(
      tenantId,
      asset.id,
      {
        title: 'Tuto Vidéo : Démontage & Nettoyage des Bras de Lavage',
        type: 'VIDEO_TUTO',
        authorType: 'COMMUNITY',
        authorName: 'Plonge Pro YouTube',
        url: 'https://youtube.com/watch?v=hobart-clean-demo',
        contentMarkdown: '1. Dévisser l écrou central\n2. Sortir les 2 rampes\n3. Déboucher les gicleurs',
        tags: ['nettoyage', 'plonge', 'bras', 'youtube'],
      },
      'manager_sophie'
    );

    expect(guide1.id).toBeDefined();
    expect(guide1.type).toBe('VIDEO_TUTO');

    // Récupération des guides
    const guides = await EquipmentKnowledgeService.getGuidesForEquipment(tenantId, asset.id);
    expect(guides.length).toBeGreaterThanOrEqual(1);
    expect(guides.some((g) => g.title.includes('Démontage'))).toBe(true);
  });
});
