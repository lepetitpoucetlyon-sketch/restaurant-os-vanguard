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

import { TpeResilienceSimulatorService } from '@/modules/ops/service/pos/services/TpeResilienceSimulatorService';
import { PosFiscalSealE2EPipeline } from '@/modules/ops/service/pos/services/PosFiscalSealE2EPipeline';
import { SplitBillService } from '@/modules/ops/service/pos/services/SplitBillService';
import { CashDrawerReconciliationService } from '@/modules/ops/service/pos/services/CashDrawerReconciliationService';
import { MealVoucherLimitGuard } from '@/modules/ops/service/pos/services/MealVoucherLimitGuard';
import { ExactChangeAssistanceService } from '@/modules/ops/service/pos/services/ExactChangeAssistanceService';
import { SharedBillDispatchService } from '@/modules/ops/service/pos/services/SharedBillDispatchService';
import { UniversalPrinterBridgeService } from '@/modules/ops/service/pos/services/UniversalPrinterBridgeService';
import { CashDrawerTriggerService } from '@/modules/ops/service/pos/services/CashDrawerTriggerService';
import { CustomerFacingDisplayService } from '@/modules/ops/service/pos/services/CustomerFacingDisplayService';
import { BarcodeScannerInputService } from '@/modules/ops/service/pos/services/BarcodeScannerInputService';


describe('Angles Morts — Batch 4 (POS, Encaissement, Bar & Hardware)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── A1: TpeResilienceSimulatorService ────────────────────────────────────
  describe('A1 — TpeResilienceSimulatorService', () => {
    it('pings provider and returns health report', async () => {
      const ping = await TpeResilienceSimulatorService.ping('ingenico');
      expect(ping.reachable).toBe(true);
      expect(ping.standInModeAvailable).toBe(true);
      expect(ping.batteryLevelPct).toBe(88);
    });

    it('simulates successful transaction and publishes event', async () => {
      const res = await TpeResilienceSimulatorService.simulateTransaction({
        tenantId: 'tenant-1',
        provider: 'stripe_terminal',
        amountInMicrounits: 35_000_000,
      });

      expect(res.success).toBe(true);
      expect(res.authCode).toBeDefined();
      expect(NexusEventBus.emit).toHaveBeenCalledWith('pos.tpe_simulation_completed', expect.any(Object));
    });

    it('triggers stand-in mode on timeout fault for supported terminal', async () => {
      const res = await TpeResilienceSimulatorService.simulateTransaction({
        tenantId: 'tenant-1',
        provider: 'verifone',
        amountInMicrounits: 20_000_000,
        simulateFault: 'timeout',
      });

      expect(res.success).toBe(false);
      expect(res.fallbackToStandIn).toBe(true);
    });
  });

  // ── A2: PosFiscalSealE2EPipeline ──────────────────────────────────────────
  describe('A2 — PosFiscalSealE2EPipeline', () => {
    it('executes full E2E sealing pipeline with tax breakdown', async () => {
      const result = await PosFiscalSealE2EPipeline.processOrderAndSeal(
        'tenant-1',
        'ORD-101',
        'TCK-0042',
        [
          { productId: 'P1', name: 'Burger', quantity: 2, unitPriceInMicrounits: 15_000_000, taxRate: '0.10' },
          { productId: 'P2', name: 'Bière', quantity: 1, unitPriceInMicrounits: 7_000_000, taxRate: '0.20' },
        ],
        [
          { method: 'cb', amountInMicrounits: 37_000_000 },
        ]
      );

      expect(result.orderId).toBe('ORD-101');
      expect(result.totalInMicrounits).toBe(37_000_000);
      expect(result.isFullyPaid).toBe(true);
      expect(result.seal.hash).toBeDefined();
      expect(result.taxSummary['0.10']).toBeDefined();
      expect(result.taxSummary['0.20']).toBeDefined();
    });

    it('throws error if payment is underpaid', async () => {
      await expect(
        PosFiscalSealE2EPipeline.processOrderAndSeal(
          'tenant-1',
          'ORD-102',
          'TCK-0043',
          [{ productId: 'P1', name: 'Burger', quantity: 1, unitPriceInMicrounits: 15_000_000, taxRate: '0.10' }],
          [{ method: 'cash', amountInMicrounits: 10_000_000 }]
        )
      ).rejects.toThrow('Incomplete payment');
    });
  });

  // ── A3: SplitBillService ──────────────────────────────────────────────────
  describe('A3 — SplitBillService (Microunits Remainder Rule)', () => {
    it('splits bill 3 ways with indivisible penny allocated to last guest', () => {
      // 10.00 € = 10_000_000 microunits / 3 = 3_333_333 each, remainder = 1 microunit
      const result = SplitBillService.splitEquipartition('tenant-1', 'ORD-201', 10_000_000, 3);
      expect(result.parts.length).toBe(3);
      expect(result.parts[0].amountInMicrounits).toBe(3_333_333);
      expect(result.parts[1].amountInMicrounits).toBe(3_333_333);
      expect(result.parts[2].amountInMicrounits).toBe(3_333_334);
      expect(result.isExactSum).toBe(true);
    });

    it('splits bill by percentages exactly summing to 100%', () => {
      const result = SplitBillService.splitByPercentages('tenant-1', 'ORD-202', 100_000_000, [50, 25, 25]);
      expect(result.parts[0].amountInMicrounits).toBe(50_000_000);
      expect(result.parts[1].amountInMicrounits).toBe(25_000_000);
      expect(result.parts[2].amountInMicrounits).toBe(25_000_000);
      expect(result.isExactSum).toBe(true);
    });

    it('rejects percentage sum not equal to 100', () => {
      expect(() => SplitBillService.splitByPercentages('tenant-1', 'ORD-203', 100_000_000, [50, 40])).toThrow('must equal 100%');
    });
  });

  // ── A4: CashDrawerReconciliationService ────────────────────────────────────
  describe('A4 — CashDrawerReconciliationService', () => {
    it('reconciles balanced drawer', async () => {
      const res = await CashDrawerReconciliationService.reconcile({
        tenantId: 'tenant-1',
        adminId: 'ADM-1',
        sessionDateIso: '2026-08-21',
        openingFloatInMicrounits: 150_000_000, // 150€
        cashSalesInMicrounits: 350_000_000,   // 350€ -> Total expected 500€
        countedDenominations: [
          { denominationInMicrounits: 50_000_000, count: 10 }, // 500€
        ],
      });

      expect(res.varianceInMicrounits).toBe(0);
      expect(res.varianceStatus).toBe('balanced');
      expect(res.isAcceptable).toBe(true);
    });

    it('flags shortage variance and logs audit', async () => {
      const auditSpy = vi.spyOn(AuditLogger, 'logAction');
      const res = await CashDrawerReconciliationService.reconcile({
        tenantId: 'tenant-1',
        adminId: 'ADM-1',
        sessionDateIso: '2026-08-21',
        openingFloatInMicrounits: 100_000_000,
        cashSalesInMicrounits: 100_000_000,
        countedDenominations: [
          { denominationInMicrounits: 50_000_000, count: 3 }, // 150€ (shortage 50€)
        ],
      });

      expect(res.varianceInMicrounits).toBe(-50_000_000);
      expect(res.varianceStatus).toBe('shortage');
      expect(res.isAcceptable).toBe(false);
      expect(auditSpy).toHaveBeenCalledWith(expect.objectContaining({ action: 'CASH_DRAWER_VARIANCE' }));
    });
  });

  // ── A5: MealVoucherLimitGuard ──────────────────────────────────────────────
  describe('A5 — MealVoucherLimitGuard', () => {
    it('permits valid meal voucher under 25€ legal ceiling', async () => {
      const res = await MealVoucherLimitGuard.validate({
        tenantId: 'tenant-1',
        orderId: 'ORD-301',
        requestedVoucherAmountInMicrounits: 22_000_000,
        items: [
          { productId: 'P1', category: 'food', amountInMicrounits: 20_000_000 },
          { productId: 'P2', category: 'drink_non_alcoholic', amountInMicrounits: 5_000_000 },
        ],
      });

      expect(res.allowed).toBe(true);
      expect(res.eligibleAmountInMicrounits).toBe(25_000_000);
      expect(res.maxVoucherUsableInMicrounits).toBe(25_000_000);
    });

    it('rejects meal voucher on alcohol only', async () => {
      const res = await MealVoucherLimitGuard.validate({
        tenantId: 'tenant-1',
        orderId: 'ORD-302',
        requestedVoucherAmountInMicrounits: 20_000_000,
        items: [
          { productId: 'P3', category: 'alcohol', amountInMicrounits: 40_000_000 },
        ],
      });

      expect(res.allowed).toBe(false);
      expect(res.rejectedReason).toBe('ineligible_items_only');
    });

    it('rejects when requested voucher exceeds 25€ legal limit', async () => {
      const res = await MealVoucherLimitGuard.validate({
        tenantId: 'tenant-1',
        orderId: 'ORD-303',
        adminId: 'MGR-1',
        requestedVoucherAmountInMicrounits: 30_000_000,
        items: [
          { productId: 'P1', category: 'food', amountInMicrounits: 50_000_000 },
        ],
      });

      expect(res.allowed).toBe(false);
      expect(res.rejectedReason).toBe('exceeds_daily_limit');
    });
  });

  // ── A6: ExactChangeAssistanceService ──────────────────────────────────────
  describe('A6 — ExactChangeAssistanceService', () => {
    it('computes exact change due with breakdown', () => {
      // Due 13.50€ (13_500_000), Tendered 20.00€ (20_000_000) -> Change 6.50€ (6_500_000)
      const res = ExactChangeAssistanceService.computeChange(13_500_000, 20_000_000);
      expect(res.changeDueInMicrounits).toBe(6_500_000);
      expect(res.isExactChange).toBe(false);
      expect(res.isUnderpaid).toBe(false);
      expect(res.breakdown).toEqual([
        { name: 'Billet 5€', valueInMicrounits: 5_000_000, count: 1 },
        { name: 'Pièce 1€', valueInMicrounits: 1_000_000, count: 1 },
        { name: 'Pièce 50c', valueInMicrounits: 500_000, count: 1 },
      ]);
    });

    it('handles exact amount tendered', () => {
      const res = ExactChangeAssistanceService.computeChange(15_000_000, 15_000_000);
      expect(res.isExactChange).toBe(true);
      expect(res.changeDueInMicrounits).toBe(0);
      expect(res.breakdown.length).toBe(0);
    });
  });

  // ── A7: SharedBillDispatchService ─────────────────────────────────────────
  describe('A7 — SharedBillDispatchService', () => {
    it('dispatches digital bill link and emits event', async () => {
      const res = await SharedBillDispatchService.dispatchBill({
        tenantId: 'tenant-1',
        orderId: 'ORD-401',
        tableNumber: '12',
        totalInMicrounits: 45_000_000,
        channel: 'qr',
      });

      expect(res.shareUrl).toContain('/b/BILL-tenant-1-ORD-401');
      expect(res.qrDataUri).toContain('data:image/svg+xml');
      expect(NexusEventBus.emit).toHaveBeenCalledWith('pos.shared_bill_dispatched', expect.any(Object));
    });
  });

  // ── I1: UniversalPrinterBridgeService ─────────────────────────────────────
  describe('I1 — UniversalPrinterBridgeService', () => {
    it('formats raw ESC/POS byte sequence with cut and drawer pulse', () => {
      const bytes = UniversalPrinterBridgeService.formatRawPayload(
        'esc_pos',
        ['RESTAURANT OS', 'Ticket #123'],
        { cutPaper: true, openDrawer: true }
      );

      expect(bytes.length).toBeGreaterThan(10);
      expect(bytes[0]).toBe(0x1B); // ESC
      expect(bytes[1]).toBe(0x40); // @
    });

    it('sends print job and measures telemetry', async () => {
      const res = await UniversalPrinterBridgeService.sendPrintJob(
        {
          id: 'PRN-KITCHEN',
          name: 'Epson TM-T88',
          protocol: 'esc_pos',
          interfaceType: 'network_tcp',
          address: '192.168.1.50:9100',
          paperWidthMm: 80,
        },
        {
          tenantId: 'tenant-1',
          printerId: 'PRN-KITCHEN',
          documentType: 'kitchen_ticket',
          contentLines: ['2x Entrecôte saignante'],
        }
      );

      expect(res.status).toBe('sent');
      expect(res.rawBytesLength).toBeGreaterThan(0);
    });
  });

  // ── I2: CashDrawerTriggerService ──────────────────────────────────────────
  describe('I2 — CashDrawerTriggerService', () => {
    it('triggers drawer kick and audits manual opening', async () => {
      const auditSpy = vi.spyOn(AuditLogger, 'logAction');
      const res = await CashDrawerTriggerService.triggerOpen({
        tenantId: 'tenant-1',
        adminId: 'BARMAN-1',
        terminalId: 'POS-MAIN',
        reason: 'manual_open',
      });

      expect(res.triggered).toBe(true);
      expect(res.pulseSequenceHex).toBe('1B700019FA');
      expect(auditSpy).toHaveBeenCalledWith(expect.objectContaining({ action: 'CASH_DRAWER_OPENED' }));
    });
  });

  // ── I3: CustomerFacingDisplayService ──────────────────────────────────────
  describe('I3 — CustomerFacingDisplayService', () => {
    it('formats 2x20 VFD lines for idle and scanning states', () => {
      const idle = CustomerFacingDisplayService.formatVfdLines({
        terminalId: 'VFD-1',
        state: 'idle',
      });
      expect(idle.line1.length).toBe(20);
      expect(idle.line2.length).toBe(20);

      const scanning = CustomerFacingDisplayService.formatVfdLines({
        terminalId: 'VFD-1',
        state: 'scanning',
        items: [{ name: 'Croissant', quantity: 1, priceInMicrounits: 1_500_000, totalInMicrounits: 1_500_000 }],
        totalInMicrounits: 1_500_000,
      });
      expect(scanning.line1).toContain('Croissant');
      expect(scanning.line2).toContain('TOTAL: 1.50E');
    });
  });

  // ── I4: BarcodeScannerInputService ────────────────────────────────────────
  describe('I4 — BarcodeScannerInputService', () => {
    it('parses standard EAN13 barcode', () => {
      const parsed = BarcodeScannerInputService.parseBarcode('3017620422003');
      expect(parsed.symbology).toBe('EAN13');
      expect(parsed.isVariableWeight).toBe(false);
      expect(parsed.sku).toBe('3017620422003');
    });

    it('parses in-store variable weight barcode (prefix 28)', () => {
      // 28 1234 000450 C -> SKU-1234 with 450 grams
      const parsed = BarcodeScannerInputService.parseBarcode('2812340004505');
      expect(parsed.isVariableWeight).toBe(true);
      expect(parsed.sku).toBe('SKU-1234');
      expect(parsed.weightGrams).toBe(450);
    });
  });

  // ── L15: FlashAlcoholInventoryService ─────────────────────────────────────
});
