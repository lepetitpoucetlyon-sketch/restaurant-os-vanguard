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

import { MeatRestingTimerService } from '@/modules/ops/production/kds/services/MeatRestingTimerService';
import { HotColdSyncKdsService } from '@/modules/ops/production/kds/services/HotColdSyncKdsService';
import { ThawingProtocolGuard } from '@/modules/compliance/qualite/haccp/services/ThawingProtocolGuard';
import { PestControl3DRegisterService } from '@/modules/compliance/qualite/haccp/services/PestControl3DRegisterService';
import { CleaningRinseValidationService } from '@/modules/compliance/qualite/haccp/services/CleaningRinseValidationService';
import { MeatAgingHumidityMonitoringService } from '@/modules/compliance/qualite/haccp/services/MeatAgingHumidityMonitoringService';
import { DiningRoomAirQualityCO2MonitorService } from '@/modules/compliance/qualite/haccp/services/DiningRoomAirQualityCO2MonitorService';
describe('Angles Morts — Batch 5 (Part 2)', () => {
  beforeEach(() => { vi.clearAllMocks(); });
describe('anglemorts-batch5b (Part 2)', () => {
  beforeEach(() => { vi.clearAllMocks(); });


  // ── T16: MeatRestingTimerService ──────────────────────────────────────────
  describe('T16 — MeatRestingTimerService', () => {
    it('calculates rest duration for 4cm steak', () => {
      const res = MeatRestingTimerService.calculateRestingPlan({
        tenantId: 'tenant-1',
        orderId: 'ORD-STEAK-1',
        cutName: 'Côte de Bœuf 1.2kg',
        thicknessCm: 4,
        doneness: 'saignant',
        cookedEndTimestamp: Date.now(),
      });

      expect(res.recommendedRestDurationSeconds).toBe(240); // 4 * 60 = 240s (4 min)
      expect(res.isRestingCompleted).toBe(false);
    });
  });

  // ── T17: HotColdSyncKdsService ────────────────────────────────────────────
  describe('T17 — HotColdSyncKdsService', () => {
    it('delays cold prep start to match hot dish ready timestamp', () => {
      const plan = HotColdSyncKdsService.planCourseSync('tenant-1', 'ORD-TABLE-4', [
        { itemId: '1', name: 'Entrecôte 300g', type: 'hot', prepTimeSeconds: 600 }, // 10 min
        { itemId: '2', name: 'Tartare de Saumon', type: 'cold', prepTimeSeconds: 180 }, // 3 min
      ]);

      expect(plan.totalCourseDurationSeconds).toBe(600);
      expect(plan.coldStartTimeOffsetSeconds).toBe(420); // 7 min delay
    });
  });

  // ── T26: ThawingProtocolGuard ─────────────────────────────────────────────
  describe('T26 — ThawingProtocolGuard', () => {
    it('blocks illegal hot water bath thawing and raises violation', () => {
      const res = ThawingProtocolGuard.validateThawing({
        tenantId: 'tenant-1',
        adminId: 'COMMIS-1',
        batchId: 'LOT-CREVETTES-01',
        productName: 'Crevettes sauvages congelées',
        method: 'hot_water_bath',
        estimatedDurationHours: 1,
      });

      expect(res.allowed).toBe(false);
      expect(res.rejectReason).toContain('CE 852/2004');
      expect(AuditLogger.logAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'THAWING_PROTOCOL_VIOLATION' }));
    });
  });

  // ── T28: PestControl3DRegisterService ─────────────────────────────────────
  describe('T28 — PestControl3DRegisterService', () => {
    it('registers 3D intervention and schedules next quarterly audit', async () => {
      const res = await PestControl3DRegisterService.recordIntervention('tenant-1', 'ADM-1', {
        interventionDateIso: '2026-08-01',
        providerSiret: '98765432100019',
        providerCompanyName: 'Hygiène Pro 3D',
        technicianCertibiocideNumber: 'CERTIBIOCIDE-2024-88',
        treatedPests: ['rodents', 'cockroaches'],
        baitsInstalledCount: 12,
        baitsConsumedCount: 0,
        infestationScore: 'none',
        recommendations: ['Rien à signaler'],
      });

      expect(res.isUpToDate).toBe(true);
      expect(res.nextInterventionDueIso).toBe('2026-10-30');
      expect(AuditLogger.logAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'PEST_CONTROL_3D_RECORDED' }));
    });
  });

  // ── T29: CleaningRinseValidationService ────────────────────────────────────
  describe('T29 — CleaningRinseValidationService', () => {
    it('flags chemical residue when surface pH is non-neutral', () => {
      const badRinse = CleaningRinseValidationService.validateRinse('tenant-1', {
        zoneId: 'TRANCHEUSE',
        surfaceName: 'Lame trancheuse jambon',
        chemicalProductUsed: 'javel',
        rinseWaterTempCelsius: 45,
        residualPh: 10.5, // Alkaline bleach residue
      });

      expect(badRinse.isRinseComplete).toBe(false);
      expect(badRinse.residualChemicalHazard).toBe(true);

      const goodRinse = CleaningRinseValidationService.validateRinse('tenant-1', {
        zoneId: 'TRANCHEUSE',
        surfaceName: 'Lame trancheuse jambon',
        chemicalProductUsed: 'javel',
        rinseWaterTempCelsius: 60,
        residualPh: 7.0,
      });

      expect(goodRinse.isRinseComplete).toBe(true);
      expect(goodRinse.residualChemicalHazard).toBe(false);
    });
  });

  // ── T96: MeatAgingHumidityMonitoringService ───────────────────────────────
  describe('T96 — MeatAgingHumidityMonitoringService', () => {
    it('alerts if meat aging chamber relative humidity exceeds 88%', () => {
      const res = MeatAgingHumidityMonitoringService.evaluateChamber('tenant-1', {
        chamberId: 'CAVE-MATURATION',
        tempCelsius: 1.2,
        relativeHumidityPct: 91.5, // Mold hazard
        stockValueInMicrounits: 8_000_000_000,
      });

      expect(res.isHumidityOptimal).toBe(false);
      expect(res.isMoldCounteringHazard).toBe(true);
      expect(res.alertMessage).toContain('fongique');
    });
  });

  // ── T98: DiningRoomAirQualityCO2MonitorService ────────────────────────────
  describe('T98 — DiningRoomAirQualityCO2MonitorService', () => {
    it('triggers VMC boost when room CO2 reaches 1950 ppm', () => {
      const res = DiningRoomAirQualityCO2MonitorService.checkAirQuality('tenant-1', {
        roomZone: 'salle_principale',
        co2Ppm: 1950,
        tempCelsius: 21.5,
        occupancyCount: 85,
      });

      expect(res.airQualityStatus).toBe('poor_air_stale');
      expect(res.vmcBoostActivated).toBe(true);
      expect(res.recommendation).toContain('AIR SATURÉ');
    });
  });
});
});
