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

import { MultiTenantBillingEngineService } from '@/lib/mcc/fleet/services/MultiTenantBillingEngineService';
import { CrossTenantBenchmarkService } from '@/lib/mcc/fleet/services/CrossTenantBenchmarkService';
import { GlobalComplianceAuditMatrixService } from '@/modules/compliance/securite/GlobalComplianceAuditMatrixService';
import { RemoteConfigKillSwitchService } from '@/lib/mcc/fleet/services/RemoteConfigKillSwitchService';
import { GlobalAlertEscalationMatrixService } from '@/lib/mcc/fleet/services/GlobalAlertEscalationMatrixService';
import { CrossTenantCashPoolTreasuryService } from '@/modules/finance/tresorerie/CrossTenantCashPoolTreasuryService';
import { SlaMonitoringFleetService } from '@/lib/mcc/fleet/services/SlaMonitoringFleetService';
import { CrossTenantRoleHierarchyService } from '@/modules/compliance/securite/CrossTenantRoleHierarchyService';
import { GdprDataAnonymizerService } from '@/modules/compliance/securite/GdprDataAnonymizerService';
import { SecurityIncidentLockdownService } from '@/modules/compliance/securite/SecurityIncidentLockdownService';
import { NoShowPenaltyShieldService } from '@/modules/commerce/relation/crm/services/NoShowPenaltyShieldService';
import { GuestAllergenSafetyProfileService } from '@/modules/commerce/relation/crm/services/GuestAllergenSafetyProfileService';
import { AutomaticReviewBoosterService } from '@/modules/commerce/relation/crm/services/AutomaticReviewBoosterService';
import { TurnoverPredictionService, type MenuProfile } from '@/modules/commerce/relation/reservations/services/TurnoverPredictionService';


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
});
