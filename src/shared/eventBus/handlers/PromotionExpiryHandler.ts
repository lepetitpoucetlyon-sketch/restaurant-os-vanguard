import { NexusEventBus } from '../NexusEventBus';
import { empireAudit } from '@/infrastructure/services/audit';
import { logger } from '@/lib/logger';

export class PromotionExpiryHandler {
  static register() {
    return NexusEventBus.on('commerce.promotion_expired', async (payload) => {
      if (payload.isSimulation) return;

      const { tenantId, promotionId } = payload;
      
      logger.info(`[PromotionExpiry] Promotion ${promotionId} expirée. Rétablissement des prix initiaux.`);

      empireAudit.log({
        module: 'crm',
        action: 'COMMERCE_PROMOTION_EXPIRED',
        userId: 'system',
        instanceId: tenantId,
        details: { promotionId },
        severity: 'medium',
        timestamp: new Date(),
      });
      
      NexusEventBus.emitDurable('notification.created', {
        v: 1,
        tenantId,
        id: `alert-promo-off-${promotionId}`,
        type: 'info',
        title: 'Promotion Terminée',
        message: `La promotion ${promotionId} est terminée. Les prix normaux ont été rétablis.`,
        priority: 'low',
        read: false,
        timestamp: new Date().toISOString()
      });
    });
  }
}
