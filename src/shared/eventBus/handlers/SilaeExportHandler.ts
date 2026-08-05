/* eslint-disable no-restricted-imports -- aggregator: must use deep paths for cycle prevention */
import { NexusEventBus } from '../NexusEventBus';
import { empireAudit } from '@/infrastructure/services/audit';
import { logger } from '@/lib/logger';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { SilaeClient } from '@/modules/human/remuneration/payroll/SilaeClient';
import { MergePayrollClient } from '@/modules/human/remuneration/payroll/MergePayrollClient';
import { PrepaieBuilder } from '@/modules/human/remuneration/payroll/PrepaieBuilder';
import type { PayrollProviderConfig } from '@/modules/human/remuneration/payroll/types';

export class SilaeExportHandler {
  static register() {
    return NexusEventBus.on('hr.preroll_validated', async (payload) => {
      if (payload.isSimulation) return;
      const { tenantId, periodId, validatedBy, totalEmployees } = payload;
      logger.info(`[SilaeExportHandler] Exporting payroll for period ${periodId} (Tenant: ${tenantId})`);

      try {
        // Charger la config provider du tenant
        const providerConfig = await Nexus.adapter.get<PayrollProviderConfig>(
          `tenants/${tenantId}/settings/payroll`
        );

        // Construire le summary pré-paie pour la période
        const summary = await PrepaieBuilder.build(tenantId, periodId);

        const silaeKey = providerConfig?.silaeApiKey ?? process.env.SILAE_API_KEY;
        const mergeKey = process.env.MERGE_API_KEY;

        // --- Route 1 : Silae (prioritaire) ---
        if (silaeKey) {
          logger.info(`[SilaeExportHandler] Sync via SilaeClient pour ${periodId}`);
          const silaeClient = new SilaeClient({
            provider: 'silae',
            silaeApiKey: silaeKey,
            silaeDossierId: providerConfig?.silaeDossierId,
            silaeBaseUrl: providerConfig?.silaeBaseUrl,
          });

          const result = await silaeClient.syncPeriod(summary);

          await Nexus.adapter.update(`tenants/${tenantId}/hr/payroll_exports/${periodId}`, {
            periodId,
            provider: 'silae',
            status: result.success ? 'completed' : 'partial',
            employeesUpserted: result.employeesUpserted,
            variablesAccepted: result.variablesAccepted,
            errors: result.errors,
            exportedAt: Date.now(),
          });

          empireAudit.log({
            action: 'hr.silae_export_success',
            module: 'human',
            userId: validatedBy || 'system',
            instanceId: tenantId,
            details: {
              periodId,
              provider: 'silae',
              validatedBy,
              totalEmployees,
              employeesUpserted: result.employeesUpserted,
              variablesAccepted: result.variablesAccepted,
              errors: result.errors,
            },
            severity: 'high',
            timestamp: new Date(),
          });
          return;
        }

        // --- Route 2 : Merge.dev (fallback si clé Merge disponible) ---
        if (mergeKey && providerConfig?.mergeAccountToken) {
          logger.info(`[SilaeExportHandler] Fallback Merge.dev pour ${periodId}`);
          const mergeClient = new MergePayrollClient({
            provider: 'merge',
            mergeAccountToken: providerConfig.mergeAccountToken,
          });

          const result = await mergeClient.syncPeriod(summary);

          await Nexus.adapter.update(`tenants/${tenantId}/hr/payroll_exports/${periodId}`, {
            periodId,
            provider: 'merge',
            status: result.success ? 'completed' : 'partial',
            synced: result.synced,
            errors: result.errors,
            exportedAt: Date.now(),
          });

          empireAudit.log({
            action: 'hr.merge_export_success',
            module: 'human',
            userId: validatedBy || 'system',
            instanceId: tenantId,
            details: {
              periodId,
              provider: 'merge',
              validatedBy,
              totalEmployees,
              synced: result.synced,
              errors: result.errors,
            },
            severity: 'high',
            timestamp: new Date(),
          });
          return;
        }

        // --- Route 3 : Aucune clé, mise en file d'attente ---
        logger.warn(`[SilaeExportHandler] Aucune clé paie configurée. Mode dégradé: mise en file d'attente (pendingExports)`);
        await Nexus.adapter.update(`tenants/${tenantId}/hr/pendingExports/${periodId}`, {
          periodId,
          status: 'queued',
          totalEmployees,
          queuedAt: Date.now(),
        });

      } catch (error) {
        logger.error(`[SilaeExportHandler] Erreur lors de l'export:`, String(error));

        // Mode dégradé en cas d'erreur API: file d'attente Outbox pour retry automatique
        const outboxId = `silae_retry_${periodId}_${Date.now()}`;
        await Nexus.adapter.update(`tenants/${tenantId}/outbox/${outboxId}`, {
            type: 'hr.preroll_validated',
            payload,
            status: 'error_queued',
            error: String(error),
            retryCount: 0,
            queuedAt: Date.now()
        });

        empireAudit.log({
          action: 'hr.payroll_export_failed',
          module: 'human',
          userId: validatedBy || 'system',
          instanceId: tenantId,
          details: {
            periodId: periodId,
            error: String(error)
          },
          severity: 'critical',
          timestamp: new Date(),
        });
      }
    }, { id: 'silae-export', priority: 'HIGH' });
  }
}
