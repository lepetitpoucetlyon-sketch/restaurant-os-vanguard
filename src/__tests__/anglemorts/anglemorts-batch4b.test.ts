import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/nexus/NexusAdapter', () => ({
  Nexus: { adapter: { get: vi.fn(), set: vi.fn(), query: vi.fn() } },
}));
vi.mock('@/shared/eventBus/NexusEventBus', () => ({
  NexusEventBus: { emit: vi.fn(), emitDurable: vi.fn() },
}));
vi.mock('@/lib/audit', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/audit')>();
  return {
    ...actual,
    AuditLogger: { ...actual.AuditLogger, logAction: vi.fn().mockResolvedValue({ id: 'AUD-1', hash: 'HASH-1' }) },
  };
});
vi.mock('@/lib/mcc/audit/AuditLogger', () => ({
  AuditLogger: { logAction: vi.fn().mockResolvedValue({ id: 'AUD-1', hash: 'HASH-1' }) },
}));
vi.mock('@/modules/compliance', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/modules/compliance')>();
  return {
    ...actual,
    AuditLogger: { ...actual.AuditLogger, logAction: vi.fn().mockResolvedValue({ id: 'AUD-1', hash: 'HASH-1' }) },
  };
});
vi.mock('@/modules/compliance/securite/AuditLogger', () => ({
  AuditLogger: { logAction: vi.fn().mockResolvedValue({ id: 'AUD-1', hash: 'HASH-1' }) },
}));
vi.mock('@/modules/finance/fiscalite/FiscalSealer', () => ({
  FiscalSealer: {
    sealDataAtomically: vi.fn().mockResolvedValue({
      sealId: 'SEAL-001',
      hash: 'SHA256-MOCK-HASH-001',
      previousHash: 'GENESIS',
      signature: 'SIG-MOCK-001',
    }),
    generateSequentialReceiptNumber: vi.fn().mockResolvedValue('2026-000042'),
  },
}));

import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { AuditLogger } from '@/lib/audit';

import { FlashAlcoholInventoryService } from '@/modules/ops/service/restaurant/pos/services/FlashAlcoholInventoryService';
import { CorkedBottleDisputeService } from '@/modules/ops/service/restaurant/pos/services/CorkedBottleDisputeService';
import { KegHydrostaticLossService } from '@/modules/ops/service/restaurant/pos/services/KegHydrostaticLossService';
import { SmartSpoutTelemetryService } from '@/modules/ops/service/restaurant/pos/services/SmartSpoutTelemetryService';
import { FermentationMonitorService } from '@/modules/ops/service/restaurant/pos/services/FermentationMonitorService';
import { CocktailDilutionIndexService } from '@/modules/ops/service/restaurant/pos/services/CocktailDilutionIndexService';
import { MenuComboTaxProrataService } from '@/modules/finance/fiscalite/MenuComboTaxProrataService';
import { SmartCardRoutingService } from '@/modules/finance/tresorerie/SmartCardRoutingService';
import { PrinterFailoverRoutingService } from '@/modules/ops/service/restaurant/pos/services/PrinterFailoverRoutingService';
import { HardenedTouchUiHelper } from '@/modules/ops/service/restaurant/pos/services/HardenedTouchUiHelper';
import { BilingualTipGratuityHelper } from '@/modules/ops/service/restaurant/pos/services/BilingualTipGratuityHelper';
describe('Angles Morts — Batch 4 (Part 2)', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe('L15 — FlashAlcoholInventoryService', () => {
    it('computes bottle liquid volume deducting tare and flags variance', () => {
      const summary = FlashAlcoholInventoryService.evaluateInventory('tenant-1', 'MGR-1', [
        {
          productId: 'VODKA-GREY-GOOSE',
          productName: 'Vodka Grey Goose 70cl',
          tareWeightGrams: 450, // Poids bouteille vide
          fullNetVolumeCl: 70,
          densityGramsPerCl: 9.5, // 9.5 g/cl (~0.95 g/ml)
          currentGrossWeightGrams: 830, // Net liquid = 380g -> 380 / 9.5 = 40cl
          billedDosesCl: 25,            // Expected = 70 - 25 = 45cl -> Variance -5cl coulage
          costPerClInMicrounits: 500_000, // 0.50€/cl
        },
      ]);

      expect(summary.bottleCount).toBe(1);
      expect(summary.evaluations[0].calculatedRemainingCl).toBe(40);
      expect(summary.evaluations[0].expectedRemainingCl).toBe(45);
      expect(summary.evaluations[0].varianceCl).toBe(-5);
      expect(summary.totalLossInMicrounits).toBe(2_500_000); // 2.50€
    });
  });

  // ── L16: CorkedBottleDisputeService ───────────────────────────────────────
  describe('L16 — CorkedBottleDisputeService', () => {
    it('records corked bottle dispute and creates supplier claim', async () => {
      const auditSpy = vi.spyOn(AuditLogger, 'logAction');
      const res = await CorkedBottleDisputeService.recordCorkedBottle({
        tenantId: 'tenant-1',
        adminId: 'SOMMELIER-1',
        productId: 'WINE-POMMARD-2018',
        productName: 'Pommard 2018 Domaine X',
        bottleLot: 'LOT-2018-A',
        supplierId: 'CAVISTE-LYON',
        costInMicrounits: 35_000_000,
        tableNumber: '4',
      });

      expect(res.stockTransferToDispute).toBe(true);
      expect(res.supplierDebitClaimSlipId).toContain('CLAIM-SUPPLIER-CAVISTE-LYON');
      expect(auditSpy).toHaveBeenCalledWith(expect.objectContaining({ action: 'CORKED_BOTTLE_RECORDED' }));
    });
  });

  // ── L17: KegHydrostaticLossService ────────────────────────────────────────
  describe('L17 — KegHydrostaticLossService', () => {
    it('calculates hydrostatic keg yield for 30L beer keg (9.5% loss)', () => {
      const res = KegHydrostaticLossService.computeKegYield({
        kegCapacityLiters: 30,
        glassVolumeCl: 50, // Pinte
      });

      expect(res.usableVolumeLiters).toBe(27.15);
      expect(res.lossVolumeLiters).toBe(2.85);
      expect(res.theoreticalGlassesCount).toBe(60);
      expect(res.usableGlassesCount).toBe(54); // 54 pintes réelles
      expect(res.lossGlassesCount).toBe(6);
    });
  });

  // ── L18: SmartSpoutTelemetryService ───────────────────────────────────────
  describe('L18 — SmartSpoutTelemetryService', () => {
    it('flags free-pouring without POS order and alerts', async () => {
      const res = await SmartSpoutTelemetryService.analyzeSpoutActivity({
        tenantId: 'tenant-1',
        spoutId: 'SPOUT-GIN-01',
        productId: 'GIN-HENDRICKS',
        productName: 'Gin Hendrick\'s',
        dispensedCl: 8,
        billedCl: 0,
      });

      expect(res.isFreePourSuspected).toBe(true);
      expect(NexusEventBus.emit).toHaveBeenCalledWith('bar.spout_variance_detected', expect.any(Object));
    });
  });

  // ── L19: FermentationMonitorService ───────────────────────────────────────
  describe('L19 — FermentationMonitorService', () => {
    it('triggers critical overpressure alert if degas interval exceeded', () => {
      const res = FermentationMonitorService.evaluateBatch({
        tenantId: 'tenant-1',
        batchId: 'BATCH-KOMBUCHA-04',
        recipeName: 'Kombucha Gingembre',
        type: 'kombucha',
        startedAt: Date.now() - 48 * 3600 * 1000,
        currentBrix: 4.5,
        targetBrix: 4.0,
        currentPh: 3.1,
        minSafePh: 2.5,
        maxSafePh: 4.2,
        hoursSinceLastDegas: 40,
        maxDegasIntervalHours: 24,
      });

      expect(res.isCriticalOverpressure).toBe(true);
      expect(res.recommendation).toContain('DANGER SURPRESSION');
    });
  });

  // ── L20: CocktailDilutionIndexService ─────────────────────────────────────
  describe('L20 — CocktailDilutionIndexService', () => {
    it('computes slower dilution for clear ice block vs standard cube', () => {
      const clearIce = CocktailDilutionIndexService.computeDilution({
        recipeName: 'Old Fashioned',
        liquidVolumeCl: 6,
        alcoholVolumePct: 40,
        iceType: 'clear_ice_block',
        technique: 'stirred',
        durationSeconds: 20,
      });

      const standardIce = CocktailDilutionIndexService.computeDilution({
        recipeName: 'Old Fashioned',
        liquidVolumeCl: 6,
        alcoholVolumePct: 40,
        iceType: 'cube_standard',
        technique: 'stirred',
        durationSeconds: 20,
      });

      expect(clearIce.dilutionPct).toBeLessThan(standardIce.dilutionPct);
      expect(clearIce.finalAbvPct).toBeGreaterThan(standardIce.finalAbvPct);
    });
  });

  // ── L24: MenuComboTaxProrataService ───────────────────────────────────────
  describe('L24 — MenuComboTaxProrataService', () => {
    it('prorates multi-tax menu combo price with residual penny check', () => {
      const result = MenuComboTaxProrataService.computeProratedTax({
        comboName: 'Menu Midi Formule Express',
        comboFixedPriceInMicrounits: 19_500_000, // 19.50 €
        components: [
          { productId: 'PLAT', name: 'Plat du jour', standalonePriceInMicrounits: 16_000_000, taxRate: '0.10' },
          { productId: 'VIN', name: 'Verre de vin', standalonePriceInMicrounits: 6_000_000, taxRate: '0.20' },
          { productId: 'PAIN', name: 'Pain artisanal', standalonePriceInMicrounits: 2_000_000, taxRate: '0.055' },
        ],
      });

      expect(result.isExactCentimeSum).toBe(true);
      expect(result.totalTtcInMicrounits).toBe(19_500_000);
      expect(result.lines.length).toBe(3);
    });
  });

  // ── L27: SmartCardRoutingService ──────────────────────────────────────────
  describe('L27 — SmartCardRoutingService', () => {
    it('detects CONECS BIN and routes directly avoiding double commission', () => {
      const decision = SmartCardRoutingService.routeCardPayment('535522123456', 25_000_000);
      expect(decision.network).toBe('conecs_meal_voucher');
      expect(decision.recommendedTpeRoute).toBe('conecs_direct');
      expect(decision.isDoubleCommissionPrevented).toBe(true);
      expect(decision.savingsEstimatedInMicrounits).toBeGreaterThan(0);
    });

    it('routes standard CB to domestic route', () => {
      const decision = SmartCardRoutingService.routeCardPayment('497010123456', 50_000_000);
      expect(decision.network).toBe('cb_standard');
      expect(decision.recommendedTpeRoute).toBe('cb_domestic');
    });
  });

  // ── L41: PrinterFailoverRoutingService ────────────────────────────────────
  describe('L41 — PrinterFailoverRoutingService', () => {
    it('redirects print job to backup printer when paper runs out', () => {
      const decision = PrinterFailoverRoutingService.resolvePrinter(
        'tenant-1',
        { primaryPrinterId: 'PRN-HOT', backupPrinterId: 'PRN-PASS', station: 'cuisine_chaude' },
        { printerId: 'PRN-HOT', isOnline: true, paperRemaining: 'empty', errorCount: 0 }
      );

      expect(decision.isFailoverActive).toBe(true);
      expect(decision.targetPrinterId).toBe('PRN-PASS');
      expect(decision.alertBannerText).toContain('paper_out');
    });
  });

  // ── L43: HardenedTouchUiHelper ────────────────────────────────────────────
  describe('L43 — HardenedTouchUiHelper', () => {
    it('validates touch target >= 64x64px for wet hands kitchen UI', () => {
      const valid = HardenedTouchUiHelper.validateTargetSize({ widthPx: 72, heightPx: 64 });
      expect(valid.isValid).toBe(true);

      const invalid = HardenedTouchUiHelper.validateTargetSize({ widthPx: 48, heightPx: 48 });
      expect(valid.isValid).toBe(true);
      expect(invalid.isValid).toBe(false);
      expect(invalid.violationMessage).toContain('below hardened standard');
    });
  });


  // ── L81: BilingualTipGratuityHelper ───────────────────────────────────────
  describe('L81 — BilingualTipGratuityHelper', () => {
    it('formats bilingual legal notices and calculated tip suggestions', () => {
      const footer = BilingualTipGratuityHelper.formatBilingualFooter(50_000_000); // 50.00 €
      expect(footer.legalNoticeFr).toContain('Service 15% inclus');
      expect(footer.legalNoticeEn).toContain('15% service charge');
      expect(footer.suggestedTips).toEqual([
        { percentage: 5, amountInMicrounits: 2_500_000, labelFr: 'Pourboire optionnel 5% (2.50 €)', labelEn: 'Optional gratuity 5% (€2.50)' },
        { percentage: 10, amountInMicrounits: 5_000_000, labelFr: 'Pourboire optionnel 10% (5.00 €)', labelEn: 'Optional gratuity 10% (€5.00)' },
        { percentage: 15, amountInMicrounits: 7_500_000, labelFr: 'Pourboire optionnel 15% (7.50 €)', labelEn: 'Optional gratuity 15% (€7.50)' },
      ]);
    });
  });
});
