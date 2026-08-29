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

import { AuditLogger } from '@/lib/audit';

import { HCRPayrollCalculatorService } from '@/modules/human/remuneration/payroll/services/HCRPayrollCalculatorService';
import { ShiftPlanningConflictService } from '@/modules/human/effectifs/planning/ShiftPlanningConflictService';
import { TimeClockPunchService } from '@/modules/human/effectifs/hr/services/TimeClockPunchService';
import { LeaveManagementService } from '@/modules/human/effectifs/hr/services/LeaveManagementService';
import { DpaeConnectorService } from '@/modules/human/effectifs/hr/services/DpaeConnectorService';
import { MercurialePriceComparisonService } from '@/modules/logistics/approvisionnement/procurement/services/MercurialePriceComparisonService';
import { RfaContractCalculationService } from '@/modules/logistics/approvisionnement/procurement/services/RfaContractCalculationService';
import { SupplierDisputeWorkflowService } from '@/modules/logistics/approvisionnement/procurement/services/SupplierDisputeWorkflowService';
import { DlcExpiryAlertScheduler } from '@/modules/logistics/stock/inventory/services/DlcExpiryAlertScheduler';
import { PerpetualInventoryWorkflowService } from '@/modules/logistics/stock/inventory/services/PerpetualInventoryWorkflowService';
import { DeliveryPlatformAdapterService } from '@/modules/commerce/relation/delivery/services/DeliveryPlatformAdapterService';
import { DeliveryCommissionPnLService } from '@/modules/commerce/relation/delivery/services/DeliveryCommissionPnLService';
import { DeliveryStorePauseService } from '@/modules/commerce/relation/delivery/services/DeliveryStorePauseService';
import { VariableWeightStockService } from '@/modules/logistics/stock/inventory/services/VariableWeightStockService';
import { DoublePassOcrService } from '@/modules/logistics/approvisionnement/procurement/services/DoublePassOcrService';
import { SkuSubstitutionAlertService } from '@/modules/logistics/approvisionnement/procurement/services/SkuSubstitutionAlertService';


describe('Angles Morts — Batch 6 (RH HCR, Stocks, Achats & Livraison)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── G1: HCRPayrollCalculatorService ──────────────────────────────────────
  describe('G1 — HCRPayrollCalculatorService', () => {
    it('calculates HCR overtime tranches and night work bonus', () => {
      const res = HCRPayrollCalculatorService.computeMonthlyPayroll('tenant-1', 'ADM-1', '2026-08', {
        employeeId: 'EMP-01',
        employeeName: 'Jean Dupont',
        contractualMonthlyHours: 151.67,
        hourlyRateInMicrounits: 12_000_000, // 12.00 € / h
        totalHoursWorked: 180,              // ~28.33h overtime
        nightHoursWorked: 20,               // 20h between 22h-06h (+30%)
        sundayHoursWorked: 8,               // 8h Sunday (+20%)
        guaranteedHolidayHoursWorked: 0,
      });

      expect(res.basePayInMicrounits).toBe(1_820_040_000); // 151.67 * 12€ = 1820.04€
      expect(res.nightBonusInMicrounits).toBe(72_000_000); // 20h * 12€ * 30% = 72.00€
      expect(res.sundayBonusInMicrounits).toBe(19_200_000); // 8h * 12€ * 20% = 19.20€
      expect(res.totalGrossInMicrounits).toBeGreaterThan(res.basePayInMicrounits);
      expect(AuditLogger.logAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'HCR_PAYROLL_CALCULATED' }));
    });
  });

  // ── G2: ShiftPlanningConflictService ──────────────────────────────────────
  describe('G2 — ShiftPlanningConflictService', () => {
    it('detects insufficient rest between consecutive shifts (<11h)', () => {
      const report = ShiftPlanningConflictService.validateShift(
        'tenant-1',
        { shiftId: 'S-2', employeeId: 'EMP-1', startTs: 1700000000000 + (6 * 3600 * 1000), endTs: 1700000000000 + (14 * 3600 * 1000) },
        [{ shiftId: 'S-1', employeeId: 'EMP-1', startTs: 1700000000000 - (8 * 3600 * 1000), endTs: 1700000000000 }] // Ended at T0, next starts at T0+6h (6h rest < 11h)
      );

      expect(report.isValid).toBe(false);
      expect(report.conflicts[0].type).toBe('daily_rest_insufficient');
    });
  });

  // ── G3: TimeClockPunchService ─────────────────────────────────────────────
  describe('G3 — TimeClockPunchService', () => {
    it('records punch with geofence validation and audit trail', async () => {
      const punch = await TimeClockPunchService.recordPunch({
        tenantId: 'tenant-1',
        employeeId: 'EMP-42',
        punchType: 'in',
        clientGpsCoordinates: { latitude: 45.7640, longitude: 4.8357 },
        allowedRestaurantGps: { latitude: 45.7641, longitude: 4.8356, maxRadiusMeters: 100 },
      });

      expect(punch.isGeofenceValid).toBe(true);
      expect(punch.sealedHash).toContain('SHA256-PUNCH');
      expect(AuditLogger.logAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'TIME_CLOCK_PUNCH_RECORDED' }));
    });
  });

  // ── G4: LeaveManagementService ────────────────────────────────────────────
  describe('G4 — LeaveManagementService', () => {
    it('rejects leave request if CP balance is insufficient', async () => {
      const res = await LeaveManagementService.processLeaveRequest(
        'MGR-1',
        {
          requestId: 'LEAVE-01',
          tenantId: 'tenant-1',
          employeeId: 'EMP-1',
          employeeName: 'Sophie',
          leaveType: 'cp',
          startDateIso: '2026-09-01',
          endDateIso: '2026-09-10',
          daysCount: 8,
          currentCpBalanceDays: 5, // 5 days < 8 days
        },
        true,
        true
      );

      expect(res.isApproved).toBe(false);
      expect(res.rejectReason).toContain('Solde CP insuffisant');
    });
  });

  // ── G5/L39: DpaeConnectorService ──────────────────────────────────────────
  describe('G5/L39 — DpaeConnectorService', () => {
    it('submits DPAE payload and generates URSSAF reference receipt', async () => {
      const receipt = await DpaeConnectorService.submitDpae({
        tenantId: 'tenant-1',
        adminId: 'MGR-1',
        employeeId: 'EMP-EXTRA-1',
        nirNumber: '190017512345678',
        firstName: 'Lucas',
        lastName: 'Morel',
        birthDateIso: '1990-01-15',
        birthCity: 'Paris',
        hireDateIso: '2026-08-22',
        hireTime: '18:00',
        contractType: 'extra',
        employerSiret: '80012345600012',
        urssafCenterCode: '690',
      });

      expect(receipt.status).toBe('acknowledged');
      expect(receipt.urssafDpaeReference).toContain('DPAE-URSSAF-800123456');
      expect(AuditLogger.logAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'DPAE_SUBMITTED' }));
    });
  });

  // ── H1: MercurialePriceComparisonService ──────────────────────────────────
  describe('H1 — MercurialePriceComparisonService', () => {
    it('picks cheapest wholesaler offer and computes price spread', () => {
      const rep = MercurialePriceComparisonService.compareMercuriales('tenant-1', 'BEURRE-82', [
        { supplierId: 'METRO', supplierName: 'Metro', sku: 'BEURRE-82', productName: 'Beurre Doux 82% 1kg', unitPriceInMicrounits: 7_800_000, minOrderQuantity: 5, deliveryLeadTimeDays: 1 },
        { supplierId: 'TRANSGOURMET', supplierName: 'Transgourmet', sku: 'BEURRE-82', productName: 'Beurre Doux 82% 1kg', unitPriceInMicrounits: 7_200_000, minOrderQuantity: 10, deliveryLeadTimeDays: 2 },
        { supplierId: 'SYSCO', supplierName: 'Sysco', sku: 'BEURRE-82', productName: 'Beurre Doux 82% 1kg', unitPriceInMicrounits: 8_100_000, minOrderQuantity: 1, deliveryLeadTimeDays: 1 },
      ]);

      expect(rep.bestOffer.supplierId).toBe('TRANSGOURMET');
      expect(rep.bestOffer.unitPriceInMicrounits).toBe(7_200_000);
      expect(rep.maxPriceSpreadInMicrounits).toBe(900_000); // 8.10 - 7.20 = 0.90 €
    });
  });

  // ── H2: RfaContractCalculationService ─────────────────────────────────────
  describe('H2 — RfaContractCalculationService', () => {
    it('computes annual volume rebate based on contract tiers', () => {
      const res = RfaContractCalculationService.computeRfa(
        'tenant-1',
        {
          supplierId: 'METRO',
          supplierName: 'Metro Cash & Carry',
          periodYear: 2026,
          tiers: [
            { minAnnualSpendInMicrounits: 30_000_000_000, maxAnnualSpendInMicrounits: 60_000_000_000, rebatePct: 2.0 },
            { minAnnualSpendInMicrounits: 60_000_000_000, maxAnnualSpendInMicrounits: 100_000_000_000, rebatePct: 3.5 },
          ],
        },
        75_000_000_000 // 75 000 € annual spend -> tier 2 (3.5%)
      );

      expect(res.effectiveRebatePct).toBe(3.5);
      expect(res.rfaDueInMicrounits).toBe(2_625_000_000); // 75 000 * 3.5% = 2 625.00 €
      expect(res.accountingAccountCode).toBe('609000');
    });
  });

  // ── H3/L31: SupplierDisputeWorkflowService ────────────────────────────────
  describe('H3/L31 — SupplierDisputeWorkflowService', () => {
    it('opens dispute, blocks SEPA debit and logs audit', async () => {
      const dispute = await SupplierDisputeWorkflowService.openDispute({
        tenantId: 'tenant-1',
        adminId: 'CHEF-1',
        deliverySlipId: 'BL-8899',
        supplierId: 'POMONA',
        supplierName: 'Pomona Terre Azur',
        disputedSku: 'SAUMON-FRAIS',
        productName: 'Filet de Saumon Label Rouge',
        reason: 'temperature_break',
        disputedAmountInMicrounits: 280_000_000, // 280.00 €
      });

      expect(dispute.sepaPaymentHold).toBe(true);
      expect(dispute.creditNoteExpectedInMicrounits).toBe(280_000_000);
      expect(AuditLogger.logAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'SUPPLIER_DISPUTE_SEQUESTRATED' }));
    });
  });

  // ── H4: DlcExpiryAlertScheduler ───────────────────────────────────────────
  describe('H4 — DlcExpiryAlertScheduler', () => {
    it('flags J-1 DLC expiry with immediate kitchen action', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const alert = DlcExpiryAlertScheduler.evaluateBatchDLC('tenant-1', {
        batchId: 'BATCH-CREME-01',
        sku: 'CREME-35',
        name: 'Crème liquide 35% 1L',
        expiryDateIso: tomorrow.toISOString().split('T')[0],
        quantityInStock: 6,
        unit: 'L',
        costInMicrounits: 24_000_000,
      });

      expect(alert.alertSeverity).toBe('j_minus_1');
      expect(alert.recommendedAction).toContain('Cuisiner impérativement ce jour');
    });
  });

  // ── H5: PerpetualInventoryWorkflowService ─────────────────────────────────
  describe('H5 — PerpetualInventoryWorkflowService', () => {
    it('reconciles inventory count and calculates financial shrinkage', async () => {
      const rep = await PerpetualInventoryWorkflowService.reconcileCategoryInventory(
        'tenant-1',
        'CHEF-1',
        'viandes',
        [
          { sku: 'COTE-BOEUF', name: 'Côte de bœuf', expectedQuantity: 10, countedQuantity: 8, unitCostInMicrounits: 25_000_000 }, // -2 * 25€ = -50€
          { sku: 'MAGRET', name: 'Magret canard', expectedQuantity: 15, countedQuantity: 15, unitCostInMicrounits: 8_000_000 },
        ]
      );

      expect(rep.totalVarianceInMicrounits).toBe(-50_000_000); // -50.00 € shrinkage
      expect(rep.hasDiscrepancies).toBe(true);
      expect(AuditLogger.logAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'PERPETUAL_INVENTORY_VARIANCE_POSTED' }));
    });
  });

  // ── F1: DeliveryPlatformAdapterService ────────────────────────────────────
  describe('F1 — DeliveryPlatformAdapterService', () => {
    it('normalizes external Uber Eats order into standard POS order', () => {
      const order = DeliveryPlatformAdapterService.normalizeOrder('tenant-1', {
        platform: 'uber_eats',
        platformOrderId: 'UBER-9876',
        customerName: 'Claire D.',
        orderLines: [
          { sku: 'BURGER-1', name: 'Cheeseburger', qty: 2, unitPriceInMicrounits: 14_000_000 },
        ],
        platformCommissionInMicrounits: 8_400_000,
      });

      expect(order.posOrderId).toBe('POS-DELIV-UBER_EATS-UBER-9876');
      expect(order.totalInMicrounits).toBe(28_000_000);
    });
  });

  // ── F2: DeliveryCommissionPnLService ──────────────────────────────────────
  describe('F2 — DeliveryCommissionPnLService', () => {
    it('computes net merchant revenue deducting 30% platform commission', () => {
      const pnl = DeliveryCommissionPnLService.computeOrderPnL('tenant-1', {
        platform: 'deliveroo',
        platformOrderId: 'DELIV-5544',
        grossTtcInMicrounits: 40_000_000, // 40.00 €
        foodCostInMicrounits: 10_000_000, // 10.00 €
        packagingCostInMicrounits: 1_200_000, // 1.20 €
        negotiatedCommissionPct: 30, // 30% = 12.00 €
      });

      expect(pnl.commissionInMicrounits).toBe(12_000_000);
      expect(pnl.netMerchantInMicrounits).toBe(28_000_000);
      expect(pnl.netContributionMarginInMicrounits).toBe(16_800_000); // 28 - 10 - 1.2 = 16.80 €
    });
  });

  // ── F3: DeliveryStorePauseService ─────────────────────────────────────────
  describe('F3 — DeliveryStorePauseService', () => {
    it('pauses delivery platforms during kitchen rush', async () => {
      const status = await DeliveryStorePauseService.pauseStore({
        tenantId: 'tenant-1',
        adminId: 'CHEF-1',
        platform: 'all',
        reason: 'kitchen_rush',
        pauseDurationMinutes: 45,
      });

      expect(status.isPaused).toBe(true);
      expect(status.autoResumeAt).toBeGreaterThan(Date.now());
      expect(AuditLogger.logAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'DELIVERY_STORE_PAUSED' }));
    });
  });

  // ── L28: VariableWeightStockService ───────────────────────────────────────
  describe('L28 — VariableWeightStockService', () => {
    it('calculates true yield and effective cost per usable kg on whole salmon', () => {
      const res = VariableWeightStockService.evaluateYield('tenant-1', {
        sku: 'SAUMON-ENTIER',
        lotId: 'LOT-SAUMON-01',
        productName: 'Saumon Atlantique Entier 4-5kg',
        grossWeightGrams: 4500,
        tareGrams: 0,
        netWeightGrams: 4500,
        usableWeightGrams: 3150, // 70% yield (loss of head/bones/skin)
        billedUnitPricePerKgInMicrounits: 12_000_000, // 12€/kg brute -> 54.00€ total
      });

      expect(res.totalCostInMicrounits).toBe(54_000_000);
      expect(res.yieldPct).toBe(70);
      expect(res.parageLossGrams).toBe(1350);
      expect(res.effectiveCostPerUsableKgInMicrounits).toBe(17_142_857); // 54€ / 3.15kg = ~17.14€/kg filet
    });
  });

  // ── L29: DoublePassOcrService ─────────────────────────────────────────────
  describe('L29 — DoublePassOcrService', () => {
    it('requires manual review if OCR confidence < 90%', () => {
      const res = DoublePassOcrService.evaluatePasses(
        'tenant-1',
        'INV-GREASY-01',
        { extractedText: 'Total: 154.20 EUR', detectedTotalTtc: 154.20, ocrConfidence: 75 },
        { extractedText: 'Total: 154.20 EUR', detectedTotalTtc: 154.20, ocrConfidence: 80 }
      );

      expect(res.confidencePct).toBe(78);
      expect(res.requiresManualReview).toBe(true);
    });
  });

  // ── L30: SkuSubstitutionAlertService ──────────────────────────────────────
});
