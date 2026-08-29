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

import { SkuSubstitutionAlertService } from '@/modules/logistics/approvisionnement/procurement/services/SkuSubstitutionAlertService';
import { CommodityPriceSurgeWatcherService } from '@/modules/logistics/approvisionnement/procurement/services/CommodityPriceSurgeWatcherService';
import { DegradedDishwashingModeService } from '@/modules/ops/production/kds/services/DegradedDishwashingModeService';
import { CourierGpsKdsPacingService } from '@/modules/commerce/relation/delivery/services/CourierGpsKdsPacingService';
import { DeliveryBagPinReleaseService } from '@/modules/commerce/relation/delivery/services/DeliveryBagPinReleaseService';
import { DeliveryDualPricingService } from '@/modules/commerce/relation/delivery/services/DeliveryDualPricingService';
import { RainPlanTerraceSwitchService } from '@/modules/ops/service/pos/services/RainPlanTerraceSwitchService';
import { ThermalPackagingImputationService } from '@/modules/commerce/relation/delivery/services/ThermalPackagingImputationService';
import { InTransitDeliveryCancelHandler } from '@/modules/commerce/relation/delivery/services/InTransitDeliveryCancelHandler';
import { DeliveryAddressScoringService } from '@/modules/commerce/relation/delivery/services/DeliveryAddressScoringService';
import { ColdMealDeliveryDisputeEvidenceService } from '@/modules/commerce/relation/delivery/services/ColdMealDeliveryDisputeEvidenceService';
import { SupplierOrderCutoffScheduler } from '@/modules/logistics/approvisionnement/procurement/services/SupplierOrderCutoffScheduler';
import { FreeShippingThresholdOptimizerService } from '@/modules/logistics/approvisionnement/procurement/services/FreeShippingThresholdOptimizerService';
import { InterStationTransferTrackerService } from '@/modules/logistics/stock/inventory/services/InterStationTransferTrackerService';
import { MaxShiftAmplitudeGuard } from '@/modules/human/effectifs/hr/services/MaxShiftAmplitudeGuard';
import { NightWorkBonusCalculatorService } from '@/modules/human/remuneration/payroll/services/NightWorkBonusCalculatorService';
import { WeeklyRestProofLogService } from '@/modules/human/effectifs/hr/services/WeeklyRestProofLogService';
describe('Angles Morts — Batch 6 (Part 2)', () => {
  beforeEach(() => { vi.clearAllMocks(); });

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
