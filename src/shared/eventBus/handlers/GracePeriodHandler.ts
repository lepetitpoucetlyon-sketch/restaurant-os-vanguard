import { NexusEventBus } from '../NexusEventBus';
import { empireAudit } from '@/infrastructure/services/audit';
import { logger } from '@/lib/logger';

export class GracePeriodHandler {
  static register() {
    return NexusEventBus.on('tenant.subscription_expired', async (payload) => {
      if (payload.isSimulation) return;
      const { tenantId, expiredAt } = payload;
      logger.warn(`[GracePeriod] Subscription expired for tenant ${tenantId} at ${expiredAt}`);

      empireAudit.log({
        module: 'system',
        action: 'TENANT_SUBSCRIPTION_EXPIRED',
        userId: 'system',
        instanceId: tenantId,
        details: { expiredAt },
        severity: 'high',
        timestamp: new Date(),
      });

      NexusEventBus.emitDurable('notification.created', {
        v: 1,
        tenantId,
        id: `alert-sub-exp-${tenantId}`,
        type: 'error',
        title: 'Abonnement Expiré',
        message: `Votre abonnement a expiré. Votre espace passera en lecture seule dans 7 jours.`,
        priority: 'high',
        read: false,
        timestamp: new Date().toISOString()
      });
    });
  }
}
