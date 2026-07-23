import { StockItem } from "@nexus/contracts";

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
        // 🏛️ MICROUNITS PROTOCOL: We calculate in Microunits (10^-6) to avoid float drift.
        // Final return is converted back to cents (10^-2) only for UI/Fiscal sealing.
        const totalMicrounits = items.reduce((acc, item) => {
            if (item.unitCostInCents && item.quantity > 0) {
                const microQuantity = Math.floor(item.quantity * 1_000_000);
                return acc + (item.unitCostInCents * microQuantity);
            }
            return acc;
        }, 0);
        
        return Math.floor(totalMicrounits / 1_000_000);
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
