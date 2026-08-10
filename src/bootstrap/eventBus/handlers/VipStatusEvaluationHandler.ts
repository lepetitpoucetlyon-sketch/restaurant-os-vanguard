import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';

interface CustomerProfile {
  totalVisits?: number;
  tags?: string[];
}

export function registerVipStatusEvaluationHandler() {
  return NexusEventBus.on(
    'order.paid',
    async (payload) => {
      const { tenantId, customerId } = payload;
      if (!customerId) return;

      const profilePath = `tenants/${tenantId}/crms/${customerId}`;
      const profile = await Nexus.adapter.get<CustomerProfile>(profilePath);
      if (!profile) return;

      const visits = (profile.totalVisits ?? 0) + 1;
      let newTag = null;

      if (visits === 5 && !profile.tags?.includes('regular')) {
        newTag = 'regular';
      } else if (visits === 20 && !profile.tags?.includes('vip')) {
        newTag = 'vip';
      }
      
      if (newTag) {
        const tags = Array.from(new Set([...(profile.tags || []), newTag]));
        await Nexus.adapter.update(profilePath, {
          tags,
          updatedAt: new Date().toISOString(),
        });
        
        logger.info(`[CRM] Le client ${customerId} a obtenu le statut ${newTag.toUpperCase()} (${visits} visites)`);
        
        empireAudit.log({
          module: 'crm',
          action: 'CUSTOMER_TAG_ADDED',
          details: { customerId, tag: newTag },
          severity: 'low',
          timestamp: new Date(),
        });
        
        // On pourrait notifier la salle si le client devient VIP pour une attention spéciale
        if (newTag === 'vip') {
          await NexusEventBus.emit('notification.created', {
            v: 1,
            tenantId,
            id: `vip-alert-${customerId}`,
            type: 'info',
            title: 'Nouveau VIP',
            message: `Le client ${customerId} vient d'atteindre le statut VIP ! Pensez à lui offrir une coupe de champagne.`,
            priority: 'high',
            read: false,
            timestamp: new Date().toISOString(),
          });
        }
      }
    },
    { id: 'vip-status-evaluation-handler', priority: 'BACKGROUND' }
  );
}
