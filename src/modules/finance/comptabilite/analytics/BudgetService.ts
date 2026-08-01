import { Nexus } from '@/lib/nexus/NexusAdapter';
import type { Microunits } from '@/domain/schemas/primitives';
import { toMicrounits } from '@/domain/schemas/primitives';

interface BudgetLine {
    id: string;
    tenantId: string;
    category: string;
    period: string;
    budgetInMicrounits: Microunits;
    actualInMicrounits: Microunits;
}

interface BudgetComparison {
    category: string;
    budgetEur: number;
    actualEur: number;
    varianceEur: number;
    variancePercent: number;
    isOverBudget: boolean;
}

interface BudgetReport {
    period: string;
    lines: BudgetComparison[];
    totalBudgetEur: number;
    totalActualEur: number;
    totalVarianceEur: number;
}

export const BudgetService = {
    async setBudget(
        tenantId: string,
        category: string,
        period: string,
        amountInMicrounits: Microunits
    ): Promise<BudgetLine> {
        const existing = await Nexus.adapter.query<BudgetLine>(
            `tenants/${tenantId}/budgetLines`,
            {
                where: [
                    { field: 'category', operator: '==', value: category },
                    { field: 'period', operator: '==', value: period },
                ],
            }
        );

        if (existing[0]) {
            await Nexus.adapter.update(
                `tenants/${tenantId}/budgetLines/${existing[0].id}`,
                { budgetInMicrounits: amountInMicrounits }
            );
            return { ...existing[0], budgetInMicrounits: amountInMicrounits };
        }

        const id = Nexus.adapter.generateId(`tenants/${tenantId}/budgetLines`);
        const line: BudgetLine = {
            id,
            tenantId,
            category,
            period,
            budgetInMicrounits: amountInMicrounits,
            actualInMicrounits: toMicrounits(0),
        };

        await Nexus.adapter.set(
            `tenants/${tenantId}/budgetLines/${id}`,
            line as unknown as import('@/shared/nexus-contract').SovereignData
        );

        return line;
    },

    async compareVsActual(tenantId: string, period: string): Promise<BudgetReport> {
        const lines = await Nexus.adapter.query<BudgetLine>(
            `tenants/${tenantId}/budgetLines`,
            { where: [{ field: 'period', operator: '==', value: period }] }
        );

        const MU = 1_000_000;
        const comparisons: BudgetComparison[] = lines.map(l => {
            const budgetEur = l.budgetInMicrounits / MU;
            const actualEur = l.actualInMicrounits / MU;
            const varianceEur = actualEur - budgetEur;
            const variancePercent = budgetEur > 0
                ? Math.round((varianceEur / budgetEur) * 10000) / 100
                : 0;

            return {
                category: l.category,
                budgetEur: Math.round(budgetEur * 100) / 100,
                actualEur: Math.round(actualEur * 100) / 100,
                varianceEur: Math.round(varianceEur * 100) / 100,
                variancePercent,
                isOverBudget: varianceEur > 0,
            };
        });

        return {
            period,
            lines: comparisons,
            totalBudgetEur: Math.round(comparisons.reduce((s, c) => s + c.budgetEur, 0) * 100) / 100,
            totalActualEur: Math.round(comparisons.reduce((s, c) => s + c.actualEur, 0) * 100) / 100,
            totalVarianceEur: Math.round(comparisons.reduce((s, c) => s + c.varianceEur, 0) * 100) / 100,
        };
    },
};
