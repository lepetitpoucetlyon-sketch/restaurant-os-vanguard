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

import { SmartSpoutTelemetryService } from '@/modules/ops/service/restaurant/pos/services/SmartSpoutTelemetryService';
import { MenuComboTaxProrataService } from '@/modules/finance/fiscalite/MenuComboTaxProrataService';
import { SmartCardRoutingService } from '@/modules/finance/tresorerie/SmartCardRoutingService';
import { PrinterFailoverRoutingService } from '@/modules/ops/service/restaurant/pos/services/PrinterFailoverRoutingService';
import { HardenedTouchUiHelper } from '@/modules/ops/service/restaurant/pos/services/HardenedTouchUiHelper';
import { BilingualTipGratuityHelper } from '@/modules/ops/service/restaurant/pos/services/BilingualTipGratuityHelper';
describe('Angles Morts — Batch 4 (Part 2)', () => {
  beforeEach(() => { vi.clearAllMocks(); });


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
