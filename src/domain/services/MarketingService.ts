import { logger } from '@/lib/logger';
import { PromoCode, CustomerFeedback } from '@/types/marketing.types';

/**
 * 📣 MarketingService - Restaurant OS
 * Centralized Domain Logic for Promotions and Reputation.
 * Grade VI: Industrialized Growth Engine.
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
     * Validates a promo code and returns the discount details.
     */
    static validatePromoCode(code: string): { success: boolean; promo?: PromoCode; message?: string } {
        const normalizedCode = code.toUpperCase();
        const promo = this.PROMO_REGISTRY[normalizedCode];

        if (!promo) {
            return { success: false, message: 'Code invalide ou expiré' };
        }

        logger.debug(`[MarketingService] Promo Code Validated: ${normalizedCode}`);

        return {
            success: true,
            promo: {
                ...promo,
                id: `promo_${normalizedCode}`,
                code: normalizedCode,
                currentUsage: 0,
                isActive: true,
                startDate: new Date().toISOString(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            } as PromoCode
        };
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
