import { EmpireInstance } from '@domain/types/empire';
import { logger } from '@/lib/axiom';
import { PRICING, getPriceEur } from '@/shared/constants/pricing';

export interface TreasuryReport {
    totalMRR: number;
    totalAICosts: number;
    collectiveSavings: number;
    netMargin: number;
    fleetTierStats: {
        STANDARD: number;
        PREMIUM: number;
        ENTERPRISE: number;
    };
}

const _AI_TOKEN_COST_MODEL = 0.00002; // € per generated token equivalent

/**
 * 💰 TREASURY ENGINE (Empire Grade)
 * Central authority for fleet financial orchestration.
 */
export class TreasuryEngine {

    /**
     * Consolidates financial data for the entire fleet
     */
    static generateFleetReport(instances: EmpireInstance[]): TreasuryReport {
        logger.info('TREASURY: Consolidating fleet financial health');

        let totalMRR = 0;
        let totalAICosts = 0;
        const tierStats = { STANDARD: 0, PREMIUM: 0, ENTERPRISE: 0 };

        instances.forEach(instance => {
            // MRR Calculation — use centralized pricing
            const tier = (instance?.tier || 'STANDARD') as keyof typeof PRICING;
            const validTier = tier in PRICING ? tier : 'STANDARD';
            const price = getPriceEur(validTier);
            totalMRR += price;

            // Tier distribution tracking
            if (validTier in tierStats) {
                tierStats[validTier as keyof typeof tierStats]++;
            }

            // AI Consumption Metering (Simulated from instance metrics)
            const activeUsers = instance?.metrics?.activeUsers ?? 0;
            totalAICosts += (activeUsers * 2.5); // Simplified usage model: 2.5€ per active user in AI overhead
        });

        // Coalition Logic: The larger the fleet, the higher the collective bargaining power
        // We simulate a 0.5% discount per 100 instances, capped at 25%
        const discountRate = Math.min(0.25, (instances.length / 100) * 0.005);
        const baselineProcurementCost = totalMRR * 0.45; // Infrastructure/Operations estimate
        const collectiveSavings = baselineProcurementCost * discountRate;

        return {
            totalMRR,
            totalAICosts,
            collectiveSavings,
            netMargin: totalMRR - (baselineProcurementCost - collectiveSavings) - totalAICosts,
            fleetTierStats: tierStats
        };
    }

    /**
     * Logic for inter-site stock value transfer
     */
    static calculateTransferValue(quantity: number, unitPrice: number): number {
        // Apply inter-empire "zero-fee" logic, just calculate technical value
        return quantity * unitPrice;
    }
}
