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

import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { AuditLogger } from '@/lib/audit';

import { AutomaticReviewBoosterService } from '@/modules/commerce/relation/crm/services/AutomaticReviewBoosterService';
import { CrossLocationLoyaltyService } from '@/modules/commerce/relation/crm/services/CrossLocationLoyaltyService';
import { TableTurnoverOptimizationService } from '@/modules/commerce/relation/crm/services/TableTurnoverOptimizationService';
import { TurnoverPredictionService, type MenuProfile } from '@/modules/commerce/relation/reservations/services/TurnoverPredictionService';
import { SpecialEventDepositEscrowService } from '@/modules/commerce/relation/crm/services/SpecialEventDepositEscrowService';
import { SmartTipDigitalPoolService } from '@/modules/finance/tresorerie/SmartTipDigitalPoolService';
import { PrivateDiningContractSignerService } from '@/modules/commerce/relation/crm/services/PrivateDiningContractSignerService';
describe('Angles Morts — Batch 7 (Part 2)', () => {
  beforeEach(() => { vi.clearAllMocks(); });


  describe('L77 — AutomaticReviewBoosterService', () => {
    it('formats review invitation SMS post meal', () => {
      const res = AutomaticReviewBoosterService.dispatchReviewRequest({
        tenantId: 'tenant-1',
        orderId: 'ORD-7',
        customerPhone: '+33600000000',
        customerName: 'Émilie',
        googlePlaceReviewUrl: 'https://g.page/r/restaurant-lyon/review',
      });

      expect(res.smsBody).toContain('Émilie');
      expect(res.smsBody).toContain('https://g.page');
    });
  });

  // ── L78: CrossLocationLoyaltyService ──────────────────────────────────────
  describe('L78 — CrossLocationLoyaltyService', () => {
    it('awards 1 pt per euro and computes cashback allowance', () => {
      const res = CrossLocationLoyaltyService.awardPoints({
        tenantId: 'tenant-1',
        customerId: 'CUST-88',
        spendInMicrounits: 85_000_000, // 85.00 € -> 85 pts
        currentPointsBalance: 120,    // 120 + 85 = 205 pts -> 2 tranches of 100 = 10.00 € cashback
      });

      expect(res.pointsEarned).toBe(85);
      expect(res.newBalance).toBe(205);
      expect(res.availableCashbackInMicrounits).toBe(10_000_000);
    });
  });

  // ── L82: TableTurnoverOptimizationService ─────────────────────────────────
  describe('L82 — TableTurnoverOptimizationService', () => {
    it('predicts turnover and confirms second seating feasibility', () => {
      const pred = TableTurnoverOptimizationService.predictTurnover('tenant-1', {
        tableNumber: '12',
        covers: 2,
        seatedAtTimestamp: Date.now() - (60 * 60 * 1000),
        currentCourseStage: 'dessert',
      });

      // Profil par défaut 'standard' → baseline HCR de 90 min, sans majoration
      // (2 convives = pas de facteur convive supplémentaire).
      expect(pred.predictedTotalDurationMinutes).toBe(90);
      expect(pred.isSecondSeatingFeasible).toBe(true);
    });

    it('applique la baseline du profil de menu', () => {
      const lunch = TableTurnoverOptimizationService.predictTurnover('tenant-1', {
        tableNumber: '12',
        covers: 2,
        seatedAtTimestamp: Date.now(),
        currentCourseStage: 'plat',
        menuProfile: 'business_lunch',
      });
      // Un déjeuner d'affaires libère la table plus vite qu'un menu standard.
      expect(lunch.predictedTotalDurationMinutes).toBe(75);
    });

    // ── DF-O1 : garde anti-divergence ────────────────────────────────────────
    // Les deux services répondaient autrefois différemment à « combien de temps
    // cette table sera-t-elle occupée ? ». Ce test échoue si la divergence revient.
    it('DF-O1 — s\'accorde avec TurnoverPredictionService sur la durée', () => {
      const cases: Array<{ covers: number; profile: MenuProfile }> = [
        { covers: 2, profile: 'standard' },
        { covers: 4, profile: 'standard' },
        { covers: 8, profile: 'tasting' },
        { covers: 2, profile: 'quick' },
      ];

      for (const { covers, profile } of cases) {
        const viaCrm = TableTurnoverOptimizationService.predictTurnover('tenant-1', {
          tableNumber: 'T', covers, seatedAtTimestamp: Date.now(),
          currentCourseStage: 'plat', menuProfile: profile,
        }).predictedTotalDurationMinutes;

        const viaSource = TurnoverPredictionService.durationMinutes(covers, profile);

        expect(viaCrm, `divergence pour ${covers} couverts en ${profile}`).toBe(viaSource);
      }
    });
  });

  // ── L83: SpecialEventDepositEscrowService ─────────────────────────────────
  describe('L83 — SpecialEventDepositEscrowService', () => {
    it('secures 30% deposit for privatization banquet', async () => {
      const receipt = await SpecialEventDepositEscrowService.secureDeposit('tenant-1', 'DIR-1', {
        contractId: 'PRIV-2026-01',
        customerName: 'Mariage Martin',
        totalQuoteInMicrounits: 4_000_000_000, // 4 000.00 €
        depositRequiredPct: 30, // 1 200.00 €
        eventDateIso: '2026-09-25',
      });

      expect(receipt.depositAmountInMicrounits).toBe(1_200_000_000);
      expect(receipt.balanceRemainingInMicrounits).toBe(2_800_000_000);
      expect(receipt.isSecured).toBe(true);
      expect(AuditLogger.logAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'SPECIAL_EVENT_DEPOSIT_SEQUESTERED' }));
    });
  });

  // ── L84: SmartTipDigitalPoolService ───────────────────────────────────────
  describe('L84 — SmartTipDigitalPoolService', () => {
    it('distributes tip pool by hours worked with indivisible penny allocated to last staff', () => {
      const pool = SmartTipDigitalPoolService.distributePool(
        'tenant-1',
        '2026-08',
        100_000_000, // 100.00 €
        [
          { employeeId: 'EMP-1', employeeName: 'Maxime', hoursWorked: 40 },
          { employeeId: 'EMP-2', employeeName: 'Lucie', hoursWorked: 40 },
          { employeeId: 'EMP-3', employeeName: 'Thomas', hoursWorked: 20 },
        ]
      );

      expect(pool.distributions[0].amountInMicrounits).toBe(40_000_000); // 40.00 €
      expect(pool.distributions[1].amountInMicrounits).toBe(40_000_000); // 40.00 €
      expect(pool.distributions[2].amountInMicrounits).toBe(20_000_000); // 20.00 €
      const total = pool.distributions.reduce((sum, d) => sum + d.amountInMicrounits, 0);
      expect(total).toBe(100_000_000);
    });
  });

  // ── T71: PrivateDiningContractSignerService ───────────────────────────────
  describe('T71 — PrivateDiningContractSignerService', () => {
    it('certifies signed contract with signature hash', () => {
      const receipt = PrivateDiningContractSignerService.signContract('tenant-1', {
        contractId: 'BANQUET-88',
        customerName: 'Entreprise Tech SAS',
        customerEmail: 'event@tech.fr',
        totalQuoteInMicrounits: 2_500_000_000,
        eventDateIso: '2026-10-12',
        cgvAccepted: true,
        signatureDataUri: 'data:image/png;base64,mockSignatureData',
      });

      expect(receipt.isLegallyBinding).toBe(true);
      expect(receipt.signatureHash).toContain('SHA256-CONTRACT');
    });
  });
});
