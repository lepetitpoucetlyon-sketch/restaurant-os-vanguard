import { Nexus } from '@/lib/nexus/NexusAdapter';
import { CashCountSchema, type CashCount, type DenominationCount } from '@/domain/schemas/cash';
import { toMicrounits, type Microunits } from '@/domain/schemas/primitives';
import { empireAudit } from '@/infrastructure/services/audit';

function denomsToMicrounits(denoms: DenominationCount[]): Microunits {
    const totalCents = denoms.reduce((sum, d) => sum + d.valueCents * d.count, 0);
    return toMicrounits(totalCents * 10_000);
}

export const CashCountService = {
    async recordCount(
        tenantId: string,
        sessionId: string,
        type: CashCount['type'],
        denominations: DenominationCount[],
        operatorId: string,
        blindMode = false
    ): Promise<CashCount> {
        const id = Nexus.adapter.generateId(`tenants/${tenantId}/cashCounts`);
        const totalInMicrounits = denomsToMicrounits(denominations);

        const count: CashCount = {
            id,
            sessionId,
            type,
            denominations,
            totalInMicrounits,
            blindMode,
            countedAt: new Date().toISOString(),
            operatorId,
        };
        CashCountSchema.parse(count);

        await Nexus.adapter.set(
            `tenants/${tenantId}/cashCounts/${id}`,
            count as unknown as import('@/shared/nexus-contract').SovereignData
        );

        empireAudit.log({
            module: 'finance',
            action: `cash_${type}`,
            userId: operatorId,
            timestamp: new Date(),
            details: {
                sessionId,
                totalEur: totalInMicrounits / 1_000_000,
                blindMode,
                denomCount: denominations.length,
            } as unknown as import('@/shared/nexus-contract').SovereignData,
        });

        return count;
    },

    async getSessionCounts(tenantId: string, sessionId: string): Promise<CashCount[]> {
        return Nexus.adapter.query<CashCount>(
            `tenants/${tenantId}/cashCounts`,
            {
                where: [{ field: 'sessionId', operator: '==', value: sessionId }],
                orderBy: { field: 'countedAt', direction: 'asc' },
            }
        );
    },

    computeVariance(
        expectedInMicrounits: Microunits,
        countedInMicrounits: Microunits
    ): { varianceInMicrounits: number; varianceEur: number; isOver: boolean } {
        const variance = countedInMicrounits - expectedInMicrounits;
        return {
            varianceInMicrounits: variance,
            varianceEur: Math.round((variance / 1_000_000) * 100) / 100,
            isOver: variance > 0,
        };
    },
};
