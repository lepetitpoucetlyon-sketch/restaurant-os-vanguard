import { NexusEventBus } from '../NexusEventBus';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/infrastructure/services/audit';

/**
 * NonConformActionHandler (P03-F)
 * Réagit à 'haccp.nonconform' (Non-conformité détectée)
 * et alerte le manager pour une action corrective.
 */
export function registerNonConformActionHandler(): () => void {
  return NexusEventBus.on(
    'haccp.nonconform',
    async (payload) => {
      logger.warn(`[NonConformAction] Action corrective requise pour le tenant ${payload.tenantId} (Check: ${payload.checkId})`);

      // TODO: Logique pour notifier (Push/Email)
      empireAudit.log({
        module: 'compliance',
        action: 'nonconformity_alert',
        details: {
          checkId: payload.checkId,
          correctionDeadline: payload.correctionDeadline,
        },
        severity: 'high',
        timestamp: new Date(),
      });
    },
    { id: 'nonconform-action-handler', priority: 'HIGH' }
  );
}
