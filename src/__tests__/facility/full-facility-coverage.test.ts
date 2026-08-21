import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EquipmentAssetService } from '@/modules/facility/services/EquipmentAssetService';
import { HardwareProvisioningService, HARDWARE_CHECKLIST_SPECS } from '@/modules/facility/services/HardwareProvisioningService';
import { MaintenanceAlertConfigService } from '@/modules/facility/services/MaintenanceAlertConfigService';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

describe('⚡ Facility, Bâtiment & Matériel — Couverture 100%', () => {
  beforeEach(() => {
    vi.spyOn(NexusEventBus, 'emitDurable').mockResolvedValue(undefined as never);
    vi.spyOn(NexusEventBus, 'emit').mockReturnValue(true as never);
  });

  describe('1. EquipmentAssetService — Amortissements & Cycle de Vie', () => {
    it('doit calculer le tableau damortissement linéaire annuel sur 5 ans', () => {
      const schedule = EquipmentAssetService.calculateDepreciationSchedule({
        supplierName: 'CHR Restauration Pro',
        purchaseDate: '2024-01-01T00:00:00.000Z',
        purchasePriceInMicrounits: 10_000_000_000, // 10 000 € HT
        depreciationPeriodYears: 5,
        warrantyDurationMonths: 24,
        warrantyExpiresAt: '2026-01-01T00:00:00.000Z',
        taxRatePercent: 20,
        pcgAccount: '2183',
      });

      expect(schedule.length).toBe(5);
      expect(schedule[0].annualDepreciationInMicrounits).toBe(2_000_000_000); // 2000 € / an
      expect(schedule[0].bookValueInMicrounits).toBe(8_000_000_000);
      expect(schedule[4].bookValueInMicrounits).toBe(0);
      expect(schedule[4].accumulatedDepreciationInMicrounits).toBe(10_000_000_000);
    });

    it('doit enregistrer un actif et émettre lévénement EventBus', async () => {
      const asset = await EquipmentAssetService.registerAsset('tenant-test-fac', {
        name: 'Four Mixte Rational iCombi Pro 6',
        category: 'COOKING',
        brand: 'Rational',
        model: 'iCombi Pro 6',
        serialNumber: 'SN-RATIONAL-8871',
        location: 'Cuisine Chaude',
        status: 'OPERATIONAL',
        nextMaintenanceDueAt: '2025-04-15T00:00:00.000Z',
        maintenanceFrequencyDays: 90,
        purchase: {
          supplierName: 'CHR Restauration Pro',
          purchaseDate: '2025-01-15T00:00:00.000Z',
          purchasePriceInMicrounits: 8_500_000_000,
          warrantyDurationMonths: 24,
          warrantyExpiresAt: '2027-01-15T00:00:00.000Z',
          depreciationPeriodYears: 5,
          taxRatePercent: 20,
          pcgAccount: '2183',
        },
      });

      expect(asset.id).toBeDefined();
      expect(asset.name).toBe('Four Mixte Rational iCombi Pro 6');
      expect(NexusEventBus.emitDurable).toHaveBeenCalledWith(
        'facility.equipment_registered',
        expect.objectContaining({
          tenantId: 'tenant-test-fac',
          category: 'COOKING',
        })
      );
    });
  });

  describe('2. HardwareProvisioningService — Protocole J-0', () => {
    it('doit contenir les 12 points de contrôle du protocole d’installation', () => {
      expect(HARDWARE_CHECKLIST_SPECS.length).toBe(12);
      const ids = HARDWARE_CHECKLIST_SPECS.map(s => s.id);
      expect(ids).toContain('tpe_terminal_ping');
      expect(ids).toContain('escpos_receipt_printer');
      expect(ids).toContain('cash_drawer_kick');
      expect(ids).toContain('backup_4g_failover');
      expect(ids).toContain('initial_fiscal_chain');
    });

    it('doit exécuter lautodiagnostic matériel J-0 complet et générer un PV scellé SHA-256', async () => {
      const report = await HardwareProvisioningService.runFullHardwareDiagnostic(
        'tenant-test-fac',
        'Restaurant Le Grand Chêne',
        'Jean Tech',
        'Directeur Marc'
      );

      expect(report.reportId).toBeDefined();
      expect(report.allPassed).toBe(true);
      expect(report.passedCount).toBe(12);
      expect(report.masterSealSha256).toBeDefined();
      expect(report.masterSealSha256.length).toBe(64); // SHA-256
    });
  });

  describe('3. MaintenanceAlertConfigService — Routage & Notification', () => {
    it('doit générer une configuration par défaut réaliste avec règles de sévérité', () => {
      const config = MaintenanceAlertConfigService.getDefaultConfig('tenant-test-fac');
      expect(config.rules.length).toBeGreaterThanOrEqual(3);

      const criticalBreakdownRule = config.rules.find(r => r.alertType === 'EQUIPMENT_BREAKDOWN');
      expect(criticalBreakdownRule).toBeDefined();
      expect(criticalBreakdownRule?.recipients.some(rec => rec.role === 'directeur')).toBe(true);
    });

    it('doit router et dispatcher les alertes critiques aux bons destinataires', async () => {
      const dispatched = await MaintenanceAlertConfigService.dispatchAlert({
        tenantId: 'tenant-test-fac',
        alertType: 'EQUIPMENT_BREAKDOWN',
        severity: 'critical',
        zone: 'KITCHEN_HOT',
        equipmentName: 'Four Rational',
        message: 'Panne Sonde Température',
      });

      expect(dispatched.dispatched).toBe(true);
      expect(dispatched.recipientsNotified).toBeGreaterThanOrEqual(1);
    });
  });
});
