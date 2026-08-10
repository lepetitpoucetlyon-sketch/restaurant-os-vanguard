import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';

export function registerMarketingCampaignRouterHandler() {
  return NexusEventBus.on(
    'marketing.campaign_launched',
    async (payload) => {
      const { tenantId: _tenantId, campaignId, targetSegment, launchedBy } = payload;
      
      logger.info(`[MarketingCampaign] Campagne ${campaignId} lancée par ${launchedBy} pour le segment [${targetSegment}].`);

      // En réalité: 
      // 1. Query Firebase pour trouver tous les clients où `segment === targetSegment` et `optOut !== true`
      // 2. Transmettre la liste d'audience au PushService (SendGrid/Twilio)
      
      empireAudit.log({
        module: 'crm',
        action: 'CAMPAIGN_DISPATCHED',
        details: { campaignId, targetSegment },
        severity: 'medium', // Impact sur la réputation du restau (spam)
        timestamp: new Date(),
      });
    },
    { id: 'marketing-campaign-router', priority: 'BACKGROUND' }
  );
}
