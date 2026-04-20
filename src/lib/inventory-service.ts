// @ts-nocheck
import { StockItem } from "@/types";

/**
 * Inventory Business Logic Service - The "Stock Intelligence" Layer
 */
export const InventoryService = {
    /**
     * Calculates the total value of the current stock (HT).
     * @param items - List of available stock items
     * @returns Total valuation in cents
     */
    calculateStockValuation: (items: StockItem[]): number => {
        return items.reduce((acc, item) => {
            // Only count items with a valid unit cost and quantity
            if (item.unitCostInCents && item.quantity > 0) {
                return acc + Math.round(item.unitCostInCents * item.quantity);
            }
            return acc;
        }, 0);
    },

    /**
     * Estimates the impact of inflation on the next replenishment.
     * @param currentValuationInCents - Total value of stock in cents
     * @param inflationRate - Global inflation rate (0-20)
     * @returns Added cost for restocking in cents
     */
    getReplacementCostImpact: (currentValuationInCents: number, inflationRate: number): number => {
        if (currentValuationInCents === 0 || inflationRate === 0) return 0;
        
        // Multiplier to reflect real-world volatility (suppliers often raise more than CPI)
        const volatilityFactor = 1.25;
        return Math.round(currentValuationInCents * (inflationRate / 100) * volatilityFactor);
    },

    /**
     * Analyzes stock categories for high-risk items (perishables with high value).
     */
    getRiskAnalysis: (items: StockItem[]) => {
        const highValueRisk = items.filter(item => {
            const valInCents = (item.unitCostInCents || 0) * item.quantity;
            return valInCents > 50000; // 500.00€ threshold
        });

        return {
            highValueCount: highValueRisk.length,
            totalRiskValueInCents: highValueRisk.reduce((acc, item) => acc + (item.unitCostInCents || 0) * item.quantity, 0)
        };
    }
};
