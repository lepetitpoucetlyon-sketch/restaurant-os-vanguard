import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@orchestration/NexusEventBus';
import { logger } from '@/lib/logger';
import { toError } from "@/lib/toError";

interface ActivePromotionRecord {
  id: string;
  endDate?: string; // YYYY-MM-DD
  status?: string;
}

/**
 * PromotionExpiryJob (P1-3.5)
 * Se déclenche quotidiennement à 00h01.
 * Identifie les promotions dont la date de fin est dépassée et émet `commerce.promotion_expired`.
 */
export const PromotionExpiryJob = {
  name: 'PromotionExpiryJob',
  schedule: '1 0 * * *', // 00h01 chaque jour
  async runForTenant(tenantId: string): Promise<void> {
    try {
      const promotions = await Nexus.adapter.query<ActivePromotionRecord>(`tenants/${tenantId}/pos/activePromotions`);
      const todayStr = new Date().toISOString().split('T')[0];

      for (const promo of promotions) {
        if (promo.status === 'active' && promo.endDate && promo.endDate < todayStr) {
          logger.info(`[PromotionExpiryJob] Promotion ${promo.id} expirée (End Date: ${promo.endDate}). Émission commerce.promotion_expired.`);

          await NexusEventBus.emitDurable('commerce.promotion_expired', {
            v: 1,
            tenantId,
            promotionId: promo.id,
          });
        }
      }
    } catch (err) {
      logger.error(`[PromotionExpiryJob] Échec du scan promotions pour tenant ${tenantId}`, toError(err).message);
    }
  },
};
