import type { PlatformVariant } from '@nexus/contracts';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
        // FIXME (Modular Monolith): Remove cross-module import. Use domain/ or NexusEventBus.
        // eslint-disable-next-line vanguard/no-inter-module-imports
import { LaborCostService } from '@/modules/human';
import { labelFor } from '@/verticals/_shared/labels';

interface FlashMetrics {
    date: string;
    unitCount: number;
    additionMoyenneEur: number;
    revenueEur: number;
    foodCostPercent: number;
    laborPercent: number;
    ecartCaisseEur: number;
    incidents: number;
}

interface FlashReport {
    date: string;
    unitLabel: string;
    metrics: FlashMetrics;
    previousDay?: FlashMetrics;
    trend: {
        revenueDelta: number;
        unitDelta: number;
    };
}

export const DailyFlashReport = {
    async generate(tenantId: string, date: string, variant: PlatformVariant = 'restaurant'): Promise<FlashReport> {
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
        const unitCount = orders.reduce((sum, o) => sum + (o.covers ?? 1), 0);
        const additionMoyenne = unitCount > 0 ? revenueEur / unitCount : 0;

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

        const unitLabel = labelFor('unitPlural', variant);
        const metrics: FlashMetrics = {
            date,
            unitCount,
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
        let unitDelta = 0;

        try {
            const prevReport = await this.generate(tenantId, prevDateStr, variant);
            previousDay = prevReport.metrics;
            revenueDelta = previousDay.revenueEur > 0
                ? Math.round(((revenueEur - previousDay.revenueEur) / previousDay.revenueEur) * 10000) / 100
                : 0;
            unitDelta = previousDay.unitCount > 0
                ? Math.round(((unitCount - previousDay.unitCount) / previousDay.unitCount) * 10000) / 100
                : 0;
        } catch (err) {
            // No previous day data
            logger.debug('[DailyFlashReport] Pas de données J-1 disponibles', { date, error: err });
        }

        return {
            date,
            unitLabel,
            metrics,
            previousDay,
            trend: { revenueDelta, unitDelta },
        };
    },
};
