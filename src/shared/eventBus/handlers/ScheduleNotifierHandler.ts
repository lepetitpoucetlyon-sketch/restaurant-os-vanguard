import { NexusEventBus } from '../NexusEventBus';
import { empireAudit } from '@/infrastructure/services/audit';
import { logger } from '@/lib/logger';

export function registerScheduleNotifierHandler() {
  return NexusEventBus.on(
    'hr.schedule_published',
    async (payload) => {
      const { tenantId, weekStart, publishedBy } = payload;
      
      const weekDate = new Date(weekStart).toLocaleDateString();
      logger.info(`[ScheduleNotifier] Planning publié pour la semaine du ${weekDate}. Envoi des notifications à la brigade.`);

      // En réalité: Itérer sur les shifts de la semaine, identifier les employés, et appeler le PushService / Twilio.

      empireAudit.log({
        module: 'human',
        action: 'SCHEDULE_NOTIFIED',
        details: { weekStart, publishedBy },
        severity: 'low',
        timestamp: new Date(),
      });
    },
    { id: 'schedule-notifier', priority: 'BACKGROUND' }
  );
}
