import { EmpireInstance } from '@/shared/types/empire';
import { logger } from '@/lib/axiom';
import { PRICING, getPriceEur } from '@/lib/constants/pricing';

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

// ─── Financial model parameters ──────────────────────────────────────────────
// These are rough estimates used for the theoretical P&L until real cost data
// (cloud invoices, payroll exports) is connected. Update when real data is available.

/** Estimated AI infrastructure cost per active user per month, in euros */
const AI_COST_PER_USER_EUR = 3.0;

/** Estimated operational infrastructure cost as a fraction of MRR */
const INFRA_COST_RATIO = 0.40;

/** Coalition discount: rate per 100 instances */
const COALITION_DISCOUNT_PER_100 = 0.003;

/** Coalition discount cap */
const COALITION_DISCOUNT_CAP = 0.20;
// ─────────────────────────────────────────────────────────────────────────────

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

            // AI cost estimate from active user count
            const activeUsers = instance?.metrics?.activeUsers ?? 0;
            totalAICosts += activeUsers * AI_COST_PER_USER_EUR;
        });

        // Coalition discount grows with fleet size
        const discountRate = Math.min(COALITION_DISCOUNT_CAP, (instances.length / 100) * COALITION_DISCOUNT_PER_100);
        const baselineProcurementCost = totalMRR * INFRA_COST_RATIO;
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
