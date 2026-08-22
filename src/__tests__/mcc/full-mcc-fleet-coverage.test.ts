import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SlaMonitoringFleetService } from '@/modules/fleet/services/SlaMonitoringFleetService';
import { MultiTenantBillingEngineService } from '@/modules/fleet/services/MultiTenantBillingEngineService';
import { RemoteConfigKillSwitchService } from '@/modules/fleet/services/RemoteConfigKillSwitchService';
import { GlobalAlertEscalationMatrixService } from '@/modules/fleet/services/GlobalAlertEscalationMatrixService';
import { CrossTenantBenchmarkService } from '@/modules/fleet/services/CrossTenantBenchmarkService';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { AuditLogger } from '@/modules/compliance/securite/AuditLogger';

describe('🏢 Cockpit MCC & Fleet Orchestration — Couverture 100%', () => {
  beforeEach(() => {
    vi.spyOn(NexusEventBus, 'emit').mockReturnValue(true as never);
    vi.spyOn(AuditLogger, 'logAction').mockResolvedValue(undefined as never);
  });

  describe('2. SlaMonitoringFleetService', () => {
    it('doit évaluer une latence normale sans déclencher de brèche SLA', () => {
      const result = SlaMonitoringFleetService.evaluateLatency({
        tenantId: 'tenant-1',
        endpoint: '/api/v1/pos/orders',
        latencyMs: 120,
        statusCode: 200,
        timestamp: Date.now(),
      });

      expect(result.isBreach).toBe(false);
      expect(result.uptimePct).toBe(100.0);
      expect(NexusEventBus.emit).not.toHaveBeenCalledWith('fleet.sla_breach_detected', expect.anything());
    });

    it('doit détecter une brèche SLA sur latence excessive (>250ms) ou erreur 500', () => {
      const result = SlaMonitoringFleetService.evaluateLatency({
        tenantId: 'tenant-1',
        endpoint: '/api/v1/pos/orders',
        latencyMs: 350,
        statusCode: 200,
        timestamp: Date.now(),
      });

      expect(result.isBreach).toBe(true);
      // Agrégation réelle sur fenêtre glissante : 2e sample pour ce tenant+endpoint
      // (1 normal + 1 breach) → 50% d'uptime observé, plus un chiffre magique en dur.
      expect(result.uptimePct).toBe(50.0);
      expect(NexusEventBus.emit).toHaveBeenCalledWith(
        'fleet.sla_breach_detected',
        expect.objectContaining({
          latencyMs: 350,
        })
      );
    });
  });

  describe('3. MultiTenantBillingEngineService', () => {
    it('doit calculer la facture SaaS mensuelle avec base, terminaux, volume variable et TVA 20%', async () => {
      const invoice = await MultiTenantBillingEngineService.generateMonthlySaaSInvoice('admin-billing-1', {
        tenantId: 'tenant-lyon-1',
        periodLabel: '2026-08',
        planBaseFeeInMicrounits: 99_000_000, // 99€
        activePosTerminalCount: 3,
        terminalFeeInMicrounits: 29_000_000, // 29€ * 3 = 87€
        totalVolumeProcessedInMicrounits: 100_000_000_000, // 100 000€
        variableCommissionBps: 50, // 0.50% = 500€
      });

      // Total HT = 99€ + 87€ + 500€ = 686€ (686_000_000)
      // TVA 20% = 137.20€ (137_200_000)
      // Total TTC = 823.20€ (823_200_000)
      expect(invoice.baseFeeInMicrounits).toBe(99_000_000);
      expect(invoice.terminalsFeeInMicrounits).toBe(87_000_000);
      expect(invoice.variableVolumeFeeInMicrounits).toBe(500_000_000);
      expect(invoice.totalBeforeTaxInMicrounits).toBe(686_000_000);
      expect(invoice.taxVatInMicrounits).toBe(137_200_000);
      expect(invoice.totalTtcInMicrounits).toBe(823_200_000);

      expect(NexusEventBus.emit).toHaveBeenCalledWith(
        'fleet.saas_billing_invoiced',
        expect.objectContaining({
          invoiceId: 'INV-SAAS-tenant-lyon-1-2026-08',
          totalAmountInMicrounits: 823_200_000,
        })
      );
    });
  });

  describe('4. RemoteConfigKillSwitchService', () => {
    it('doit basculer un feature flag à chaud et notifier le bus', async () => {
      const state = await RemoteConfigKillSwitchService.toggleFeature({
        tenantId: 'tenant-123',
        adminId: 'admin-ops',
        featureFlag: 'enable_ai_sommelier',
        enable: false,
        reason: 'Maintenance API OpenAI en cours',
      });

      expect(state.isEnabled).toBe(false);
      expect(state.featureFlag).toBe('enable_ai_sommelier');

      expect(NexusEventBus.emit).toHaveBeenCalledWith(
        'fleet.kill_switch_toggled',
        expect.objectContaining({
          featureFlag: 'enable_ai_sommelier',
          isEnabled: false,
        })
      );

      expect(AuditLogger.logAction).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'REMOTE_KILL_SWITCH_ENGAGED',
        })
      );
    });
  });

  describe('5. GlobalAlertEscalationMatrixService', () => {
    it('doit escalader un incident P1 vers PagerDuty', () => {
      const result = GlobalAlertEscalationMatrixService.escalateIncident({
        incidentId: 'INC-001',
        tenantId: 'tenant-1',
        severity: 'P1',
        title: 'Crash chaîne fiscale NF525',
        impactedModule: 'fiscal_chain',
      });

      expect(result.isEscalatedToOnCall).toBe(true);
      expect(result.destinationService).toBe('pagerduty');
      expect(NexusEventBus.emit).toHaveBeenCalledWith(
        'fleet.alert_escalated',
        expect.objectContaining({
          severity: 'P1',
          destinationService: 'pagerduty',
        })
      );
    });

    it('doit escalader un incident P2 vers Opsgenie', () => {
      const result = GlobalAlertEscalationMatrixService.escalateIncident({
        incidentId: 'INC-002',
        tenantId: 'tenant-1',
        severity: 'P2',
        title: 'TPE déconnecté',
        impactedModule: 'payments',
      });

      expect(result.isEscalatedToOnCall).toBe(true);
      expect(result.destinationService).toBe('opsgenie');
    });

    it('doit router un incident P3 vers Slack interne', () => {
      const result = GlobalAlertEscalationMatrixService.escalateIncident({
        incidentId: 'INC-003',
        tenantId: 'tenant-1',
        severity: 'P3',
        title: 'Lenteur KDS mineure',
        impactedModule: 'kds',
      });

      expect(result.isEscalatedToOnCall).toBe(false);
      expect(result.destinationService).toBe('slack_internal');
    });
  });

  describe('6. CrossTenantBenchmarkService', () => {
    it('doit calculer le percentile et les métriques moyennes d’un cluster', () => {
      const tenant = {
        tenantId: 'tenant-1',
        clusterCategory: 'bistronomie_lyon',
        avgTicketInMicrounits: 45_000_000, // 45€
        foodCostRatioPct: 28,
        revenuePerStaffHourInMicrounits: 85_000_000,
      };

      const cohort = [
        { tenantId: 'tenant-2', clusterCategory: 'bistronomie_lyon', avgTicketInMicrounits: 35_000_000, foodCostRatioPct: 32, revenuePerStaffHourInMicrounits: 70_000_000 },
        { tenantId: 'tenant-3', clusterCategory: 'bistronomie_lyon', avgTicketInMicrounits: 40_000_000, foodCostRatioPct: 30, revenuePerStaffHourInMicrounits: 80_000_000 },
        { tenantId: 'tenant-4', clusterCategory: 'bistronomie_lyon', avgTicketInMicrounits: 50_000_000, foodCostRatioPct: 26, revenuePerStaffHourInMicrounits: 90_000_000 },
        { tenantId: 'tenant-5', clusterCategory: 'bistronomie_lyon', avgTicketInMicrounits: 55_000_000, foodCostRatioPct: 25, revenuePerStaffHourInMicrounits: 95_000_000 },
      ];

      const report = CrossTenantBenchmarkService.computeBenchmark(tenant, cohort);

      expect(report.clusterAvgTicketInMicrounits).toBe(45_000_000);
      expect(report.clusterMedianFoodCostPct).toBe(30);
      expect(report.percentileRank).toBe(50); // 2 out of 4 lower

      expect(NexusEventBus.emit).toHaveBeenCalledWith(
        'fleet.benchmark_computed',
        expect.objectContaining({
          clusterCategory: 'bistronomie_lyon',
          percentileRank: 50,
        })
      );
    });

    it('doit gérer une cohorte vide avec des valeurs par défaut sécurisées', () => {
      const tenant = {
        tenantId: 'tenant-solo',
        clusterCategory: 'nouveau_concept',
        avgTicketInMicrounits: 30_000_000,
        foodCostRatioPct: 29,
        revenuePerStaffHourInMicrounits: 60_000_000,
      };

      const report = CrossTenantBenchmarkService.computeBenchmark(tenant, []);
      expect(report.percentileRank).toBe(50);
      expect(report.clusterAvgTicketInMicrounits).toBe(30_000_000);
    });
  });
});
