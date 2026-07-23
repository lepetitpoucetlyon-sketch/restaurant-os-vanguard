import { atom } from 'jotai';
import { posCartTotalSelector } from "@modules/ops";
import { qualityGlobalMetricsSelector } from "@modules/compliance";

/**
 * 👻 GHOST FINANCE SELECTORS - Grade VI
 * Advanced financial intelligence combining POS, Stock, and Quality.
 */

/**
 * 📊 Net Margin Selector
 * Calculates the real margin by subtracting HACCP rejections and Stock losses from Gross Turnover.
 */
export const financeNetMarginSelector = atom((get) => {
    const grossTurnover = get(posCartTotalSelector); // In cents
    const qualityMetrics = get(qualityGlobalMetricsSelector);
    
    // Industrial Assumption: Each % of rejection rate impacts margin by 1.2%
    // based on waste management costs and re-ordering overhead.
    const rejectionImpact = qualityMetrics.monthlyRejectionRate * 0.012;
    
    // Theoretical Margin (Industry standard: 70% for food)
    const theoreticalMargin = 0.70;
    
    // Real Net Margin
    const netMarginPercentage = theoreticalMargin - rejectionImpact;
    const netMarginAmount = Math.round(grossTurnover * netMarginPercentage);
    
    return {
        grossTurnover,
        netMarginPercentage: Number((netMarginPercentage * 100).toFixed(2)),
        netMarginAmount,
        lossImpact: Number((rejectionImpact * 100).toFixed(2)),
        grade: netMarginPercentage > 0.65 ? 'VI' : 'V'
    };
});

/**
 * ⚡ Velocity Score
 * Measure of operational speed vs data integrity.
 */
export const operationalVelocitySelector = atom((get) => {
    const compliance = get(qualityGlobalMetricsSelector).complianceScore;
    // In a real scenario, we'd measure response times too.
    return {
        score: compliance,
        status: compliance > 95 ? 'CRUISE_SPEED' : 'OVERLOAD',
        label: 'AESTHETIC_INTEL'
    };
});
