import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

export interface BudgetLine {
    analyticalAxis: string;
    budgetedAmountInCents: number;
    actualAmountInCents: number;
    variancePercentage: number;
}

export interface BudgetReport {
    period: string; // ex: '2026-07'
    totalBudgetedRevenueInCents: number;
    totalActualRevenueInCents: number;
    lines: BudgetLine[];
}

/**
 * 📈 C4.6: Budget Tracking Service - Grade X
 * Compare le réalisé (via les écritures comptables NF525 et leurs axes analytiques) au budget prévisionnel.
 */
export class BudgetTrackingService {
    
    /**
     * Compare les ventes réelles avec le budget mensuel par axe analytique (Food, Beverage, etc).
     */
    static async generateMonthlyBudgetReport(tenantId: string, yearMonth: string): Promise<BudgetReport> {
        logger.info(`[BudgetTracking] Génération du rapport budget vs réalisé pour ${yearMonth} (${tenantId})`);
        
        try {
            // 1. Charger le budget configuré pour ce mois
            // Dans un vrai système, on lit depuis une collection 'budgets'
            const budgetData = {
                'Food': 5000000, // 50 000 €
                'Beverage': 2000000, // 20 000 €
            };

            // 2. Charger les écritures du mois (JournalEntries)
            const entries = await Nexus.adapter.get<Record<string, any>>(
                `tenants/${tenantId}/journalEntries`
            ) || {};

            const actualsByAxis: Record<string, number> = { 'Food': 0, 'Beverage': 0 };

            for (const entry of Object.values(entries)) {
                // Filtrer par mois (naïf pour l'exemple)
                if (entry.type === 'revenue' && entry.date?.startsWith(yearMonth)) {
                    for (const line of entry.lines || []) {
                        if (line.side === 'credit' && line.accountId === '701000' && line.analyticalAxis) {
                            actualsByAxis[line.analyticalAxis] = (actualsByAxis[line.analyticalAxis] || 0) + line.amountInCents;
                        }
                    }
                }
            }

            // 3. Calculer les écarts (Variance)
            const lines: BudgetLine[] = [];
            let totalBudget = 0;
            let totalActual = 0;

            for (const [axis, budgetedAmount] of Object.entries(budgetData)) {
                const actualAmount = actualsByAxis[axis] || 0;
                const variance = budgetedAmount > 0 
                    ? ((actualAmount - budgetedAmount) / budgetedAmount) * 100 
                    : 0;

                totalBudget += budgetedAmount;
                totalActual += actualAmount;

                lines.push({
                    analyticalAxis: axis,
                    budgetedAmountInCents: budgetedAmount,
                    actualAmountInCents: actualAmount,
                    variancePercentage: Number(variance.toFixed(2))
                });
            }

            return {
                period: yearMonth,
                totalBudgetedRevenueInCents: totalBudget,
                totalActualRevenueInCents: totalActual,
                lines
            };

        } catch (e) {
            logger.error('[BudgetTracking] Échec de la génération du rapport budgétaire', e);
            throw e;
        }
    }
}
