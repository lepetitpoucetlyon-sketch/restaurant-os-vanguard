import { NexusEventBus } from '../NexusEventBus';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/infrastructure/services/audit';

export function registerBirthdayCampaignHandler() {
  return NexusEventBus.on(
    'crm.birthday_approaching',
    async (payload) => {
      const { tenantId, customerId } = payload;
      
      logger.info(`[CRM] Préparation de la campagne Anniversaire pour le client ${customerId}`);
      
      // Simulation d'envoi d'email ou de SMS via un système tiers
      // await MarketingService.sendBirthdayOffer(tenantId, customerId);
      
      empireAudit.log({
        module: 'crm',
        action: 'BIRTHDAY_CAMPAIGN_SENT',
        details: { customerId },
        severity: 'low',
        timestamp: new Date(),
      });
      
      // On trace l'envoi de la campagne
      await NexusEventBus.emit('marketing.campaign_launched', {
        v: 1,
        tenantId,
        campaignId: `birthday-${customerId}`,
        targetSegment: 'birthday',
        launchedBy: 'system',
      });
    },
    { id: 'birthday-campaign-handler', priority: 'BACKGROUND' }
  );
}
