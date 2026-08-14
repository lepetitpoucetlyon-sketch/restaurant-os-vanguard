import { NexusEventBus } from '../NexusEventBus';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';

export function registerComplianceDeadlineHandler(): () => void {
  return NexusEventBus.on(
    'compliance.deadline_approaching',
    async (payload) => {
      const { tenantId, type, daysLeft } = payload;
      logger.warn(`[ComplianceDeadline] Échéance ${type} dans ${daysLeft} jour(s)`);

      const isCritical = daysLeft <= 1;

      await NexusEventBus.emit('notification.urgent', {
        v: 1,
        tenantId,
        message: isCritical
          ? `URGENT : Échéance de conformité "${type}" DEMAIN. Action immédiate requise.`
          : `Rappel : Échéance de conformité "${type}" dans ${daysLeft} jour(s).`,
        roles: ['proprietaire', 'manager'],
        priority: isCritical ? 'CRITICAL' : 'HIGH',
      });

      empireAudit.log({
        module: 'compliance',
        action: 'COMPLIANCE_DEADLINE_NOTIFIED',
        details: { type, daysLeft },
        severity: isCritical ? 'critical' : 'high',
        timestamp: new Date(),
      });
    },
    { id: 'compliance-deadline-handler', priority: 'HIGH' }
  );
}
