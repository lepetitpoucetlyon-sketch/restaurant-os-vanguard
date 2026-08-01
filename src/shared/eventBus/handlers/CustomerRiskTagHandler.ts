import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/infrastructure/services/audit';

export function registerCustomerRiskTagHandler() {
  return NexusEventBus.on(
    'reservation.no_show',
    async (payload) => {
      const { tenantId, reservationId, customerId } = payload;
      if (!customerId) return;

      const profilePath = `tenants/${tenantId}/crms/${customerId}`;
      const profile = await Nexus.adapter.get(profilePath) as any;
      if (!profile) return;

      const noShowCount = ((profile.noShowCount as number) || 0) + 1;
      let tags: string[] = (profile.tags as string[]) || [];
      
      // Si 2 No-Shows ou plus, on applique le tag "risk"
      if (noShowCount >= 2 && !(tags as string[]).includes('risk')) {
        tags = [...tags, 'risk'];
        logger.warn(`[CRM] Le client ${customerId} a été taggé RISK suite à ${noShowCount} No-Shows.`);
        
        empireAudit.log({
          module: 'crm',
          action: 'CUSTOMER_TAG_ADDED',
          details: { customerId, tag: 'risk', reason: 'Repeated No-Show', reservationId },
          severity: 'medium',
          timestamp: new Date(),
        });
      }
      
      await Nexus.adapter.update(profilePath, {
        noShowCount,
        tags,
        updatedAt: new Date().toISOString(),
      });
    },
    { id: 'customer-risk-tag-handler', priority: 'BACKGROUND' }
  );
}
