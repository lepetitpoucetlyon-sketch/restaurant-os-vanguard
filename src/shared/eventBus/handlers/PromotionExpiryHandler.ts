import { NexusEventBus } from '../NexusEventBus';
import { empireAudit } from '@/infrastructure/services/audit';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

export class PromotionExpiryHandler {
  static register() {
    return NexusEventBus.on('commerce.promotion_expired', async (payload) => {
      if (payload.isSimulation) return;

      const { tenantId, promotionId } = payload;
      
      logger.info(`[PromotionExpiry] Promotion ${promotionId} expirée. Rétablissement des prix initiaux.`);

      try {
        const promoDoc = await Nexus.adapter.get<{ productIds?: string[] }>(`tenants/${tenantId}/pos/activePromotions/${promotionId}`);
        const productIds = promoDoc?.productIds || [];

        await Nexus.adapter.update(`tenants/${tenantId}/pos/activePromotions/${promotionId}`, {
            status: 'expired',
            expiredAt: Date.now()
        });

        // Rollback des produits impactés dans le POS/Menu
        for (const productId of productIds) {
            try {
                await Nexus.adapter.update(`tenants/${tenantId}/menu/items/${productId}`, {
                    activePromotionId: null, // Rétablissement des prix normaux
                    updatedAt: Date.now()
                });
            } catch (e) {
                logger.warn(`[PromotionExpiry] Impossible de rollback la promo sur le produit ${productId}`, String(e));
            }
        }

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
      } catch (err) {
        logger.error('[PromotionExpiryHandler] Error expiring promotion', String(err));
      }
    }, { id: 'promotion-expiry', priority: 'HIGH' });
  }
}
