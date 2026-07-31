import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/infrastructure/services/audit';

export function registerComplianceCalendarHandler(): () => void {
  return NexusEventBus.on(
    'compliance.calendar',
    async (payload) => {
      if (payload.isSimulation) return;

      const urgency = payload.daysUntilDue <= 7 ? 'critical' : payload.daysUntilDue <= 14 ? 'high' : 'medium';

      logger.info(
        `[ComplianceCalendar] ${payload.eventType} "${payload.title}" due in ${payload.daysUntilDue}d for tenant ${payload.tenantId}`
      );

      empireAudit.log({
        module: 'compliance',
        action: 'compliance_calendar_reminder',
        details: {
          eventType: payload.eventType,
          title: payload.title,
          dueDate: payload.dueDate,
          daysUntilDue: payload.daysUntilDue,
        },
        severity: urgency === 'critical' ? 'critical' : 'high',
        timestamp: new Date(),
      });

      const notifId = `cal_${payload.eventType}_${payload.dueDate.replace(/[^0-9]/g, '')}`;
      await Nexus.adapter.update(
        `tenants/${payload.tenantId}/notifications/${notifId}`,
        {
          type: 'compliance_calendar',
          title: payload.title,
          body: `Échéance ${payload.eventType} dans ${payload.daysUntilDue} jour(s) — ${new Date(payload.dueDate).toLocaleDateString('fr-FR')}.`,
          severity: urgency,
          eventType: payload.eventType,
          dueDate: payload.dueDate,
          read: false,
          createdAt: Date.now(),
        }
      );
    },
    { id: 'compliance-calendar-handler', priority: 'HIGH' }
  );
}
