/* eslint-disable no-restricted-imports -- aggregator: must use deep paths for cycle prevention */
import { NexusEventBus } from '../NexusEventBus';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { PayrollConnectorFactory } from '@/modules/human/connectors/payroll/PayrollConnectorFactory';
import { PrepaieBuilder } from '@/modules/human/remuneration/payroll/PrepaieBuilder';
import type { PayrollProviderConfig } from '@/modules/human/remuneration/payroll/types';
import { toError } from "@/lib/toError";
import { withRoleGuard } from '../middleware/withRoleGuard';
import { z } from 'zod';

const PayloadSchema = z.object({
  tenantId: z.string(),
  periodId: z.string(),
  validatedBy: z.string(),
  totalEmployees: z.number(),
  isSimulation: z.boolean().optional()
});

export class PayrollExportHandler {
  static register() {
    return NexusEventBus.onValidated(
      'hr.preroll_validated',
      PayloadSchema,
      withRoleGuard('admin', async (payload) => {
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
        logger.error(`[PayrollExportHandler] Erreur export:`, toError(error).message);

        await Nexus.adapter.update(`tenants/${tenantId}/hr/pendingExports/${periodId}`, {
          periodId, status: 'error_queued',
          error: toError(error).message, totalEmployees, queuedAt: Date.now(),
        });

        empireAudit.log({
          action: 'hr.payroll_export_failed',
          module: 'human',
          userId: validatedBy || 'system',
          instanceId: tenantId,
          details: { periodId, error: toError(error).message },
          severity: 'critical',
          timestamp: new Date(),
        });
        throw error; // Export paie critique → DLQ pour retry
      }
    }), { id: 'payroll-export', priority: 'HIGH' });
  }
}
