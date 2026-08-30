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

import { IoTSensorBridgeService } from '@/modules/compliance/qualite/haccp/services/IoTSensorBridgeService';
import { ProductRecallCrossTenantBroadcaster } from '@/modules/compliance/qualite/recall/ProductRecallCrossTenantBroadcaster';
import { FoodDonationMonthlyReportService } from '@/modules/compliance/qualite/haccp/services/FoodDonationMonthlyReportService';
import { TIACEmergencyWorkflowService } from '@/modules/compliance/qualite/haccp/services/TIACEmergencyWorkflowService';
import { KDSItemDeltaModificationService } from '@/modules/ops/production/kds/services/KDSItemDeltaModificationService';
import { LotAllergenMatrixService } from '@/modules/ops/production/kds/services/LotAllergenMatrixService';
import { KDSMicroSequencingService } from '@/modules/ops/production/kds/services/KDSMicroSequencingService';
describe('anglemorts-batch5a (Part 2)', () => {
  beforeEach(() => { vi.clearAllMocks(); });


  // ── E2/L34: IoTSensorBridgeService ────────────────────────────────────────
  describe('E2/L34 — IoTSensorBridgeService', () => {
    it('distinguishes real cold break from radio loss', () => {
      const realBreach = IoTSensorBridgeService.processTelemetry('tenant-1', {
        sensorId: 'TESTO-01',
        vendor: 'testo',
        equipmentId: 'FRIDGE-POISSON',
        tempCelsius: 7.8, // > 4°C
        lastCommunicationTs: Date.now() - 1000,
        rssiSignalDbm: -65,
      });
      expect(realBreach.status).toBe('critical_temperature_breach');
      expect(realBreach.isTrueTemperatureBreach).toBe(true);

      const radioLoss = IoTSensorBridgeService.processTelemetry('tenant-1', {
        sensorId: 'TESTO-02',
        vendor: 'testo',
        equipmentId: 'FRIDGE-DESSERT',
        tempCelsius: 3.2,
        lastCommunicationTs: Date.now() - (20 * 60 * 1000), // 20 min radio lost
      });
      expect(radioLoss.status).toBe('radio_fault');
      expect(radioLoss.isRadioLoss).toBe(true);
    });
  });

  // ── E3: ProductRecallCrossTenantBroadcaster ───────────────────────────────
  describe('E3 — ProductRecallCrossTenantBroadcaster', () => {
    it('broadcasts recall notice only to tenants with batch in stock', async () => {
      const res = await ProductRecallCrossTenantBroadcaster.broadcastRecall(
        'MCC-ADMIN',
        {
          recallId: 'RECALL-2026-08',
          supplierSiret: '12345678900012',
          productName: 'Huîtres Marennes N°3',
          productRef: 'HUITRE-M3',
          affectedBatchNumbers: ['LOT-H-42', 'LOT-H-43'],
          hazardReason: 'Norovirus',
        },
        {
          'tenant-lyon': ['LOT-H-42'],
          'tenant-paris': ['LOT-OTHER'],
          'tenant-marseille': ['LOT-H-43'],
        }
      );

      expect(res.affectedTenantIds).toEqual(['tenant-lyon', 'tenant-marseille']);
      expect(res.broadcastCount).toBe(2);
      expect(AuditLogger.logAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'RECALL_BROADCAST' }));
    });
  });

  // ── E4: FoodDonationMonthlyReportService ──────────────────────────────────
  describe('E4 — FoodDonationMonthlyReportService', () => {
    it('generates monthly donation report with Cerfa fiscal deduction calculation', async () => {
      const rep = await FoodDonationMonthlyReportService.generateMonthlyReport(
        'tenant-1',
        'DIR-1',
        '2026-08',
        [
          {
            id: 'DON-1',
            dateIso: '2026-08-10',
            foodDescription: 'Pains et viennoiseries invendus',
            weightKg: 25,
            temperatureAtHandoverCelsius: 18,
            beneficiaryAssociation: 'Banque Alimentaire Rhône',
            associationRnaNumber: 'W691000123',
            responsibleStaffName: 'Marc',
          },
        ]
      );

      expect(rep.totalWeightKg).toBe(25);
      expect(rep.cerfaFiscalDeductionEstimatedInMicrounits).toBe(60_000_000); // 25kg * 4€ * 60% = 60.00€
    });
  });

  // ── E5: TIACEmergencyWorkflowService ──────────────────────────────────────
  describe('E5 — TIACEmergencyWorkflowService', () => {
    it('triggers emergency TIAC workflow and notifies ARS', async () => {
      const res = await TIACEmergencyWorkflowService.triggerEmergencyWorkflow({
        tenantId: 'tenant-1',
        adminId: 'CHEF-1',
        affectedCovers: 6,
        reportedSymptoms: ['vomissements', 'diarrhee'],
        suspectedDishIds: ['DISH-STEAK-TARTARE'],
        suspectedDishNames: ['Tartare de Charolais'],
        serviceDateIso: '2026-08-21',
        witnessDishesPreserved: true,
      });

      expect(res.incidentId).toContain('TIAC-tenant-1');
      expect(res.witnessDishesSealed).toBe(true);
      expect(AuditLogger.logAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'TIAC_INCIDENT_DECLARED' }));
    });
  });

  // ── L10: KDSItemDeltaModificationService ──────────────────────────────────
  describe('L10 — KDSItemDeltaModificationService', () => {
    it('computes modifier delta and generates KDS badge', () => {
      const res = KDSItemDeltaModificationService.computeDelta({
        tenantId: 'tenant-1',
        orderId: 'ORD-55',
        itemId: 'BURGER-1',
        dishName: 'Burger Classique',
        originalModifiers: ['Avec oignons', 'Sauce burger'],
        newModifiers: ['Sans oignons', 'Sauce burger', 'Supplément bacon'],
      });

      expect(res.hasDelta).toBe(true);
      expect(res.delta.added).toEqual(['Sans oignons', 'Supplément bacon']);
      expect(res.delta.removed).toEqual(['Avec oignons']);
      expect(res.kdsDisplayBadge).toContain('+ AJOUT');
    });
  });

  // ── L11: LotAllergenMatrixService ─────────────────────────────────────────
  describe('L11 — LotAllergenMatrixService', () => {
    it('aggregates allergens dynamically based on active supplier lots', () => {
      const res = LotAllergenMatrixService.computeDishDynamicAllergens(
        'DISH-SAUCE-PESTO',
        'Pesto Genovese Maison',
        [
          { supplierLotId: 'LOT-PARMESAN-01', ingredientId: 'PARMESAN', ingredientName: 'Parmigiano', declaredAllergens: ['lait'], receiptDateIso: '2026-08-20' },
          { supplierLotId: 'LOT-PIN-02', ingredientId: 'PIGNONS', ingredientName: 'Pignons de pin', declaredAllergens: ['fruits_a_coque'], receiptDateIso: '2026-08-21' },
        ]
      );

      expect(res.aggregatedAllergens).toEqual(['fruits_a_coque', 'lait']);
      expect(res.hasCriticalAllergens).toBe(true);
    });
  });

  // ── L12: KDSMicroSequencingService ────────────────────────────────────────
  describe('L12 — KDSMicroSequencingService', () => {
    it('schedules multi-stage cooking sequence', () => {
      const plan = KDSMicroSequencingService.createSequencePlan(
        'tenant-1',
        'ORD-99',
        'Soufflé Grand Marnier',
        [
          { stepNumber: 1, actionLabel: 'Enfourner soufflé 180°C', delayFromStartSeconds: 0, targetStation: 'chaud' },
          { stepNumber: 2, actionLabel: 'Dresser glace vanille', delayFromStartSeconds: 450, targetStation: 'patisserie' },
        ]
      );

      expect(plan.totalDurationSeconds).toBe(450);
      expect(plan.steps.length).toBe(2);
      expect(NexusEventBus.emit).toHaveBeenCalledWith('kds.micro_sequence_step_triggered', expect.any(Object));
    });
  });

  // ── L13: KDSVisualDelayWarningService ─────────────────────────────────────
});
