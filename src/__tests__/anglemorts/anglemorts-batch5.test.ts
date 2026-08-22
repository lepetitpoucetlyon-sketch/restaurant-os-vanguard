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

import { SmartStationRoutingService } from '@/modules/production/kds/services/SmartStationRoutingService';
import { KDSStationRecoveryService } from '@/modules/production/kds/services/KDSStationRecoveryService';
import { RecipeBOMCostService } from '@/modules/production/kds/services/RecipeBOMCostService';
import { PassPickupReminderService } from '@/modules/production/kds/services/PassPickupReminderService';
import { HACCPFrequencyEnforcementService } from '@/modules/compliance/qualite/haccp/services/HACCPFrequencyEnforcementService';
import { IoTSensorBridgeService } from '@/modules/compliance/qualite/haccp/services/IoTSensorBridgeService';
import { ProductRecallCrossTenantBroadcaster } from '@/modules/compliance/qualite/recall/ProductRecallCrossTenantBroadcaster';
import { FoodDonationMonthlyReportService } from '@/modules/compliance/qualite/haccp/services/FoodDonationMonthlyReportService';
import { TIACEmergencyWorkflowService } from '@/modules/compliance/qualite/haccp/services/TIACEmergencyWorkflowService';
import { KDSItemDeltaModificationService } from '@/modules/production/kds/services/KDSItemDeltaModificationService';
import { LotAllergenMatrixService } from '@/modules/production/kds/services/LotAllergenMatrixService';
import { KDSMicroSequencingService } from '@/modules/production/kds/services/KDSMicroSequencingService';
import { KDSVisualDelayWarningService } from '@/modules/production/kds/services/KDSVisualDelayWarningService';
import { VolatileFoodCompatibilityMatrixService } from '@/modules/stock/inventory/VolatileFoodCompatibilityMatrixService';
import { CrustaceanTankMonitorService } from '@/modules/compliance/qualite/haccp/services/CrustaceanTankMonitorService';
import { GreaseTrapSaturationSensorService } from '@/modules/compliance/qualite/haccp/services/GreaseTrapSaturationSensorService';
import { EmergencyExitOpeningChecklistService } from '@/modules/compliance/qualite/haccp/services/EmergencyExitOpeningChecklistService';
import { KitchenHoodDeltaTMonitoringService } from '@/modules/compliance/qualite/haccp/services/KitchenHoodDeltaTMonitoringService';
import { SelfHealingRecipeBomService } from '@/modules/production/kds/services/SelfHealingRecipeBomService';
import { MeatRestingTimerService } from '@/modules/production/kds/services/MeatRestingTimerService';
import { HotColdSyncKdsService } from '@/modules/production/kds/services/HotColdSyncKdsService';
import { ThawingProtocolGuard } from '@/modules/compliance/qualite/haccp/services/ThawingProtocolGuard';
import { PestControl3DRegisterService } from '@/modules/compliance/qualite/haccp/services/PestControl3DRegisterService';
import { CleaningRinseValidationService } from '@/modules/compliance/qualite/haccp/services/CleaningRinseValidationService';
import { MeatAgingHumidityMonitoringService } from '@/modules/compliance/qualite/haccp/services/MeatAgingHumidityMonitoringService';
import { DiningRoomAirQualityCO2MonitorService } from '@/modules/compliance/qualite/haccp/services/DiningRoomAirQualityCO2MonitorService';

describe('Angles Morts — Batch 5 (KDS, Cuisine, Recettes & HACCP)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── B1: SmartStationRoutingService ───────────────────────────────────────
  describe('B1 — SmartStationRoutingService', () => {
    it('routes hot dishes to chaud station', () => {
      const decision = SmartStationRoutingService.routeDish('tenant-1', {
        orderId: 'ORD-1',
        itemId: 'ITEM-1',
        dishName: 'Burger Maison & Frites',
      });
      expect(decision.station).toBe('chaud');
      expect(decision.confidencePct).toBe(95);
    });

    it('routes cocktails to bar station', () => {
      const decision = SmartStationRoutingService.routeDish('tenant-1', {
        orderId: 'ORD-2',
        itemId: 'ITEM-2',
        dishName: 'Cocktail Mojito Passion',
      });
      expect(decision.station).toBe('bar');
    });
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
  describe('L13 — KDSVisualDelayWarningService', () => {
    it('triggers orange warning at 11 min and red critical with amuse-bouche at 13 min', () => {
      const warn11 = KDSVisualDelayWarningService.evaluateDelay({
        tenantId: 'tenant-1',
        orderId: 'ORD-11',
        tableNumber: '5',
        sentToKitchenTimestamp: Date.now() - (11.5 * 60 * 1000),
      });
      expect(warn11.alertLevel).toBe('warning_11m');
      expect(warn11.amuseBoucheTriggered).toBe(false);

      const crit13 = KDSVisualDelayWarningService.evaluateDelay({
        tenantId: 'tenant-1',
        orderId: 'ORD-13',
        tableNumber: '5',
        sentToKitchenTimestamp: Date.now() - (14 * 60 * 1000),
      });
      expect(crit13.alertLevel).toBe('critical_13m');
      expect(crit13.amuseBoucheTriggered).toBe(true);
    });
  });

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

  // ── L73: SelfHealingRecipeBomService ──────────────────────────────────────
  describe('L73 — SelfHealingRecipeBomService', () => {
    it('substitutes out-of-stock ingredient and recalculates portion cost', () => {
      const res = SelfHealingRecipeBomService.applyHealingSubstitution('tenant-1', {
        dishId: 'DISH-BRIOCHE',
        dishName: 'Brioche Perdue',
        missingIngredientId: 'BEURRE-AOP',
        originalPortionCostInMicrounits: 2_500_000,
        originalIngredientCostInMicrounits: 800_000,
        rules: [
          {
            missingIngredientId: 'BEURRE-AOP',
            substituteIngredientId: 'BEURRE-STD',
            substituteName: 'Beurre Gastronomique 82%',
            conversionRatio: 1.0,
            substituteUnitPriceInMicrounits: 600_000,
          },
        ],
      });

      expect(res.canSubstitute).toBe(true);
      expect(res.chosenSubstituteId).toBe('BEURRE-STD');
      expect(res.costDifferenceInMicrounits).toBe(-200_000); // 0.20€ saving
      expect(res.newPortionCostInMicrounits).toBe(2_300_000);
    });
  });

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
