import { NexusEventBus } from '../NexusEventBus';
import { empireAudit } from '@/lib/audit';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { PrepaieBuilder } from '@/modules/human';
import { browserPush } from '@/lib/push/browserPush';
import { toError } from "@/lib/toError";

export class PayrollAutoCalcHandler {
  static register() {
    return NexusEventBus.on('payroll.submitted', async (payload) => {
      if (payload.isSimulation) return;
      const { tenantId, period, submissionId, employeeCount } = payload;
      logger.info(
        `[PayrollAutoCalcHandler] Calcul pré-paie déclenché pour ${period} (${employeeCount} employés, tenant: ${tenantId})`
      );

      try {
        // Construire le récapitulatif pré-paie via PrepaieBuilder
        const summary = await PrepaieBuilder.build(tenantId, period);

        // Persister le résultat dans le chemin tenant-scoped
        const periodId = period.replace('-', '');
        await Nexus.adapter.set(
          `tenants/${tenantId}/hr/payroll/${periodId}`,
          {
            ...summary,
            submissionId,
            status: 'calculated',
            calculatedAt: Date.now(),
          }
        );

        logger.info(
          `[PayrollAutoCalcHandler] Pré-paie calculée: ${summary.rows.length} lignes, brut total ${summary.totalBrut}€`
        );

        // Notifier le directeur que la pré-paie est prête
        await browserPush.sendToRole(tenantId, 'directeur', {
          title: 'Pré-paie calculée',
          body: `La pré-paie ${period} est prête : ${summary.rows.length} salariés, brut total ${summary.totalBrut.toFixed(2)}€.`,
        });

        NexusEventBus.emitDurable('notification.created', {
          v: 1,
          tenantId,
          id: `payroll-calc-${periodId}-${Date.now()}`,
          type: 'info',
          title: 'Pré-paie calculée',
          message: `Le calcul pré-paie pour la période ${period} est terminé. ${summary.rows.length} salariés traités, brut total ${summary.totalBrut.toFixed(2)}€.`,
          priority: 'medium',
          read: false,
          timestamp: new Date().toISOString(),
        });

        empireAudit.log({
          action: 'hr.payroll_auto_calc_completed',
          module: 'human',
          userId: 'system',
          instanceId: tenantId,
          details: {
            period,
            submissionId,
            employeeCount: summary.rows.length,
            totalBrutEur: summary.totalBrut,
            totalHeures: summary.totalHeures,
          },
          severity: 'high',
          timestamp: new Date(),
        });
      } catch (error) {
        logger.error(
          `[PayrollAutoCalcHandler] Erreur calcul pré-paie ${period}:`,
          toError(error).message
        );

        empireAudit.log({
          action: 'hr.payroll_auto_calc_failed',
          module: 'human',
          userId: 'system',
          instanceId: tenantId,
          details: {
            period,
            submissionId,
            error: toError(error).message,
          },
          severity: 'critical',
          timestamp: new Date(),
        });
      }
    }, { id: 'payroll-auto-calc', priority: 'HIGH' });
  }
}
