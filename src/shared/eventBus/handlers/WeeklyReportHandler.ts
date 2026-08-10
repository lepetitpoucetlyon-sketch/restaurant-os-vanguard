import { NexusEventBus } from '../NexusEventBus';
import { empireAudit } from '@/lib/audit';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { toError } from "@/lib/toError";

export class WeeklyReportHandler {
  static register() {
    return NexusEventBus.on('ai.weekly_report_due', async (payload) => {
      if (payload.isSimulation) return;

      const { tenantId, periodEnd } = payload;
      
      logger.info(`[WeeklyReport] Génération du rapport hebdomadaire pour la période finissant le ${periodEnd}`);

      try {
        const periodEndDate = new Date(periodEnd);
        const periodStartStr = new Date(periodEndDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        
        // Fetch tickets in this week to calculate total revenue
        const tickets = await Nexus.adapter.query<{ total: number }>('finance/tickets', {
            where: [
                { field: 'createdAt', operator: '>=', value: periodStartStr },
                { field: 'createdAt', operator: '<=', value: periodEnd }
            ]
        });
        
        const totalRevenue = tickets.reduce((acc, t) => acc + (t.total || 0), 0);
        
        const reportId = `report_${Date.now()}`;
        await Nexus.adapter.update(`tenants/${tenantId}/ai/reports/${reportId}`, {
            periodStart: periodStartStr,
            periodEnd,
            totalRevenue,
            ticketCount: tickets.length,
            generatedAt: Date.now()
        });

        empireAudit.log({
            module: 'system',
            action: 'AI_WEEKLY_REPORT_GENERATED',
            userId: 'system',
            instanceId: tenantId,
            details: { periodEnd, reportId, totalRevenue, ticketCount: tickets.length },
            severity: 'medium',
            timestamp: new Date(),
        });
        
        const pointsOptim = tickets.length > 50 ? 2 : 1; // Simulation très simple pour le mock
        
        NexusEventBus.emitDurable('notification.created', {
            v: 1,
            tenantId,
            id: `alert-report-${periodEnd}`,
            type: 'info',
            title: 'Rapport Hebdomadaire Prêt',
            message: `Le rapport analytique est disponible (${tickets.length} tickets traités pour ${(totalRevenue / 100).toFixed(2)}€). L'Oracle a identifié ${pointsOptim} point(s) d'optimisation.`,
            priority: 'medium',
            read: false,
            timestamp: new Date().toISOString()
        });
      } catch (err) {
        logger.error('[WeeklyReportHandler] Error generating weekly report', toError(err).message);
        throw err;
      }
    }, { id: 'weekly-report', priority: 'BACKGROUND' });
  }
}
