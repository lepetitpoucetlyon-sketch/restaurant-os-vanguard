import { NexusEventBus } from '../NexusEventBus';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { Nexus } from '@/lib/nexus/NexusAdapter';

export class GracePeriodHandler {
  static register() {
    return NexusEventBus.on('tenant.subscription_expired', async (payload) => {
      if (payload.isSimulation) return;
      const { tenantId, expiredAt } = payload;
      logger.warn(`[GracePeriod] Subscription expired for tenant ${tenantId} at ${expiredAt}`);

      // Enforcement of read-only mode in 7 days
      const gracePeriodEnd = new Date(new Date(expiredAt).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      
      await Nexus.adapter.update(`tenants/${tenantId}/billing/status`, {
        status: 'grace_period',
        isReadOnly: true,
        readOnlyEffectiveAt: gracePeriodEnd,
        updatedAt: Date.now()
      });

      empireAudit.log({
        module: 'system',
        action: 'TENANT_SUBSCRIPTION_EXPIRED',
        userId: 'system',
        instanceId: tenantId,
        details: { expiredAt, gracePeriodEnd },
        severity: 'high',
        timestamp: new Date(),
      });

      NexusEventBus.emitDurable('notification.created', {
        v: 1,
        tenantId,
        id: `alert-sub-exp-${tenantId}`,
        type: 'error',
        title: 'Abonnement Expiré',
        message: `Votre abonnement a expiré. Votre espace passera en lecture seule le ${new Date(gracePeriodEnd).toLocaleDateString()}.`,
        priority: 'high',
        read: false,
        timestamp: new Date().toISOString()
      });
    }, { id: 'grace-period', priority: 'HIGH' });
  }
}
