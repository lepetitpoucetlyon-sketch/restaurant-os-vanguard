import { StockItem } from "@nexus/contracts";

/**
 * Inventory Business Logic Service - The "Stock Intelligence" Layer
 */
export const InventoryService = {
    /**
     * Calculates the total value of the current stock (HT).
     * Returns both cents (legacy) and microunits (preferred).
     */
    calculateStockValuation: (items: StockItem[]): number => {
        const mu = InventoryService.calculateStockValuationInMicrounits(items);
        return Math.floor(mu / 10_000); // µ → cents
    },

    calculateStockValuationInMicrounits: (items: StockItem[]): number => {
        return items.reduce((acc, item) => {
            const costMu = item.unitCostInMicrounits ?? (item.unitCostInCents ?? 0) * 10_000;
            if (costMu > 0 && item.quantity > 0) {
                return acc + Math.floor(costMu * item.quantity);
            }
            return acc;
        }, 0);
    },

    getReplacementCostImpact: (currentValuationInCents: number, inflationRate: number): number => {
        if (currentValuationInCents === 0 || inflationRate === 0) return 0;
        const volatilityFactor = 1.25;
        return Math.round(currentValuationInCents * (inflationRate / 100) * volatilityFactor);
    },

    getReplacementCostImpactInMicrounits: (currentValuationInMicrounits: number, inflationRate: number): number => {
        if (currentValuationInMicrounits === 0 || inflationRate === 0) return 0;
        const volatilityFactor = 1.25;
        return Math.round(currentValuationInMicrounits * (inflationRate / 100) * volatilityFactor);
    },

    getRiskAnalysis: (items: StockItem[]) => {
        const highValueRisk = items.filter(item => {
            const costMu = item.unitCostInMicrounits ?? (item.unitCostInCents ?? 0) * 10_000;
            const valMu = costMu * item.quantity;
            return valMu > 500_000_000_000; // 500 000 µ × qty threshold (≈500€ per unit, for qty=1)
        });
        const totalRiskMicrounits = highValueRisk.reduce((acc, item) => {
            const costMu = item.unitCostInMicrounits ?? (item.unitCostInCents ?? 0) * 10_000;
            return acc + costMu * item.quantity;
        }, 0);
        return {
            highValueCount: highValueRisk.length,
            totalRiskValueInCents: Math.floor(totalRiskMicrounits / 10_000),
            totalRiskValueInMicrounits: totalRiskMicrounits,
        };
    }
};
