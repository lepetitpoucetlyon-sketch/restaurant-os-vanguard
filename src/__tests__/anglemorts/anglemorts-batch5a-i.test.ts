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
vi.mock('@/lib/offline/OutboxService', () => ({
  OutboxService: { enqueue: vi.fn() },
  OutboxPriority: { FISCAL: 1, SANITAIRE: 2, LEGAL: 3, NORMAL: 0 },
}));

import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { AuditLogger } from '@/lib/audit';

import { KDSStationRecoveryService } from '@/modules/ops/production/kds/services/KDSStationRecoveryService';
import { RecipeBOMCostService } from '@/modules/ops/production/kds/services/RecipeBOMCostService';
import { PassPickupReminderService } from '@/modules/ops/production/kds/services/PassPickupReminderService';
import { HACCPFrequencyEnforcementService } from '@/modules/compliance/qualite/haccp/services/HACCPFrequencyEnforcementService';



describe('Angles Morts — Batch 5 (KDS, Cuisine, Recettes & HACCP)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });


  // ── B2: KDSStationRecoveryService ─────────────────────────────────────────
  describe('B2 — KDSStationRecoveryService', () => {
    it('replays missed orders after station recovery', () => {
      const plan = KDSStationRecoveryService.recoverStation(
        'tenant-1',
        { stationId: 'KDS-GRILL', lastPingTimestamp: Date.now() - 5000, unacknowledgedOrderIds: ['O-1', 'O-2'] },
        ['O-3']
      );
      expect(plan.isRecovered).toBe(true);
      expect(plan.replayedCount).toBe(3);
      expect(NexusEventBus.emit).toHaveBeenCalledWith('kds.station_recovered', expect.any(Object));
    });
  });

  // ── B3: RecipeBOMCostService ──────────────────────────────────────────────
  describe('B3 — RecipeBOMCostService', () => {
    it('calculates accurate dish food cost and margin', () => {
      const res = RecipeBOMCostService.computeDishFoodCost({
        dishId: 'BURGER-CHEF',
        dishName: 'Burger du Chef',
        sellingPriceTtcInMicrounits: 16_500_000, // 16.50 €
        taxRate: '0.10', // HT = 15.00 € (15_000_000)
        targetFoodCostRatioPct: 28,
        ingredients: [
          { ingredientId: 'BEEF', ingredientName: 'Steak Haché 180g', quantityRequired: 0.18, unitPriceInMicrounits: 12_000_000 }, // 2.16 €
          { ingredientId: 'BUN', ingredientName: 'Pain Bun Brioché', quantityRequired: 1, unitPriceInMicrounits: 600_000 },         // 0.60 €
          { ingredientId: 'CHEESE', ingredientName: 'Cheddar AOP', quantityRequired: 0.05, unitPriceInMicrounits: 14_000_000 },    // 0.70 €
        ],
      });

      expect(res.foodCostInMicrounits).toBe(3_460_000); // 3.46 €
      expect(res.grossMarginInMicrounits).toBe(11_540_000); // 11.54 €
      expect(res.isFoodCostProfitable).toBe(true);
    });
  });

  // ── B5: PassPickupReminderService ─────────────────────────────────────────
  describe('B5 — PassPickupReminderService', () => {
    it('raises alarm if plate holds on pass > 6 min (critical delay)', () => {
      const res = PassPickupReminderService.evaluatePassStatus('tenant-1', {
        orderId: 'ORD-77',
        tableNumber: '14',
        serverName: 'Antoine',
        readyAtTimestamp: Date.now() - (7 * 60 * 1000), // 7 min ago
        maxHoldMinutes: 3,
      });

      expect(res.isDelayed).toBe(true);
      expect(res.alertLevel).toBe('critical');
      expect(res.buzzerAudioTone).toContain('CRITICAL');
    });
  });

  // ── E1: HACCPFrequencyEnforcementService ───────────────────────────────────
  describe('E1 — HACCPFrequencyEnforcementService', () => {
    it('blocks production and logs audit when mandatory cold room logs are missing', () => {
      const res = HACCPFrequencyEnforcementService.checkCompliance('tenant-1', 'CHEF-1', {
        taskType: 'cold_room_temp',
        equipmentId: 'COLD-01',
        equipmentName: 'Chambre Froide Viandes',
        requiredFrequencyPerDay: 2,
        currentLoggedCountToday: 0,
      });

      expect(res.isCompliant).toBe(false);
      expect(res.blockProduction).toBe(true);
      expect(res.missingLogsCount).toBe(2);
      expect(AuditLogger.logAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'HACCP_FREQUENCY_MISSED' }));
    });
  });
});
