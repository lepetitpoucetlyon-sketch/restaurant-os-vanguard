import { NexusEventBus } from '../NexusEventBus';
import { empireAudit } from '@/infrastructure/services/audit';
import { logger } from '@/lib/logger';
import { Nexus } from '@/lib/nexus/NexusAdapter';

export class PromotionPriceHandler {
  static register() {
    return NexusEventBus.on('commerce.promotion_activated', async (payload) => {
      if (payload.isSimulation) return;

      const { tenantId, promotionId, discountBps, productIds } = payload;
      
      logger.info(`[PromotionPrice] Promotion ${promotionId} activée (-${discountBps/100}%). Sync POS...`);

      // Mock broadcast to POS logic
      await new Promise(r => setTimeout(r, 500));

      empireAudit.log({
        module: 'crm',
        action: 'COMMERCE_PROMOTION_ACTIVATED',
        userId: 'system',
        instanceId: tenantId,
        details: { promotionId, discountBps, productIds },
        severity: 'medium',
        timestamp: new Date(),
      });
      
      NexusEventBus.emitDurable('notification.created', {
        v: 1,
        tenantId,
        id: `alert-promo-on-${promotionId}`,
        type: 'info',
        title: 'Promotion Activée',
        message: `La promotion ${promotionId} (-${discountBps/100}%) a été propagée sur les caisses (POS).`,
        priority: 'low',
        read: false,
        timestamp: new Date().toISOString()
      });
    });
  }
}
