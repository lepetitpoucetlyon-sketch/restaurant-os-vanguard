import { NexusEventBus } from '../NexusEventBus';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { toError } from "@/lib/toError";

export class PromotionPriceHandler {
  static register() {
    return NexusEventBus.on('commerce.promotion_activated', async (payload) => {
      if (payload.isSimulation) return;

      const { tenantId, promotionId, discountBps, productIds } = payload;
      
      logger.info(`[PromotionPrice] Promotion ${promotionId} activée (-${discountBps/100}%). Sync POS...`);

      try {
        // Enregistrement de la promotion active dans le registre POS
        await Nexus.adapter.update(`tenants/${tenantId}/pos/activePromotions/${promotionId}`, {
            discountBps,
            productIds,
            status: 'active',
            activatedAt: Date.now()
        });

        // Appliquer optionnellement un flag sur les produits du menu
        if (productIds && productIds.length > 0) {
            for (const productId of productIds) {
                // Utilisation de try/catch individuels pour continuer même si un produit manque
                try {
                    await Nexus.adapter.update(`tenants/${tenantId}/menu/items/${productId}`, {
                        activePromotionId: promotionId,
                        promotionDiscountBps: discountBps,
                        updatedAt: Date.now()
                    });
                } catch (e) {
                    logger.warn(`[PromotionPrice] Impossible d'appliquer la promotion au produit ${productId}`, toError(e).message);
                }
            }
        }

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
      } catch (err) {
        logger.error('[PromotionPriceHandler] Error activating promotion', toError(err).message);
      }
    }, { id: 'promotion-price', priority: 'HIGH' });
  }
}
