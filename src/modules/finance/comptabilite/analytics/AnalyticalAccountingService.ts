import { Nexus } from '@/lib/nexus/NexusAdapter';
import type { Microunits } from '@/shared/schemas/primitives';
import { toMicrounits } from '@/shared/schemas/primitives';

type AnalyticalAxis = 'food' | 'beverage' | 'event' | 'takeaway' | 'delivery' | 'other';

interface AnalyticalEntry {
    id: string;
    tenantId: string;
    journalEntryId: string;
    axis: AnalyticalAxis;
    amountInMicrounits: Microunits;
    date: string;
    label: string;
}

interface AxisTotal {
    axis: AnalyticalAxis;
    totalInMicrounits: Microunits;
    percent: number;
}

interface PLByAxis {
    period: string;
    axes: AxisTotal[];
    grandTotalInMicrounits: Microunits;
}

export const AnalyticalAccountingService = {
    async tagEntry(
        tenantId: string,
        journalEntryId: string,
        axis: AnalyticalAxis,
        amountInMicrounits: Microunits,
        date: string,
        label: string
    ): Promise<AnalyticalEntry> {
        const id = Nexus.adapter.generateId(`tenants/${tenantId}/analyticalEntries`);
        const entry: AnalyticalEntry = {
            id, tenantId, journalEntryId, axis, amountInMicrounits, date, label,
        };

        await Nexus.adapter.set(
            `tenants/${tenantId}/analyticalEntries/${id}`,
            entry
        );

        return entry;
    },

    async plByAxis(tenantId: string, startDate: string, endDate: string): Promise<PLByAxis> {
        const entries = await Nexus.adapter.query<AnalyticalEntry>(
            `tenants/${tenantId}/analyticalEntries`,
            {
                where: [
                    { field: 'date', operator: '>=', value: startDate },
                    { field: 'date', operator: '<=', value: endDate },
                ],
            }
        );

        const totals = new Map<AnalyticalAxis, number>();
        let grand = 0;

        for (const e of entries) {
            totals.set(e.axis, (totals.get(e.axis) ?? 0) + e.amountInMicrounits);
            grand += e.amountInMicrounits;
        }

        const axes: AxisTotal[] = Array.from(totals.entries()).map(([axis, total]) => ({
            axis,
            totalInMicrounits: toMicrounits(total),
            percent: grand > 0 ? Math.round((total / grand) * 10000) / 100 : 0,
        }));

        axes.sort((a, b) => b.totalInMicrounits - a.totalInMicrounits);

        return {
            period: `${startDate}/${endDate}`,
            axes,
            grandTotalInMicrounits: toMicrounits(grand),
        };
    },
};
