import { NexusEventBus } from '../NexusEventBus';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';

/**
 * DLQQuarantineAlertHandler
 * Écoute `mcc.dlq_quarantine` — émis par le DLQRetryService quand un event
 * atteint MAX_ATTEMPTS et passe en quarantaine définitive.
 *
 * Actions :
 * 1. Log audit CRITICAL
 * 2. Émet `notification.urgent` pour le tableau de bord MCC
 */
export function registerDLQQuarantineAlertHandler() {
  return NexusEventBus.on(
    'mcc.dlq_quarantine',
    async (payload) => {
      const { tenantId, eventName, handlerId, attempts, lastError, quarantinedAt } = payload;

      logger.error(
        `[DLQ-QUARANTINE] ⛔ Event ${eventName}#${handlerId} mis en quarantaine ` +
        `après ${attempts} tentatives. Dernier error: ${lastError}`
      );

      empireAudit.log({
        module: 'system',
        action: 'DLQ_QUARANTINE',
        details: { tenantId, eventName, handlerId, attempts, lastError, quarantinedAt },
        severity: 'critical',
        timestamp: new Date(quarantinedAt),
      });
    },
    { id: 'dlq-quarantine-alert-handler', priority: 'HIGH' }
  );
}
