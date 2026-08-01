import { Quote } from '@nexus/contracts';

/**
 * Quotes Business Logic Service - Predictive Intelligence Layer
 */
export const QuotesService = {
    /**
     * Calculates dashboard stats from a list of quotes.
     */
    calculateStats: (quotes: Quote[]) => {
        const thisMonth = quotes.filter(q => {
            const date = new Date(q.createdAt ?? 0);
            const now = new Date();
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        });

        const pending = quotes.filter(q => ['draft', 'sent', 'viewed'].includes(q.status));
        const accepted = quotes.filter(q => q.status === 'accepted' || q.status === 'converted');
        
        const totalValueInMicrounits = accepted.reduce((sum, q) => sum + q.totals.totalTTCInMicrounits, 0);
        const pendingValueInMicrounits = pending.reduce((sum, q) => sum + q.totals.totalTTCInMicrounits, 0);

        const conversionRate = quotes.filter(q => q.status !== 'draft').length > 0
            ? (accepted.length / quotes.filter(q => q.status !== 'draft').length * 100).toFixed(0)
            : '0';

        return {
            thisMonthCount: thisMonth.length,
            pendingCount: pending.length,
            acceptedCapitalTTCInMicrounits: totalValueInMicrounits,
            pendingCapitalTTCInMicrounits: pendingValueInMicrounits,
            conversionRate: parseInt(conversionRate)
        };
    },

    /**
     * SIGNATURE PROBABILITY (AI-Ready Simulation)
     * Predicts the likelihood of a quote being signed based on parameters and macroeconomic context.
     */
    predictSignatureChance: (quote: Quote, inflationRate: number = 0): number => {
        let score = 70; // Base score

        // Impact de l'inflation
        // Une inflation forte (> 5%) réduit la propension à signer des gros devis
        if (inflationRate > 5) {
            score -= (inflationRate - 5) * 2;
        }

        // 1. Discount Factor (more discount, more chance)
        const totalHT = quote.totals.totalHTInMicrounits || 0;
        const totalDiscount = quote.totals.totalDiscountInMicrounits || 0;
        const discountPercent = (totalDiscount / (totalHT + totalDiscount)) * 100;
        score += discountPercent * 1.5;

        // 2. Amount Factor (larger amounts are harder to sign)
        // Thresholds: 10_000_000_000 µ = 10 000€ ; 5_000_000_000 µ = 5 000€
        if (quote.totals.totalTTCInMicrounits > 10_000_000_000) score -= 15;
        else if (quote.totals.totalTTCInMicrounits > 5_000_000_000) score -= 5;

        // 3. Status Bonus
        if (quote.status === 'viewed') score += 10;
        
        // 4. Client Type
        if (quote.customer?.type === 'company') score += 5;

        return Math.min(Math.max(score, 5), 99);
    }
};
