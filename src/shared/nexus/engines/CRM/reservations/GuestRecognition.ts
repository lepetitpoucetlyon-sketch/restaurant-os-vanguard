import { Nexus } from '@/lib/nexus/NexusAdapter';
import { piiVault } from '@/shared/nexus/vault/PiiVault';

interface GuestProfile {
    subjectId: string;
    displayName: string;
    visitCount: number;
    lastVisit?: string;
    preferences?: string[];
    allergies?: string[];
    vipStatus: boolean;
    averageSpendEur: number;
}

export const GuestRecognition = {
    async recognize(tenantId: string, subjectId: string): Promise<GuestProfile | null> {
        const piiData = await piiVault.retrieve(tenantId, subjectId);
        if (!piiData) return null;

        const orders = await Nexus.adapter.query<{
            totalInMicrounits?: number;
            totalAmountInCents?: number;
            createdAt: string;
        }>(
            `tenants/${tenantId}/orders`,
            { where: [{ field: 'subjectId', operator: '==', value: subjectId }] }
        );

        const reservations = await Nexus.adapter.query<{
            preferences?: string[];
            allergies?: string[];
        }>(
            `tenants/${tenantId}/reservations`,
            { where: [{ field: 'subjectId', operator: '==', value: subjectId }] }
        );

        const totalSpend = orders.reduce((sum, o) => {
            return sum + (o.totalInMicrounits ?? (o.totalAmountInCents ?? 0) * 10_000);
        }, 0);
        const avgSpend = orders.length > 0 ? totalSpend / orders.length / 1_000_000 : 0;
        const lastVisit = orders.length > 0
            ? orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0].createdAt
            : undefined;

        const allPrefs = reservations.flatMap(r => r.preferences ?? []);
        const allAllergies = reservations.flatMap(r => r.allergies ?? []);

        return {
            subjectId,
            displayName: (piiData as Record<string, string>).name ?? 'Client',
            visitCount: orders.length,
            lastVisit,
            preferences: [...new Set(allPrefs)],
            allergies: [...new Set(allAllergies)],
            vipStatus: orders.length >= 10 || avgSpend >= 80,
            averageSpendEur: Math.round(avgSpend * 100) / 100,
        };
    },
};
