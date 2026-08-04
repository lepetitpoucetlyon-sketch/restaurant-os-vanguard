import { Nexus } from '@/lib/nexus/NexusAdapter';
import { toMicrounits, type Microunits } from '@/domain/schemas/primitives';

interface CampaignAttribution {
    campaignId: string;
    campaignName: string;
    reservationsAttributed: number;
    couverts: number;
    revenueInMicrounits: Microunits;
    costInMicrounits: Microunits;
    roiPercent: number;
}

export const CampaignAttributionService = {
    async computeROI(tenantId: string, campaignId: string): Promise<CampaignAttribution | null> {
        const campaigns = await Nexus.adapter.query<{
            id: string;
            name: string;
            costInMicrounits?: number;
            status: string;
        }>(
            `tenants/${tenantId}/campaigns`,
            { where: [{ field: 'id', operator: '==', value: campaignId }] }
        );

        const campaign = campaigns[0];
        if (!campaign) return null;

        const reservations = await Nexus.adapter.query<{
            id: string;
            source?: string;
            campaignId?: string;
            covers: number;
            orderId?: string;
        }>(
            `tenants/${tenantId}/reservations`,
            { where: [{ field: 'campaignId', operator: '==', value: campaignId }] }
        );

        let totalRevenue = 0;
        let totalCouverts = 0;

        const orderIds = [...new Set(reservations.map(r => r.orderId).filter(Boolean))] as string[];

        const orderMap = new Map<string, { totalInMicrounits?: number; totalAmountInCents?: number }>();
        const BATCH = 30;
        for (let i = 0; i < orderIds.length; i += BATCH) {
            const chunk = orderIds.slice(i, i + BATCH);
            const orders = await Nexus.adapter.query<{
                id: string;
                totalInMicrounits?: number;
                totalAmountInCents?: number;
            }>(
                `tenants/${tenantId}/orders`,
                { where: [{ field: 'id', operator: 'in', value: chunk }] }
            );
            for (const o of orders) orderMap.set(o.id, o);
        }

        for (const resa of reservations) {
            totalCouverts += resa.covers ?? 1;
            if (resa.orderId) {
                const order = orderMap.get(resa.orderId);
                if (order) {
                    totalRevenue += order.totalInMicrounits ?? (order.totalAmountInCents ?? 0) * 10_000;
                }
            }
        }

        const cost = campaign.costInMicrounits ?? 0;
        const roiPercent = cost > 0
            ? Math.round(((totalRevenue - cost) / cost) * 10000) / 100
            : 0;

        return {
            campaignId,
            campaignName: campaign.name,
            reservationsAttributed: reservations.length,
            couverts: totalCouverts,
            revenueInMicrounits: toMicrounits(totalRevenue),
            costInMicrounits: toMicrounits(cost),
            roiPercent,
        };
    },
};
