import { Nexus } from '@/lib/nexus/NexusAdapter';
import { LaborCostService } from '@/modules/human/hr/services/laborCost';

interface FlashMetrics {
    date: string;
    couverts: number;
    additionMoyenneEur: number;
    revenueEur: number;
    foodCostPercent: number;
    laborPercent: number;
    ecartCaisseEur: number;
    incidents: number;
}

interface FlashReport {
    date: string;
    metrics: FlashMetrics;
    previousDay?: FlashMetrics;
    trend: {
        revenueDelta: number;
        couvertsDelta: number;
    };
}

export const DailyFlashReport = {
    async generate(tenantId: string, date: string): Promise<FlashReport> {
        const dayStart = `${date}T00:00:00Z`;
        const dayEnd = `${date}T23:59:59Z`;

        const [orders, cashSessions, auditEvents, labor] = await Promise.all([
            Nexus.adapter.query<{
                id: string;
                totalInMicrounits?: number;
                totalAmountInCents?: number;
                covers?: number;
                createdAt: string;
            }>(
                `tenants/${tenantId}/orders`,
                {
                    where: [
                        { field: 'createdAt', operator: '>=', value: dayStart },
                        { field: 'createdAt', operator: '<=', value: dayEnd },
                    ],
                }
            ),
            Nexus.adapter.query<{
                closingInMicrounits?: number;
                openingInMicrounits?: number;
                collectedInMicrounits?: number;
                changeGivenInMicrounits?: number;
            }>(
                `tenants/${tenantId}/cashSessions`,
                {
                    where: [
                        { field: 'openedAt', operator: '>=', value: dayStart },
                        { field: 'openedAt', operator: '<=', value: dayEnd },
                    ],
                }
            ),
            Nexus.adapter.query<{ action: string }>(
                `tenants/${tenantId}/auditEvents`,
                {
                    where: [
                        { field: 'timestamp', operator: '>=', value: new Date(dayStart).getTime() },
                        { field: 'timestamp', operator: '<=', value: new Date(dayEnd).getTime() },
                        { field: 'severity', operator: '==', value: 'critical' },
                    ],
                }
            ),
            LaborCostService.computeRealtime(tenantId, date),
        ]);

        const totalRevenueMu = orders.reduce((sum, o) => {
            return sum + (o.totalInMicrounits ?? (o.totalAmountInCents ?? 0) * 10_000);
        }, 0);
        const revenueEur = totalRevenueMu / 1_000_000;
        const couverts = orders.reduce((sum, o) => sum + (o.covers ?? 1), 0);
        const additionMoyenne = couverts > 0 ? revenueEur / couverts : 0;

        let ecartCaisse = 0;
        for (const s of cashSessions) {
            if (s.closingInMicrounits != null && s.openingInMicrounits != null) {
                const expected = s.openingInMicrounits + (s.collectedInMicrounits ?? 0) - (s.changeGivenInMicrounits ?? 0);
                ecartCaisse += (s.closingInMicrounits - expected) / 1_000_000;
            }
        }

        const recipes = await Nexus.adapter.query<{ id: string; costPriceInMicrounits?: number; sellingPriceInMicrounits?: number }>(
            `tenants/${tenantId}/recipes`, {}
        );
        const totalCost = recipes.reduce((sum, r) => sum + (r.costPriceInMicrounits ?? 0), 0);
        const totalSelling = recipes.reduce((sum, r) => sum + (r.sellingPriceInMicrounits ?? 0), 0);
        const foodCostPercent = totalSelling > 0
            ? Math.round((totalCost / totalSelling) * 10000) / 100
            : 0;

        const metrics: FlashMetrics = {
            date,
            couverts,
            additionMoyenneEur: Math.round(additionMoyenne * 100) / 100,
            revenueEur: Math.round(revenueEur * 100) / 100,
            foodCostPercent,
            laborPercent: labor.laborPercent,
            ecartCaisseEur: Math.round(ecartCaisse * 100) / 100,
            incidents: auditEvents.length,
        };

        const prevDate = new Date(date);
        prevDate.setDate(prevDate.getDate() - 1);
        const prevDateStr = prevDate.toISOString().slice(0, 10);

        let previousDay: FlashMetrics | undefined;
        let revenueDelta = 0;
        let couvertsDelta = 0;

        try {
            const prevReport = await this.generate(tenantId, prevDateStr);
            previousDay = prevReport.metrics;
            revenueDelta = previousDay.revenueEur > 0
                ? Math.round(((revenueEur - previousDay.revenueEur) / previousDay.revenueEur) * 10000) / 100
                : 0;
            couvertsDelta = previousDay.couverts > 0
                ? Math.round(((couverts - previousDay.couverts) / previousDay.couverts) * 10000) / 100
                : 0;
        } catch {
            // No previous day data
        }

        return {
            date,
            metrics,
            previousDay,
            trend: { revenueDelta, couvertsDelta },
        };
    },
};
