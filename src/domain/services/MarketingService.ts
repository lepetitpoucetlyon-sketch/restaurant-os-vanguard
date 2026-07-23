import { logger } from '@/lib/logger';
import { CustomerFeedback } from '@nexus/contracts';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import type { PromoCodeRecord } from '@/components/crm/PromoCodeManager';

// Re-export the PromoCode shape callers expect (legacy alias for existing consumers)
export type PromoCode = PromoCodeRecord;

/**
 * 📣 MarketingService - Restaurant OS
 * Centralized Domain Logic for Promotions and Reputation.
 * Grade VI: Industrialized Growth Engine.
 * com-1: Promo codes are now stored in Nexus 'promoCodes/' collection.
 */
export class MarketingService {

    /**
     * Dynamic Pricing Factors Registry (Grade X)
     */
    private static dynamicFactors: Record<string, number> = {};

    /**
     * Injects a yield factor for a specific product.
     */
    static updateDynamicPricing(productId: string, factor: number) {
        logger.info(`[MarketingService] Dynamic Pricing Adjustment: ${productId} x${factor}`);
        this.dynamicFactors[productId] = factor;
    }

    /**
     * Retrieves the current yield factor (Default: 1.0)
     */
    static getYieldFactor(productId: string): number {
        return this.dynamicFactors[productId] || 1.0;
    }

    /**
     * Validates a promo code against Nexus 'promoCodes/' collection.
     * com-1: Previously hardcoded; now fully dynamic from Firestore.
     */
    static async validatePromoCode(code: string): Promise<{ success: boolean; promo?: PromoCodeRecord; message?: string }> {
        const normalizedCode = code.toUpperCase();
        try {
            const results = await Nexus.adapter.query<PromoCodeRecord>('promoCodes', {
                where: [{ field: 'code', operator: '==', value: normalizedCode }],
                limit: 1,
            });
            const promo = results[0];
            if (!promo || !promo.isActive) {
                return { success: false, message: 'Code invalide ou inactif' };
            }
            if (new Date(promo.expiresAt) < new Date()) {
                return { success: false, message: 'Code expiré' };
            }
            if (promo.maxUses > 0 && promo.currentUses >= promo.maxUses) {
                return { success: false, message: 'Quota d\'utilisation atteint' };
            }
            logger.debug(`[MarketingService] Promo Code Validated from Nexus: ${normalizedCode}`);
            return { success: true, promo };
        } catch (err) {
            logger.error('[MarketingService] Failed to validate promo code from Nexus', { code, err });
            return { success: false, message: 'Erreur de validation' };
        }
    }

    /**
     * Increments usage counter for a promo code after successful application.
     */
    static async recordPromoUsage(promoId: string): Promise<void> {
        try {
            await Nexus.adapter.increment(`promoCodes/${promoId}`, 'currentUses', 1);
        } catch (err) {
            logger.error('[MarketingService] Failed to increment promo usage', { promoId, err });
        }
    }

    /**
     * Logic for calculating reputation score based on feedback.
     */
    static calculateReputationScore(feedbacks: CustomerFeedback[]): number {
        if (feedbacks.length === 0) return 100;
        const total = feedbacks.reduce((acc, f) => acc + (f.rating || 0), 0);
        return Math.round((total / (feedbacks.length * 5)) * 100);
    }
}
