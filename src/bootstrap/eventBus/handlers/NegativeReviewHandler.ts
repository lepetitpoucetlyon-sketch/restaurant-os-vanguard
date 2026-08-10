import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { browserPush } from '@/lib/push/browserPush';
import { logger } from '@/lib/logger';

/**
 * NegativeReviewHandler (P06-F)
 * Écoute review.negative et :
 * 1. Notifie le manager par WebPush
 * 2. Crée une alerte dans reviews/alerts
 * 3. Crée un draft de réponse dans reviews/drafts
 */
export function registerNegativeReviewHandler(): () => void {
  return NexusEventBus.on(
    'review.negative',
    async (payload) => {
      const { tenantId, reviewId, rating, platform, content } = payload;

      const now = new Date().toISOString();

      // 1. WebPush manager
      await browserPush.sendToRole(tenantId, 'manager', {
        title: `Avis négatif ${rating}★ — ${platform}`,
        body: content.substring(0, 100),
      });

      logger.info(`[NegativeReview] Alerte WebPush envoyée aux managers pour avis ${reviewId} (${rating}★ sur ${platform})`);

      // 2. Alerte dans reviews/alerts
      await Nexus.adapter.set(`tenants/${tenantId}/reviews/alerts/ALERT-${reviewId}`, {
        reviewId,
        rating,
        platform,
        content,
        status: 'pending_response',
        createdAt: now,
      });

      // 3. Draft de réponse IA
      await Nexus.adapter.set(`tenants/${tenantId}/reviews/drafts/DRAFT-${reviewId}`, {
        reviewId,
        draft: `Nous sommes désolés de lire votre expérience. Nous vous invitons à nous contacter pour...`,
        status: 'ai_draft',
        createdAt: now,
      });

      // 4. Audit
      empireAudit.log({
        module: 'crm',
        action: 'NEGATIVE_REVIEW_ALERTED',
        details: { reviewId, rating, platform },
        severity: 'medium',
        timestamp: new Date(),
      });
    },
    { id: 'negative-review', priority: 'BACKGROUND' }
  );
}
