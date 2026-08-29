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
});
