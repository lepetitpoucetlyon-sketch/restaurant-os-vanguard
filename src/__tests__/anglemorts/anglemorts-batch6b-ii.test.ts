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
describe('anglemorts-batch6b (Part 2)', () => {
  beforeEach(() => { vi.clearAllMocks(); });


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
});
