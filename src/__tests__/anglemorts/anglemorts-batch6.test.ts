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

import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { AuditLogger } from '@/modules/compliance/securite/AuditLogger';

import { HCRPayrollCalculatorService } from '@/modules/human/effectifs/payroll/HCRPayrollCalculatorService';
import { ShiftPlanningConflictService } from '@/modules/human/effectifs/planning/ShiftPlanningConflictService';
import { TimeClockPunchService } from '@/modules/human/effectifs/hr/services/TimeClockPunchService';
import { LeaveManagementService } from '@/modules/human/effectifs/hr/services/LeaveManagementService';
import { DpaeConnectorService } from '@/modules/human/effectifs/hr/services/DpaeConnectorService';
import { MercurialePriceComparisonService } from '@/modules/stock/procurement/MercurialePriceComparisonService';
import { RfaContractCalculationService } from '@/modules/stock/procurement/RfaContractCalculationService';
import { SupplierDisputeWorkflowService } from '@/modules/stock/procurement/SupplierDisputeWorkflowService';
import { DlcExpiryAlertScheduler } from '@/modules/stock/inventory/DlcExpiryAlertScheduler';
import { PerpetualInventoryWorkflowService } from '@/modules/stock/inventory/PerpetualInventoryWorkflowService';
import { DeliveryPlatformAdapterService } from '@/modules/commerce/delivery/DeliveryPlatformAdapterService';
import { DeliveryCommissionPnLService } from '@/modules/commerce/delivery/DeliveryCommissionPnLService';
import { DeliveryStorePauseService } from '@/modules/commerce/delivery/DeliveryStorePauseService';
import { VariableWeightStockService } from '@/modules/stock/inventory/VariableWeightStockService';
import { DoublePassOcrService } from '@/modules/stock/procurement/DoublePassOcrService';
import { SkuSubstitutionAlertService } from '@/modules/stock/procurement/SkuSubstitutionAlertService';
import { CommodityPriceSurgeWatcherService } from '@/modules/stock/procurement/CommodityPriceSurgeWatcherService';
import { DegradedDishwashingModeService } from '@/modules/production/kds/services/DegradedDishwashingModeService';
import { CourierGpsKdsPacingService } from '@/modules/commerce/delivery/CourierGpsKdsPacingService';
import { DeliveryBagPinReleaseService } from '@/modules/commerce/delivery/DeliveryBagPinReleaseService';
import { DeliveryDualPricingService } from '@/modules/commerce/delivery/DeliveryDualPricingService';
import { RainPlanTerraceSwitchService } from '@/modules/ops/service/pos/services/RainPlanTerraceSwitchService';
import { ThermalPackagingImputationService } from '@/modules/commerce/delivery/ThermalPackagingImputationService';
import { InTransitDeliveryCancelHandler } from '@/modules/commerce/delivery/InTransitDeliveryCancelHandler';
import { DeliveryAddressScoringService } from '@/modules/commerce/delivery/DeliveryAddressScoringService';
import { ColdMealDeliveryDisputeEvidenceService } from '@/modules/commerce/delivery/ColdMealDeliveryDisputeEvidenceService';
import { SupplierOrderCutoffScheduler } from '@/modules/stock/procurement/SupplierOrderCutoffScheduler';
import { FreeShippingThresholdOptimizerService } from '@/modules/stock/procurement/FreeShippingThresholdOptimizerService';
import { InterStationTransferTrackerService } from '@/modules/stock/inventory/InterStationTransferTrackerService';
import { MaxShiftAmplitudeGuard } from '@/modules/human/effectifs/hr/services/MaxShiftAmplitudeGuard';
import { NightWorkBonusCalculatorService } from '@/modules/human/effectifs/payroll/NightWorkBonusCalculatorService';
import { WeeklyRestProofLogService } from '@/modules/human/effectifs/hr/services/WeeklyRestProofLogService';

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
  describe('L30 — SkuSubstitutionAlertService', () => {
    it('raises alert on unauthorized wholesaler product substitution', () => {
      const res = SkuSubstitutionAlertService.verifyDeliveryItem('tenant-1', {
        deliverySlipId: 'BL-99',
        supplierId: 'METRO',
        orderedSku: 'BEURRE-AOP-ISIGNY',
        orderedName: 'Beurre AOP Isigny 250g',
        deliveredSku: 'BEURRE-STD-82',
        deliveredName: 'Beurre Gastronomique 82% 250g',
        isSubstitutionAuthorized: false,
      });

      expect(res.hasUnauthorizedSubstitution).toBe(true);
      expect(res.alertMessage).toContain('SUBSTITUTION NON AUTORISÉE');
    });
  });

  // ── L33: CommodityPriceSurgeWatcherService ─────────────────────────────────
  describe('L33 — CommodityPriceSurgeWatcherService', () => {
    it('flags price surge >15% and recommends menu adjustment', () => {
      const res = CommodityPriceSurgeWatcherService.detectSurge('tenant-1', {
        ingredientSku: 'HUILE-TOURNESOL',
        ingredientName: 'Huile de Tournesol 25L',
        previousPriceInMicrounits: 35_000_000,
        currentPriceInMicrounits: 45_000_000, // +28.6% surge
      });

      expect(res.isSurgeCritical).toBe(true);
      expect(res.surgePct).toBe(28.6);
      expect(res.suggestedMenuPriceAdjustmentPct).toBe(8.6);
    });
  });

  // ── L40: DegradedDishwashingModeService ───────────────────────────────────
  describe('L40 — DegradedDishwashingModeService', () => {
    it('activates disposable packaging switch when dishwasher breaks', () => {
      const plan = DegradedDishwashingModeService.activateDegradedMode('tenant-1', {
        cause: 'dishwasher_failure',
        expectedDowntimeHours: 4,
      });

      expect(plan.isDegradedModeActive).toBe(true);
      expect(plan.switchAllToDisposablePackaging).toBe(true);
      expect(plan.blockHardToWashMenuCategories.length).toBeGreaterThan(0);
    });
  });

  // ── L47: CourierGpsKdsPacingService ───────────────────────────────────────
  describe('L47 — CourierGpsKdsPacingService', () => {
    it('fires kitchen prep when courier is within 5 minutes of restaurant', () => {
      const fireDecision = CourierGpsKdsPacingService.evaluatePacing('tenant-1', {
        orderId: 'ORD-UBER-12',
        courierDistanceMeters: 1200, // 1.2 km at 20 km/h = ~3.6 min
        courierSpeedKmH: 20,
        dishCookingDurationMinutes: 5,
      });

      expect(fireDecision.fireKitchenPrep).toBe(true);
      expect(fireDecision.instruction).toBe('fire_immediate');
    });
  });

  // ── L48: DeliveryBagPinReleaseService ─────────────────────────────────────
  describe('L48 — DeliveryBagPinReleaseService', () => {
    it('unblocks bag handover only with matching 4-digit courier PIN', () => {
      const wrong = DeliveryBagPinReleaseService.verifyAndReleaseBag({
        tenantId: 'tenant-1',
        orderId: 'ORD-DELIV-44',
        expectedPin: '8492',
        providedCourierPin: '0000',
      });
      expect(wrong.isUnlocked).toBe(false);

      const right = DeliveryBagPinReleaseService.verifyAndReleaseBag({
        tenantId: 'tenant-1',
        orderId: 'ORD-DELIV-44',
        expectedPin: '8492',
        providedCourierPin: '8492',
      });
      expect(right.isUnlocked).toBe(true);
    });
  });

  // ── L49: DeliveryDualPricingService ───────────────────────────────────────
  describe('L49 — DeliveryDualPricingService', () => {
    it('applies +20% markup on delivery menu items', () => {
      const res = DeliveryDualPricingService.computeDeliveryPrice({
        tenantId: 'tenant-1',
        productId: 'PIZZA-REGINA',
        productName: 'Pizza Regina',
        diningRoomPriceInMicrounits: 14_000_000, // 14.00 € in restaurant
        targetMarkupPct: 20, // 14€ + 20% = 16.80 €
      });

      expect(res.deliveryPriceInMicrounits).toBe(16_800_000);
      expect(res.markupAmountInMicrounits).toBe(2_800_000);
    });
  });

  // ── L50: RainPlanTerraceSwitchService ─────────────────────────────────────
  describe('L50 — RainPlanTerraceSwitchService', () => {
    it('reassigns terrace guests to indoor tables and packs remainder as takeaway', async () => {
      const res = await RainPlanTerraceSwitchService.executeRainPlan(
        'tenant-1',
        'MGR-1',
        [
          { tableNumber: 'T1', orderId: 'O-1', covers: 2, totalInMicrounits: 45_000_000 },
          { tableNumber: 'T2', orderId: 'O-2', covers: 4, totalInMicrounits: 90_000_000 },
          { tableNumber: 'T3', orderId: 'O-3', covers: 6, totalInMicrounits: 120_000_000 },
        ],
        5 // Only 5 indoor seats left -> T1 (2) fits, T2 (4) exceeds -> takeaway
      );

      expect(res.activeTerraceTablesCount).toBe(3);
      expect(res.reassignedToIndoorCount).toBe(1);
      expect(res.packedTakeawayCount).toBe(2);
      expect(AuditLogger.logAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'RAIN_PLAN_SWITCH_ACTIVATED' }));
    });
  });

  // ── T44: ThermalPackagingImputationService ────────────────────────────────
  describe('T44 — ThermalPackagingImputationService', () => {
    it('computes exact packaging cost per delivery order', () => {
      const res = ThermalPackagingImputationService.computeOrderPackaging('tenant-1', 'ORD-UBER-7', [
        { type: 'thermal_box_kraft', quantity: 2 }, // 2 * 0.35€ = 0.70€
        { type: 'drink_carrier_4cup', quantity: 1 }, // 1 * 0.20€ = 0.20€
        { type: 'heavy_duty_bag', quantity: 1 },    // 1 * 0.30€ = 0.30€
      ]);

      expect(res.totalPackagingCostInMicrounits).toBe(1_200_000); // 1.20 €
    });
  });

  // ── T46: InTransitDeliveryCancelHandler ───────────────────────────────────
  describe('T46 — InTransitDeliveryCancelHandler', () => {
    it('submits 100% refund claim if order was already prepared before client cancellation', () => {
      const res = InTransitDeliveryCancelHandler.handleCancel({
        tenantId: 'tenant-1',
        platform: 'uber_eats',
        platformOrderId: 'UBER-CANCEL-01',
        foodCostInMicrounits: 8_500_000,
        preparationStage: 'ready_at_pass',
      });

      expect(res.isLossCompensated).toBe(true);
      expect(res.refundClaimSubmitted).toBe(true);
    });
  });

  // ── T47: DeliveryAddressScoringService ────────────────────────────────────
  describe('T47 — DeliveryAddressScoringService', () => {
    it('penalizes address with missing door code and no elevator', () => {
      const res = DeliveryAddressScoringService.scoreAddress('tenant-1', {
        addressLine: '14 Rue de la Paix, Lyon',
        floor: '5',
        hasElevator: false,
      });

      expect(res.reliabilityScore).toBeLessThan(60);
      expect(res.flagWarnings).toContain('Digicode manquant');
      expect(res.flagWarnings).toContain('Étage élevé sans ascenseur (>4e)');
    });
  });

  // ── T50: ColdMealDeliveryDisputeEvidenceService ───────────────────────────
  describe('T50 — ColdMealDeliveryDisputeEvidenceService', () => {
    it('seals handover temperature evidence above 63°C', () => {
      const res = ColdMealDeliveryDisputeEvidenceService.sealHandoverEvidence('tenant-1', {
        orderId: 'ORD-PROOF-01',
        handoverTempCelsius: 67.5,
        photoUrl: 'https://cdn.restaurant-os.internal/proof/bag-sealed-01.jpg',
        handoverTimestamp: Date.now(),
      });

      expect(res.isCompliantHotHandover).toBe(true);
      expect(res.photoEvidenceHash).toContain('SHA256-PROOF');
      expect(res.courtAdmissibleProofId).toContain('PROOF-DELIV-tenant-1-ORD-PROOF-01');
    });
  });

  // ── T55: SupplierOrderCutoffScheduler ─────────────────────────────────────
  describe('T55 — SupplierOrderCutoffScheduler', () => {
    it('triggers urgent alert when cutoff is 30 minutes away', () => {
      const fakeNow = new Date('2026-08-21T22:30:00');
      const res = SupplierOrderCutoffScheduler.evaluateCutoff(
        'tenant-1',
        {
          supplierId: 'METRO-01',
          supplierName: 'Metro Cash & Carry',
          cutoffTime: '23:00',
          deliveryDays: ['saturday'],
          draftOrderTotalInMicrounits: 450_000_000, // 450.00 €
        },
        fakeNow
      );

      expect(res.isUrgentCutoffApproaching).toBe(true);
      expect(res.minutesRemaining).toBe(30);
      expect(res.alertBanner).toContain('dans 30 min');
    });
  });

  // ── T56: FreeShippingThresholdOptimizerService ────────────────────────────
  describe('T56 — FreeShippingThresholdOptimizerService', () => {
    it('fills cart shortfall with durable staples to reach franco and save delivery fee', () => {
      const res = FreeShippingThresholdOptimizerService.optimizeCart({
        tenantId: 'tenant-1',
        supplierId: 'TRANSGOURMET',
        currentCartInMicrounits: 220_000_000, // 220.00 €
        francoThresholdInMicrounits: 250_000_000, // 250.00 € (shortfall = 30.00 €)
        shippingCostInMicrounits: 35_000_000, // 35.00 € shipping fee
        availableBufferStaples: [
          { sku: 'FARINE-T55', name: 'Farine T55 25kg', unitPriceInMicrounits: 22_000_000, shelfLifeDays: 180 },
          { sku: 'HUILE-FRITURE', name: 'Huile Friture 10L', unitPriceInMicrounits: 18_000_000, shelfLifeDays: 365 },
        ],
      });

      expect(res.hasReachedFranco).toBe(false);
      expect(res.shortfallToFrancoInMicrounits).toBe(30_000_000);
      expect(res.suggestedItemsToFillCart.length).toBe(2);
      expect(res.netSavingsInMicrounits).toBe(35_000_000);
    });
  });

  // ── T60: InterStationTransferTrackerService ────────────────────────────────
  describe('T60 — InterStationTransferTrackerService', () => {
    it('records transfer from bar to kitchen for sauce flambage', () => {
      const receipt = InterStationTransferTrackerService.recordTransfer({
        tenantId: 'tenant-1',
        transferredByStaffId: 'CHEF-SAUCIER',
        fromStation: 'bar',
        toStation: 'chaud',
        sku: 'COGNAC-VSOP',
        productName: 'Cognac VSOP 70cl',
        quantity: 1,
        costInMicrounits: 32_000_000,
      });

      expect(receipt.fromStation).toBe('bar');
      expect(receipt.toStation).toBe('chaud');
      expect(receipt.costInMicrounits).toBe(32_000_000);
    });
  });

  // ── T64: MaxShiftAmplitudeGuard ───────────────────────────────────────────
  describe('T64 — MaxShiftAmplitudeGuard', () => {
    it('flags illegal daily amplitude exceeding 13 hours', () => {
      const breach = MaxShiftAmplitudeGuard.evaluateAmplitude([
        { startHour: 9.0, endHour: 15.0 }, // Service midi: 9h00 - 15h00
        { startHour: 18.0, endHour: 23.5 }, // Service soir: 18h00 - 23h30 (Amplitude: 9h00 à 23h30 = 14.5h > 13h)
      ]);

      expect(breach.totalAmplitudeHours).toBe(14.5);
      expect(breach.isLegalWithinHCR).toBe(false);
      expect(breach.breachExcessHours).toBe(1.5);
    });
  });

  // ── T67: NightWorkBonusCalculatorService ───────────────────────────────────
  describe('T67 — NightWorkBonusCalculatorService', () => {
    it('calculates +30% bonus on hours worked between 22h and 02h (4 hours)', () => {
      const bonus = NightWorkBonusCalculatorService.computeNightBonus(20.0, 26.0, 12_000_000); // 20h00 to 02h00
      expect(bonus.totalNightHours).toBe(4); // 22h to 26h = 4h
      expect(bonus.bonusAmountInMicrounits).toBe(14_400_000); // 4h * 12€ * 30% = 14.40 €
    });
  });

  // ── T69: WeeklyRestProofLogService ────────────────────────────────────────
  describe('T69 — WeeklyRestProofLogService', () => {
    it('seals 35-hour consecutive weekly rest proof', () => {
      const start = 1700000000000;
      const end = start + (36 * 3600 * 1000); // 36 hours rest

      const proof = WeeklyRestProofLogService.recordWeeklyRest('tenant-1', {
        employeeId: 'EMP-01',
        weekIso: '2026-W34',
        restStartTs: start,
        restEndTs: end,
      });

      expect(proof.consecutiveRestHours).toBe(36);
      expect(proof.isLegalCompliant).toBe(true);
      expect(proof.proofHash).toContain('36H');
    });
  });
});
