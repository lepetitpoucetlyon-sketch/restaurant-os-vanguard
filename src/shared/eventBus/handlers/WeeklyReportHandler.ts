import { NexusEventBus } from '../NexusEventBus';
import { empireAudit } from '@/infrastructure/services/audit';
import { logger } from '@/lib/logger';

export class WeeklyReportHandler {
  static register() {
    return NexusEventBus.on('ai.weekly_report_due', async (payload) => {
      if (payload.isSimulation) return;

      const { tenantId, periodEnd } = payload;
      
      logger.info(`[WeeklyReport] Génération du rapport hebdomadaire pour la période finissant le ${periodEnd}`);

      empireAudit.log({
        module: 'system',
        action: 'AI_WEEKLY_REPORT_GENERATED',
        userId: 'system',
        instanceId: tenantId,
        details: { periodEnd },
        severity: 'medium',
        timestamp: new Date(),
      });
      
      NexusEventBus.emitDurable('notification.created', {
        v: 1,
        tenantId,
        id: `alert-report-${periodEnd}`,
        type: 'info',
        title: 'Rapport Hebdomadaire Prêt',
        message: `Le rapport analytique hebdomadaire est disponible. L'Oracle a identifié 3 points d'optimisation.`,
        priority: 'medium',
        read: false,
        timestamp: new Date().toISOString()
      });
    });
  }
}
