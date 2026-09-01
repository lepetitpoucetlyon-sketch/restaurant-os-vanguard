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

import { AuditLogger } from '@/lib/audit';

import { VolatileFoodCompatibilityMatrixService } from '@/modules/logistics/stock/inventory/services/VolatileFoodCompatibilityMatrixService';
import { CrustaceanTankMonitorService } from '@/modules/compliance/qualite/haccp/services/CrustaceanTankMonitorService';
import { GreaseTrapSaturationSensorService } from '@/modules/compliance/qualite/haccp/services/GreaseTrapSaturationSensorService';
import { EmergencyExitOpeningChecklistService } from '@/modules/compliance/qualite/haccp/services/EmergencyExitOpeningChecklistService';
import { KitchenHoodDeltaTMonitoringService } from '@/modules/compliance/qualite/haccp/services/KitchenHoodDeltaTMonitoringService';
describe('Angles Morts — Batch 5 (Part 2)', () => {
  beforeEach(() => { vi.clearAllMocks(); });



  // ── L32: VolatileFoodCompatibilityMatrixService ───────────────────────────
  describe('L32 — VolatileFoodCompatibilityMatrixService', () => {
    it('detects ethylene emitter and sensitive food hazard in same cold zone', () => {
      const check = VolatileFoodCompatibilityMatrixService.checkZoneCompatibility(
        'tenant-1',
        'ZONE-LEGUMES',
        [
          { sku: 'BANANA-01', name: 'Bananes Mûres', isEthyleneEmitter: true, isEthyleneSensitive: false },
          { sku: 'SALAD-02', name: 'Salade Mesclun', isEthyleneEmitter: false, isEthyleneSensitive: true },
        ]
      );

      expect(check.isCompatible).toBe(false);
      expect(check.conflicts.length).toBe(1);
      expect(check.conflicts[0].hazard).toContain('éthylène');
    });
  });

  // ── L35: CrustaceanTankMonitorService ─────────────────────────────────────
  describe('L35 — CrustaceanTankMonitorService', () => {
    it('detects critical low dissolved oxygen in lobster tank', () => {
      const res = CrustaceanTankMonitorService.evaluateTank('tenant-1', {
        tankId: 'TANK-HOMARDS',
        tankName: 'Vivier Homards Bretagne',
        tempCelsius: 11.2,
        oxygenLevelMgL: 4.8, // < 6.0 mg/L critical
        salinityPpt: 33,
        lastCleanedAtTs: Date.now(),
      });

      expect(res.isSafe).toBe(false);
      expect(res.isOxygenCritical).toBe(true);
      expect(res.warningAlerts[0]).toContain('asphyxie');
    });
  });

  // ── L63: GreaseTrapSaturationSensorService ────────────────────────────────
  describe('L63 — GreaseTrapSaturationSensorService', () => {
    it('flags grease trap saturation >= 80% and triggers emptying alert', () => {
      const res = GreaseTrapSaturationSensorService.evaluateSaturation('tenant-1', 'ADM-1', {
        trapId: 'TRAP-KITCHEN',
        location: 'Sous-sol cuisine',
        fatLayerThicknessCm: 42,
        totalDepthCm: 50, // 42/50 = 84%
        lastEmptiedDateIso: '2026-06-01',
      });

      expect(res.saturationPct).toBe(84);
      expect(res.requiresEmptying).toBe(true);
      expect(AuditLogger.logAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'GREASE_TRAP_SATURATION_ALERT' }));
    });
  });

  // ── L65: EmergencyExitOpeningChecklistService ─────────────────────────────
  describe('L65 — EmergencyExitOpeningChecklistService', () => {
    it('blocks POS opening if emergency exit is obstructed', async () => {
      const blocked = await EmergencyExitOpeningChecklistService.verifyEmergencyExit({
        tenantId: 'tenant-1',
        adminId: 'MGR-1',
        exitId: 'EXIT-TERRASSE',
        exitLocation: 'Terrasse Nord',
        isUnlockedAndClear: false,
      });

      expect(blocked.canOpenPOS).toBe(false);
      expect(blocked.blockReason).toContain('encombrée');

      const approved = await EmergencyExitOpeningChecklistService.verifyEmergencyExit({
        tenantId: 'tenant-1',
        adminId: 'MGR-1',
        exitId: 'EXIT-TERRASSE',
        exitLocation: 'Terrasse Nord',
        isUnlockedAndClear: true,
        photoProofUrl: 'https://cdn.restaurant-os.internal/exits/photo1.jpg',
      });

      expect(approved.canOpenPOS).toBe(true);
      expect(AuditLogger.logAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'EMERGENCY_EXIT_CHECK_RECORDED' }));
    });
  });

  // ── L66: KitchenHoodDeltaTMonitoringService ───────────────────────────────
  describe('L66 — KitchenHoodDeltaTMonitoringService', () => {
    it('triggers preventive gas cutoff on rapid rate-of-rise before Ansul burst', () => {
      const res = KitchenHoodDeltaTMonitoringService.evaluateHoodThermalDynamics(
        'tenant-1',
        'CHEF-1',
        {
          hoodId: 'HOOD-LINE-01',
          station: 'Piano central',
          currentTempCelsius: 95,
          previousTempCelsius: 40, // +55°C in 60s -> 55°C/min > 25°C/min threshold
          timeDeltaSeconds: 60,
        }
      );

      expect(res.gasCutoffTriggered).toBe(true);
      expect(res.ansulPreAlarmActive).toBe(true);
      expect(AuditLogger.logAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'KITCHEN_HOOD_FIRE_CUTOFF' }));
    });
  });

});
