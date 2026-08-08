import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';

export interface CustomerReviewInput {
  reviewId: string;
  customerId: string;
  rating: number; // 1 to 5
  feedbackText?: string;
}

export interface ReviewGatekeeperOutput {
  reviewId: string;
  action: 'REDIRECT_GOOGLE_REVIEWS' | 'INTERNAL_MANAGER_ALERT';
  message: string;
}

/**
 * ⭐ ReviewGatekeeperService (Item 6.1)
 * Gatekeeper d'avis clients post-repas.
 * Filtre les avis positifs (4-5★) vers Google Reviews et isole les insatisfactions (<=3★) sous forme de tickets d'intervention manager.
 */
export class ReviewGatekeeperService {
  static processReview(input: CustomerReviewInput): ReviewGatekeeperOutput {
    if (input.rating >= 4) {
      logger.info(`[ReviewGatekeeperService] Avis positif ${input.rating}★ -> Redirection Google Reviews`);
      return {
        reviewId: input.reviewId,
        action: 'REDIRECT_GOOGLE_REVIEWS',
        message: 'Merci ! Votre avis compte énormément. Partagez-le sur Google.',
      };
    }

    logger.warn(`[ReviewGatekeeperService] Avis négatif ${input.rating}★ -> Création ticket réclamation manager`);
    empireAudit.log({
      module: 'crm',
      action: 'NEGATIVE_REVIEW_GATEKEPT',
      details: { reviewId: input.reviewId, rating: input.rating, customerId: input.customerId },
      severity: 'medium',
      timestamp: new Date(),
    });

    return {
      reviewId: input.reviewId,
      action: 'INTERNAL_MANAGER_ALERT',
      message: 'Nous prenons en charge votre remarque immédiatement. Notre direction revient vers vous.',
    };
  }
}
