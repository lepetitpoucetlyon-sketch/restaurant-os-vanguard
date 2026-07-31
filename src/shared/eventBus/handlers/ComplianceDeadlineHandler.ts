import { NexusEventBus } from '../NexusEventBus';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/infrastructure/services/audit';

/**
 * ComplianceDeadlineHandler (P03-K)
 * Réagit aux alertes d'échéance de conformité (par ex: nettoyage, inspection)
 * et notifie le dashboard/manager.
 */
export function registerComplianceDeadlineHandler(): () => void {
  return NexusEventBus.on(
    'compliance.deadline_approaching',
    async (payload) => {
      logger.warn(`[ComplianceDeadline] Alerte pour le tenant ${payload.tenantId}: ${payload.type} (J-${payload.daysLeft})`);

      // TODO: Logique pour notifier le dashboard ou envoyer un email au manager
      empireAudit.log({
        module: 'compliance',
        action: 'compliance_deadline_alert',
        details: {
          type: payload.type,
          daysLeft: payload.daysLeft,
        },
        severity: payload.daysLeft <= 1 ? 'critical' : 'high',
        timestamp: new Date(),
      });
    },
    { id: 'compliance-deadline-handler', priority: 'HIGH' }
  );
}
