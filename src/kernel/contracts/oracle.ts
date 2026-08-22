import type { InventoryMovement as StockEvent } from '@nexus/contracts';
import type { Quantity } from '@/lib/branding/brands';

/**
 * 🔮 OraclePrediction & IStockOracle Contract
 * Contrat neutre cross-pilier pour les prédictions de rupture et d'approvisionnement (ADR-015).
 * Zéro import vers les modules applicatifs.
 */
export interface OraclePrediction {
    estimatedDaysRemaining: number;
    confidence: number;
    trend: 'STABLE' | 'ACCELERATING' | 'DECELERATING';
    scenarios: {
        optimistic: number;
        pessimistic: number;
        p50: number;
    };
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface IStockOracle {
    predictStockout(
        itemId: string,
        events: StockEvent[],
        currentQty: Quantity
    ): Promise<OraclePrediction>;
}

let _stockOracleProvider: IStockOracle | null = null;

/**
 * Fallback statistique pur si l'oracle IA n'est pas encore enregistré
 */
function defaultStatisticalPrediction(events: StockEvent[], currentQty: Quantity): OraclePrediction {
    if (!events || events.length < 5) {
        return {
            estimatedDaysRemaining: 99,
            confidence: 0.1,
            trend: 'STABLE',
            scenarios: { optimistic: 99, pessimistic: 99, p50: 99 },
            riskLevel: 'LOW',
        };
    }

    const dailyUsage = events.reduce((sum, e) => sum + Math.abs(e.quantity || 0), 0) / Math.max(1, events.length);
    const estimatedDays = dailyUsage > 0 ? Math.max(0, Math.round(Number(currentQty) / dailyUsage)) : 99;

    return {
        estimatedDaysRemaining: estimatedDays,
        confidence: 0.7,
        trend: 'STABLE',
        scenarios: {
            optimistic: Math.round(estimatedDays * 1.2),
            pessimistic: Math.round(estimatedDays * 0.8),
            p50: estimatedDays,
        },
        riskLevel: estimatedDays < 3 ? 'HIGH' : estimatedDays < 7 ? 'MEDIUM' : 'LOW',
    };
}

export const StockOracleRegistry = {
    register(provider: IStockOracle): void {
        _stockOracleProvider = provider;
    },
    get(): IStockOracle | null {
        return _stockOracleProvider;
    },
    async predictStockout(
        itemId: string,
        events: StockEvent[],
        currentQty: Quantity
    ): Promise<OraclePrediction> {
        if (_stockOracleProvider) {
            return _stockOracleProvider.predictStockout(itemId, events, currentQty);
        }
        return defaultStatisticalPrediction(events, currentQty);
    },
};
