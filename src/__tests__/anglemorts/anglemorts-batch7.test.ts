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

import { MultiTenantBillingEngineService } from '@/modules/fleet/services/MultiTenantBillingEngineService';
import { CrossTenantBenchmarkService } from '@/modules/fleet/services/CrossTenantBenchmarkService';
import { GlobalComplianceAuditMatrixService } from '@/modules/compliance/securite/GlobalComplianceAuditMatrixService';
import { RemoteConfigKillSwitchService } from '@/modules/fleet/services/RemoteConfigKillSwitchService';
import { GlobalAlertEscalationMatrixService } from '@/modules/fleet/services/GlobalAlertEscalationMatrixService';
import { CrossTenantCashPoolTreasuryService } from '@/modules/finance/tresorerie/CrossTenantCashPoolTreasuryService';
import { SlaMonitoringFleetService } from '@/modules/fleet/services/SlaMonitoringFleetService';
import { CrossTenantRoleHierarchyService } from '@/modules/compliance/securite/CrossTenantRoleHierarchyService';
import { GdprDataAnonymizerService } from '@/modules/compliance/securite/GdprDataAnonymizerService';
import { SecurityIncidentLockdownService } from '@/modules/compliance/securite/SecurityIncidentLockdownService';
import { NoShowPenaltyShieldService } from '@/modules/commerce/crm/NoShowPenaltyShieldService';
import { GuestAllergenSafetyProfileService } from '@/modules/commerce/crm/GuestAllergenSafetyProfileService';
import { AutomaticReviewBoosterService } from '@/modules/commerce/crm/AutomaticReviewBoosterService';
import { CrossLocationLoyaltyService } from '@/modules/commerce/crm/CrossLocationLoyaltyService';
import { TableTurnoverOptimizationService } from '@/modules/commerce/crm/TableTurnoverOptimizationService';
import { SpecialEventDepositEscrowService } from '@/modules/commerce/crm/SpecialEventDepositEscrowService';
import { SmartTipDigitalPoolService } from '@/modules/finance/tresorerie/SmartTipDigitalPoolService';
import { PrivateDiningContractSignerService } from '@/modules/commerce/crm/PrivateDiningContractSignerService';
import { DynamicPricingSurgeEngineService } from '@/modules/commerce/crm/DynamicPricingSurgeEngineService';
import { SommelierPairingEngineService } from '@/modules/commerce/crm/SommelierPairingEngineService';
import { VipGuestPreferenceMemoryService } from '@/modules/commerce/crm/VipGuestPreferenceMemoryService';
import { LostAndFoundRegistryService } from '@/modules/commerce/crm/LostAndFoundRegistryService';
import { InfluencerCollaborationTrackerService } from '@/modules/commerce/crm/InfluencerCollaborationTrackerService';
import { DigitalCoatCheckTagService } from '@/modules/commerce/crm/DigitalCoatCheckTagService';
import { ValetParkingManagementService } from '@/modules/commerce/crm/ValetParkingManagementService';

describe('Angles Morts — Batch 7 (MCC Flotte, Observabilité, Trésorerie, Sécurité & CRM)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── MCC-A2: MultiTenantBillingEngineService ──────────────────────────────
  describe('MCC-A2 — MultiTenantBillingEngineService', () => {
    it('computes monthly SaaS subscription with active terminals and 20% VAT', async () => {
      const inv = await MultiTenantBillingEngineService.generateMonthlySaaSInvoice('BILLING-BOT', {
        tenantId: 'tenant-1',
        periodLabel: '2026-08',
        planBaseFeeInMicrounits: 99_000_000, // 99.00 €
        activePosTerminalCount: 3,
        terminalFeeInMicrounits: 29_000_000, // 3 * 29 = 87.00 €
        totalVolumeProcessedInMicrounits: 50_000_000_000, // 50k € volume
        variableCommissionBps: 20, // 20 bps = 0.20% = 100.00 €
      });

      expect(inv.terminalsFeeInMicrounits).toBe(87_000_000);
      expect(inv.variableVolumeFeeInMicrounits).toBe(100_000_000);
      expect(inv.totalBeforeTaxInMicrounits).toBe(286_000_000); // 99 + 87 + 100 = 286.00 €
      expect(inv.taxVatInMicrounits).toBe(57_200_000); // 20% = 57.20 €
      expect(inv.totalTtcInMicrounits).toBe(343_200_000); // 343.20 €
    });
  });

  // ── MCC-A3: CrossTenantBenchmarkService ──────────────────────────────────
  describe('MCC-A3 — CrossTenantBenchmarkService', () => {
    it('computes cluster benchmark and percentile rank', () => {
      const rep = CrossTenantBenchmarkService.computeBenchmark(
        { tenantId: 't1', clusterCategory: 'bistro_lyon', avgTicketInMicrounits: 38_000_000, foodCostRatioPct: 28.5, revenuePerStaffHourInMicrounits: 65_000_000 },
        [
          { tenantId: 't2', clusterCategory: 'bistro_lyon', avgTicketInMicrounits: 30_000_000, foodCostRatioPct: 32.0, revenuePerStaffHourInMicrounits: 50_000_000 },
          { tenantId: 't3', clusterCategory: 'bistro_lyon', avgTicketInMicrounits: 45_000_000, foodCostRatioPct: 26.0, revenuePerStaffHourInMicrounits: 75_000_000 },
        ]
      );

      expect(rep.clusterAvgTicketInMicrounits).toBe(37_500_000);
      expect(rep.percentileRank).toBe(50);
    });
  });

  // ── MCC-B1: GlobalComplianceAuditMatrixService ────────────────────────────
  describe('MCC-B1 — GlobalComplianceAuditMatrixService', () => {
    it('evaluates global compliance matrix and penalizes invalid NF525', () => {
      const card = GlobalComplianceAuditMatrixService.evaluateTenantCompliance({
        tenantId: 'tenant-1',
        tradeName: 'Le Petit Bouchon',
        nf525Valid: false, // Critical failure
        haccpDailyLogsComplete: true,
        hcrRestPeriodsRespected: true,
        gdprConsentUpToDate: true,
      });

      expect(card.isFullyCompliant).toBe(false);
      expect(card.overallScorePct).toBe(60);
      expect(card.nonCompliantAreas).toContain('NF525 Fiscale');
    });
  });

  // ── MCC-B2: RemoteConfigKillSwitchService ─────────────────────────────────
  describe('MCC-B2 — RemoteConfigKillSwitchService', () => {
    it('toggles remote kill-switch and logs audit', async () => {
      const res = await RemoteConfigKillSwitchService.toggleFeature({
        tenantId: 'tenant-1',
        adminId: 'ADMIN-MCC',
        featureFlag: 'enable_ai_sommelier',
        enable: false,
        reason: 'Provider OpenAI rate limited',
      });

      expect(res.isEnabled).toBe(false);
      expect(AuditLogger.logAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'REMOTE_KILL_SWITCH_ENGAGED' }));
    });
  });

  // ── MCC-C1: GlobalAlertEscalationMatrixService ────────────────────────────
  describe('MCC-C1 — GlobalAlertEscalationMatrixService', () => {
    it('escalates P1 critical incident to PagerDuty', () => {
      const esc = GlobalAlertEscalationMatrixService.escalateIncident({
        incidentId: 'INC-1',
        tenantId: 'tenant-1',
        severity: 'P1',
        title: 'NF525 Seal Chain Broken',
        impactedModule: 'fiscal_chain',
      });

      expect(esc.isEscalatedToOnCall).toBe(true);
      expect(esc.destinationService).toBe('pagerduty');
      expect(NexusEventBus.emit).toHaveBeenCalledWith('fleet.alert_escalated', expect.any(Object));
    });
  });

  // ── MCC-C3: CrossTenantCashPoolTreasuryService ────────────────────────────
  describe('MCC-C3 — CrossTenantCashPoolTreasuryService', () => {
    it('generates cash sweep orders from surplus to deficit restaurants', () => {
      const plan = CrossTenantCashPoolTreasuryService.computeRebalancing('GROUP-LYON', [
        { tenantId: 'T1', tradeName: 'Restaurant Bellecour', currentCashInMicrounits: 80_000_000_000, targetWorkingCapitalInMicrounits: 30_000_000_000 }, // +50k surplus
        { tenantId: 'T2', tradeName: 'Restaurant Presquile', currentCashInMicrounits: 10_000_000_000, targetWorkingCapitalInMicrounits: 25_000_000_000 }, // -15k deficit
      ]);

      expect(plan.rebalanceOrders.length).toBe(1);
      expect(plan.rebalanceOrders[0].transferAmountInMicrounits).toBe(15_000_000_000);
      expect(plan.rebalanceOrders[0].fromTenantId).toBe('T1');
      expect(plan.rebalanceOrders[0].toTenantId).toBe('T2');
    });
  });

  // ── MCC-C4: SlaMonitoringFleetService ─────────────────────────────────────
  describe('MCC-C4 — SlaMonitoringFleetService', () => {
    it('flags SLA latency breach when POS transaction exceeds 250ms', () => {
      const check = SlaMonitoringFleetService.evaluateLatency({
        tenantId: 'tenant-1',
        endpoint: '/api/pos/seal-order',
        latencyMs: 420,
        statusCode: 200,
        timestamp: Date.now(),
      });

      expect(check.isBreach).toBe(true);
      expect(NexusEventBus.emit).toHaveBeenCalledWith('fleet.sla_breach_detected', expect.any(Object));
    });
  });

  // ── MCC-D1: CrossTenantRoleHierarchyService ──────────────────────────────
  describe('MCC-D1 — CrossTenantRoleHierarchyService', () => {
    it('allows SuperAdmin to delegate StoreManager role but prevents cashier delegation', () => {
      const valid = CrossTenantRoleHierarchyService.delegateRole({
        masterAdminId: 'SUPER-1',
        masterRole: 'super_admin_mcc',
        targetTenantId: 'tenant-1',
        assigneeUserId: 'USER-1',
        roleToAssign: 'local_store_manager',
      });
      expect(valid.isPermitted).toBe(true);

      const invalid = CrossTenantRoleHierarchyService.delegateRole({
        masterAdminId: 'STAFF-1',
        masterRole: 'cashier_staff',
        targetTenantId: 'tenant-1',
        assigneeUserId: 'USER-2',
        roleToAssign: 'regional_manager',
      });
      expect(invalid.isPermitted).toBe(false);
    });
  });

  // ── MCC-D3: GdprDataAnonymizerService ─────────────────────────────────────
  describe('MCC-D3 — GdprDataAnonymizerService', () => {
    it('anonymizes customer PII while preserving fiscal transactions', async () => {
      const res = await GdprDataAnonymizerService.anonymizeCustomer('tenant-1', 'DPO-1', {
        customerId: 'CUST-99',
        fullName: 'Claire Martin',
        email: 'claire@martin.fr',
        phoneNumber: '+33612345678',
        loyaltyPoints: 350,
      });

      expect(res.fiscalTransactionsPreserved).toBe(true);
      expect(res.anonymizedCustomerRecord.fullName).toBe('CLIENT_ANONYMISÉ_RGPD');
      expect(AuditLogger.logAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'GDPR_ANONYMIZATION_EXECUTED' }));
    });
  });

  // ── MCC-D5: SecurityIncidentLockdownService ───────────────────────────────
  describe('MCC-D5 — SecurityIncidentLockdownService', () => {
    it('revokes active tokens and enforces tenant lockdown', async () => {
      const res = await SecurityIncidentLockdownService.executeLockdown({
        tenantId: 'tenant-compromised',
        triggeredByAdminId: 'SOC-ADMIN',
        reason: 'Suspicious API key exfiltration attempt',
        activeSessionTokens: ['TOK-1', 'TOK-2', 'TOK-3'],
      });

      expect(res.isLocked).toBe(true);
      expect(res.revokedTokensCount).toBe(3);
      expect(AuditLogger.logAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'SECURITY_LOCKDOWN_ENFORCED' }));
    });
  });

  // ── L75: NoShowPenaltyShieldService ───────────────────────────────────────
  describe('L75 — NoShowPenaltyShieldService', () => {
    it('charges no-show penalty per cover under Civil Code 1590', async () => {
      const receipt = await NoShowPenaltyShieldService.chargeNoShowPenalty({
        tenantId: 'tenant-1',
        adminId: 'MGR-1',
        reservationId: 'RES-4455',
        customerId: 'CUST-1',
        covers: 4,
        penaltyPerCoverInMicrounits: 25_000_000, // 25.00 € / cover
        stripePaymentMethodId: 'pm_test_123',
      });

      expect(receipt.totalPenaltyInMicrounits).toBe(100_000_000); // 100.00 €
      expect(receipt.legalNotice).toContain('article 1590');
      expect(AuditLogger.logAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'NO_SHOW_PENALTY_CHARGED' }));
    });
  });

  // ── L76: GuestAllergenSafetyProfileService ────────────────────────────────
  describe('L76 — GuestAllergenSafetyProfileService', () => {
    it('blocks order and raises alert when dish contains customer critical allergen', () => {
      const rep = GuestAllergenSafetyProfileService.verifyOrderSafety(
        'tenant-1',
        { customerId: 'VIP-1', fullName: 'Alexandre Dumas', criticalAllergens: ['arachides', 'crustaces'] },
        { orderId: 'ORD-9', dishName: 'Pad Thaï Crevettes', dishAllergens: ['crustaces', 'soja'] }
      );

      expect(rep.hasConflict).toBe(true);
      expect(rep.conflictingAllergens).toEqual(['crustaces']);
      expect(rep.alertMessage).toContain('DANGER ALLERGÈNE');
    });
  });

  // ── L77: AutomaticReviewBoosterService ────────────────────────────────────
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

      expect(pred.predictedTotalDurationMinutes).toBe(75);
      expect(pred.isSecondSeatingFeasible).toBe(true);
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

  // ── T72: DynamicPricingSurgeEngineService ─────────────────────────────────
  describe('T72 — DynamicPricingSurgeEngineService', () => {
    it('applies +15% surge pricing during high occupancy match nights', () => {
      const surge = DynamicPricingSurgeEngineService.computeDynamicPrice('tenant-1', {
        basePriceInMicrounits: 10_000_000, // 10.00 € pint
        isMatchNightOrPeakEvent: true,
        currentOccupancyPct: 92,
      });

      expect(surge.appliedMultiplier).toBe(1.15);
      expect(surge.adjustedPriceInMicrounits).toBe(11_500_000); // 11.50 €
      expect(surge.isLegalNoticeRequired).toBe(true);
    });
  });

  // ── T73: SommelierPairingEngineService ─────────────────────────────────────
  describe('T73 — SommelierPairingEngineService', () => {
    it('recommends tannic red wine for red meat dish', () => {
      const rec = SommelierPairingEngineService.recommendPairing(
        'tenant-1',
        'ORD-5',
        { dishSku: 'COTE-BOEUF', dishName: 'Côte de Bœuf Maturée', dishCategory: 'viande_rouge' },
        [
          { wineSku: 'CHATEAUNEUF', wineName: 'Châteauneuf-du-Pape', appellation: 'AOP', vintage: '2020', bottlesInStock: 8, glassPriceInMicrounits: 14_000_000, tags: ['tannique', 'puissant', 'boise'] },
          { wineSku: 'CHABLIS', wineName: 'Chablis 1er Cru', appellation: 'AOP', vintage: '2022', bottlesInStock: 5, glassPriceInMicrounits: 11_000_000, tags: ['mineral', 'vif'] },
        ]
      );

      expect(rec?.recommendedWine.wineSku).toBe('CHATEAUNEUF');
      expect(rec?.sommelierTastingNote).toContain('Côte de Bœuf');
    });
  });

  // ── T74: VipGuestPreferenceMemoryService ───────────────────────────────────
  describe('T74 — VipGuestPreferenceMemoryService', () => {
    it('applies VIP table and beverage preferences and logs audit', async () => {
      const greeting = await VipGuestPreferenceMemoryService.applyPreferences('tenant-1', 'MAITRE-HOTEL', {
        customerId: 'VIP-7',
        guestName: 'Madame de La Tour',
        preferredTableNumber: 'Table 1 (Alcôve)',
        favoriteWater: 'gazeuse_chateldon',
        meatCookingPreference: 'saignant',
        dietaryRestrictions: ['sans_gluten'],
        notes: 'Toujours servir le pain sans gluten tiède',
      });

      expect(greeting.vipTableAssignment).toBe('Table 1 (Alcôve)');
      expect(greeting.greetingSummary).toContain('gazeuse_chateldon');
      expect(AuditLogger.logAction).toHaveBeenCalledWith(expect.objectContaining({ action: 'VIP_PREFERENCE_UPDATED' }));
    });
  });

  // ── T75: LostAndFoundRegistryService ──────────────────────────────────────
  describe('T75 — LostAndFoundRegistryService', () => {
    it('registers lost item in digital registry', () => {
      const item = LostAndFoundRegistryService.registerItem('tenant-1', {
        itemId: 'LOST-01',
        itemDescription: 'Lunettes de soleil Ray-Ban étui cuir',
        locationFound: 'Terrasse Table 8 sous chaise',
        foundByStaffName: 'Nicolas',
      });

      expect(item.isReturnedToOwner).toBe(false);
      expect(NexusEventBus.emit).toHaveBeenCalledWith('crm.lost_found_registered', expect.any(Object));
    });
  });

  // ── T76: InfluencerCollaborationTrackerService ────────────────────────────
  describe('T76 — InfluencerCollaborationTrackerService', () => {
    it('measures influencer ROI on promo code orders', () => {
      const rep = InfluencerCollaborationTrackerService.evaluateRoi('tenant-1', {
        influencerHandle: '@lyon_food_guide',
        promoCode: 'LYONFOOD10',
        complimentaryMealCostInMicrounits: 90_000_000, // 90.00 € meal
        generatedOrdersCount: 28,
        totalGeneratedRevenueInMicrounits: 1_250_000_000, // 1 250.00 €
      });

      expect(rep.isCampaignProfitable).toBe(true);
      expect(rep.roiMultiplier).toBe(13.9); // ~13.9x ROI
    });
  });

  // ── T77: DigitalCoatCheckTagService ───────────────────────────────────────
  describe('T77 — DigitalCoatCheckTagService', () => {
    it('issues digital coat check tag with claim token', () => {
      const tag = DigitalCoatCheckTagService.issueDigitalTag({
        tenantId: 'tenant-1',
        tagNumber: 'VEST-88',
        customerPhone: '+33612345678',
        garmentDescription: 'Veste costume bleue',
      });

      expect(tag.digitalClaimQrUrl).toContain('/vestiaire/VEST-88');
      expect(tag.smsClaimToken).toContain('CLAIM-VEST-88');
    });
  });

  // ── T78: ValetParkingManagementService ────────────────────────────────────
  describe('T78 — ValetParkingManagementService', () => {
    it('creates valet parking ticket with spot assignment', () => {
      const ticket = ValetParkingManagementService.checkInVehicle({
        tenantId: 'tenant-1',
        vehiclePlate: 'AB-123-CD',
        vehicleModel: 'Porsche Taycan',
        customerPhone: '+33698765432',
        assignedSpotNumber: 'BOX-04',
      });

      expect(ticket.vehiclePlate).toBe('AB-123-CD');
      expect(ticket.spotNumber).toBe('BOX-04');
      expect(ticket.retrievalSmsUrl).toContain('/claim/VALET-tenant-1');
    });
  });
});
