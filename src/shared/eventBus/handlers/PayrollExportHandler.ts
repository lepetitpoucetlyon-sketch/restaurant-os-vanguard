import { NexusEventBus } from '../NexusEventBus';
import { empireAudit } from '@/infrastructure/services/audit';
import { logger } from '@/lib/logger';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { PayrollConnectorFactory } from '@/modules/human/connectors/payroll/PayrollConnectorFactory';
import { PrepaieBuilder } from '@/modules/human/payroll/PrepaieBuilder';
import type { PayrollProviderConfig } from '@/modules/human/payroll/types';

export class PayrollExportHandler {
  static register() {
    return NexusEventBus.on('hr.preroll_validated', async (payload) => {
      if (payload.isSimulation) return;
      const { tenantId, periodId, validatedBy, totalEmployees } = payload;

      try {
        const providerConfig = await Nexus.adapter.get<PayrollProviderConfig>(
          `tenants/${tenantId}/settings/payroll`
        );

        const providerId = providerConfig?.provider ?? process.env.PAYROLL_DEFAULT_PROVIDER;

        if (!providerId) {
          logger.warn(`[PayrollExportHandler] Aucun provider configuré pour ${tenantId}. Mise en file d'attente.`);
          await Nexus.adapter.update(`tenants/${tenantId}/hr/pendingExports/${periodId}`, {
            periodId, status: 'queued', totalEmployees, queuedAt: Date.now(),
          });
          return;
        }

        logger.info(`[PayrollExportHandler] Export via provider "${providerId}" pour ${periodId}`);
        const connector = PayrollConnectorFactory.get(providerId);
        const summary = await PrepaieBuilder.build(tenantId, periodId);
        const result = await connector.syncPeriod(summary);

        await Nexus.adapter.update(`tenants/${tenantId}/hr/payroll_exports/${periodId}`, {
          periodId,
          provider: connector.id,
          status: result.success ? 'completed' : 'partial',
          employeesUpserted: result.employeesUpserted,
          variablesAccepted: result.variablesAccepted,
          errors: result.errors,
          externalRef: result.externalRef,
          exportedAt: Date.now(),
        });

        empireAudit.log({
          action: 'hr.payroll_export_success',
          module: 'human',
          userId: validatedBy || 'system',
          instanceId: tenantId,
          details: {
            periodId, provider: connector.id, validatedBy, totalEmployees,
            employeesUpserted: result.employeesUpserted,
            variablesAccepted: result.variablesAccepted,
            errors: result.errors,
          },
          severity: 'high',
          timestamp: new Date(),
        });

      } catch (error) {
        logger.error(`[PayrollExportHandler] Erreur export:`, String(error));

        await Nexus.adapter.update(`tenants/${tenantId}/hr/pendingExports/${periodId}`, {
          periodId, status: 'error_queued',
          error: String(error), totalEmployees, queuedAt: Date.now(),
        });

        empireAudit.log({
          action: 'hr.payroll_export_failed',
          module: 'human',
          userId: validatedBy || 'system',
          instanceId: tenantId,
          details: { periodId, error: String(error) },
          severity: 'critical',
          timestamp: new Date(),
        });
      }
    }, { id: 'payroll-export', priority: 'HIGH' });
  }
}
