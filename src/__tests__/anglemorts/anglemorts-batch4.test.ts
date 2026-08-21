import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/nexus/NexusAdapter', () => ({
  Nexus: { adapter: { get: vi.fn(), set: vi.fn(), query: vi.fn() } },
}));
vi.mock('@/shared/eventBus/NexusEventBus', () => ({
  NexusEventBus: { emit: vi.fn(), emitDurable: vi.fn() },
}));
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
import { AuditLogger } from '@/modules/compliance/securite/AuditLogger';

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
import { FlashAlcoholInventoryService } from '@/modules/ops/service/pos/services/FlashAlcoholInventoryService';
import { CorkedBottleDisputeService } from '@/modules/ops/service/pos/services/CorkedBottleDisputeService';
import { KegHydrostaticLossService } from '@/modules/ops/service/pos/services/KegHydrostaticLossService';
import { SmartSpoutTelemetryService } from '@/modules/ops/service/pos/services/SmartSpoutTelemetryService';
import { FermentationMonitorService } from '@/modules/ops/service/pos/services/FermentationMonitorService';
import { CocktailDilutionIndexService } from '@/modules/ops/service/pos/services/CocktailDilutionIndexService';
import { MenuComboTaxProrataService } from '@/modules/finance/fiscalite/MenuComboTaxProrataService';
import { SmartCardRoutingService } from '@/modules/finance/tresorerie/SmartCardRoutingService';
import { PrinterFailoverRoutingService } from '@/modules/ops/service/pos/services/PrinterFailoverRoutingService';
import { HardenedTouchUiHelper } from '@/modules/ops/service/pos/services/HardenedTouchUiHelper';
import { ThermalOverheatP2PFailoverService } from '@/modules/ops/service/pos/services/ThermalOverheatP2PFailoverService';
import { BilingualTipGratuityHelper } from '@/modules/ops/service/pos/services/BilingualTipGratuityHelper';

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

  // ── L45: ThermalOverheatP2PFailoverService ─────────────────────────────────
  describe('L45 — ThermalOverheatP2PFailoverService', () => {
    it('triggers P2P failover QR when tablet temperature >= 50°C', async () => {
      const res = await ThermalOverheatP2PFailoverService.evaluateThermalState({
        tenantId: 'tenant-1',
        deviceId: 'IPAD-TERRASSE-01',
        deviceModel: 'iPad Pro 11',
        batteryTempCelsius: 52.4,
        cpuTempCelsius: 54.1,
        activeOrderId: 'ORD-TERRASSE-42',
      });

      expect(res.isOverheated).toBe(true);
      expect(res.failoverTriggered).toBe(true);
      expect(res.failoverQrPayload).toContain('ORD-TERRASSE-42');
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
