import { Nexus } from '@/lib/nexus/NexusAdapter';
import { resolveMetricLabels } from '@/verticals/_shared/labels';
import type { PlatformVariant } from '@nexus/contracts';

interface SiteMetrics {
    tenantId: string;
    revenueInMicrounits: number;
    unitCount: number;
    ticketMoyenInMicrounits: number;
    foodCostPercent: number;
    laborPercent: number;
}

interface BenchmarkResult {
    tenantId: string;
    metric: string;
    value: number;
    fleetMedian: number;
    fleetAverage: number;
    percentile: number;
    isAboveMedian: boolean;
}

function median(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function percentile(values: number[], target: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const below = sorted.filter(v => v < target).length;
    return Math.round((below / sorted.length) * 100);
}

export const FleetBenchmark = {
    async benchmark(
        fleetTenantIds: string[],
        period: string,
        variant: PlatformVariant = 'restaurant'
    ): Promise<Map<string, BenchmarkResult[]>> {
        const labels = resolveMetricLabels(variant);

        const allMetrics: SiteMetrics[] = await Promise.all(
            fleetTenantIds.map(async (tid) => {
                const orders = await Nexus.adapter.query<{
                    totalInMicrounits?: number;
                    covers?: number;
                    createdAt: string;
                }>(
                    `tenants/${tid}/orders`,
                    {
                        where: [
                            { field: 'createdAt', operator: '>=', value: `${period}-01T00:00:00Z` },
                        ],
                    }
                );

                const revenue = orders.reduce((s, o) => s + (o.totalInMicrounits ?? 0), 0);
                const unitCount = orders.reduce((s, o) => s + (o.covers ?? 1), 0);
                const avgTicket = unitCount > 0 ? revenue / unitCount : 0;

                return {
                    tenantId: tid,
                    revenueInMicrounits: revenue,
                    unitCount,
                    ticketMoyenInMicrounits: avgTicket,
                    foodCostPercent: 30,
                    laborPercent: 28,
                };
            })
        );

        const results = new Map<string, BenchmarkResult[]>();

        const metricKeys: Array<{ key: keyof SiteMetrics; label: string }> = [
            { key: 'revenueInMicrounits', label: 'CA' },
            { key: 'unitCount', label: labels.unitPlural },
            { key: 'ticketMoyenInMicrounits', label: 'Ticket moyen' },
        ];

        for (const site of allMetrics) {
            const benchmarks: BenchmarkResult[] = [];

            for (const mk of metricKeys) {
                const allValues = allMetrics.map(m => m[mk.key] as number);
                const value = site[mk.key] as number;
                const med = median(allValues);
                const avg = allValues.reduce((s, v) => s + v, 0) / allValues.length;

                benchmarks.push({
                    tenantId: site.tenantId,
                    metric: mk.label,
                    value,
                    fleetMedian: med,
                    fleetAverage: Math.round(avg),
                    percentile: percentile(allValues, value),
                    isAboveMedian: value >= med,
                });
            }

            results.set(site.tenantId, benchmarks);
        }

        return results;
    },
};
