import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';

export function registerCustomerProfileInitHandler() {
  return NexusEventBus.on(
    'crm.customer_created',
    async (payload) => {
      const { tenantId, customerId } = payload;
      
      logger.info(`[CRM] Initialisation du profil fidélité pour le nouveau client ${customerId}`);
      
      const profilePath = `tenants/${tenantId}/crms/${customerId}`;
      const existingProfile = await Nexus.adapter.get(profilePath);
      
      if (!existingProfile) {
        await Nexus.adapter.set(profilePath, {
          id: customerId,
          loyaltyPoints: 0,
          totalVisits: 0,
          totalSpentInMicrounits: 0,
          tags: ['new_customer'],
          rewards: [],
          noShowCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        
        empireAudit.log({
          module: 'crm',
          action: 'CUSTOMER_PROFILE_INITIALIZED',
          details: { customerId },
          severity: 'low',
          timestamp: new Date(),
        });
      }
    },
    { id: 'customer-profile-init-handler', priority: 'BACKGROUND' }
  );
}
