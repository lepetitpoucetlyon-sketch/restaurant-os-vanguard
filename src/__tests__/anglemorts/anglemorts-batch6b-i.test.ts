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
});
