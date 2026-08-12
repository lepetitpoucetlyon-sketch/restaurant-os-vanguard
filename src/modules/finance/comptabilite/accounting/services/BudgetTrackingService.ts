import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { JsonObject } from "@/shared/types/json";

export interface BudgetLine {
    analyticalAxis: string;
    budgetedAmountInMicrounits: number;
    /** @deprecated use budgetedAmountInMicrounits */
    budgetedAmountInCents?: number;
    actualAmountInMicrounits: number;
    /** @deprecated use actualAmountInMicrounits */
    actualAmountInCents?: number;
    variancePercentage: number;
}

export interface BudgetReport {
    period: string;
    totalBudgetedRevenueInMicrounits: number;
    /** @deprecated use totalBudgetedRevenueInMicrounits */
    totalBudgetedRevenueInCents?: number;
    totalActualRevenueInMicrounits: number;
    /** @deprecated use totalActualRevenueInMicrounits */
    totalActualRevenueInCents?: number;
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
            // 1. Charger le budget configuré pour ce mois depuis le Nexus
            const budgetData = await Nexus.adapter.get<Record<string, number>>(
                `tenants/${tenantId}/budgets/${yearMonth}`
            ) || { 'Food': 0, 'Beverage': 0 };

            // 2. Charger les écritures du mois (JournalEntries)
            const entries = await Nexus.adapter.get<Record<string, unknown>>(
                `tenants/${tenantId}/journalEntries`
            ) || {};

            const actualsByAxisMu: Record<string, number> = { 'Food': 0, 'Beverage': 0 };

            for (const entry of Object.values(entries) as JsonObject[]) {
                if ((entry as {type?: string}).type === 'revenue' && (entry as {date?: string}).date?.startsWith(yearMonth)) {
                    for (const line of ((entry as {lines?: Record<string, unknown>[]}).lines || [])) {
                        if (line.side === 'credit' && line.accountId === '701000' && line.analyticalAxis) {
                            const lineMu = (line.amountInMicrounits as number | undefined) ?? ((line.amountInCents as number) || 0) * 10_000;
                            actualsByAxisMu[line.analyticalAxis as string] = (actualsByAxisMu[line.analyticalAxis as string] || 0) + lineMu;
                        }
                    }
                }
            }

            const lines: BudgetLine[] = [];
            let totalBudgetMu = 0;
            let totalActualMu = 0;

            for (const [axis, budgetedAmount] of Object.entries(budgetData)) {
                const budgetedMu = budgetedAmount * 10_000;
                const actualMu = actualsByAxisMu[axis] || 0;
                const variance = budgetedMu > 0
                    ? ((actualMu - budgetedMu) / budgetedMu) * 100
                    : 0;

                totalBudgetMu += budgetedMu;
                totalActualMu += actualMu;

                lines.push({
                    analyticalAxis: axis,
                    budgetedAmountInMicrounits: budgetedMu,
                    budgetedAmountInCents: Math.round(budgetedMu / 10_000),
                    actualAmountInMicrounits: actualMu,
                    actualAmountInCents: Math.round(actualMu / 10_000),
                    variancePercentage: Number(variance.toFixed(2))
                });
            }

            return {
                period: yearMonth,
                totalBudgetedRevenueInMicrounits: totalBudgetMu,
                totalBudgetedRevenueInCents: Math.round(totalBudgetMu / 10_000),
                totalActualRevenueInMicrounits: totalActualMu,
                totalActualRevenueInCents: Math.round(totalActualMu / 10_000),
                lines
            };

        } catch (e) {
            logger.error('[BudgetTracking] Échec de la génération du rapport budgétaire', e);
            throw e;
        }
    }
}
