import { Nexus } from '@/lib/nexus/NexusAdapter';
import type { Microunits } from '@/domain/schemas/primitives';
import { toMicrounits } from '@/domain/schemas/primitives';
import { empireAudit } from '@/infrastructure/services/audit';

type DistributionRule = 'equal' | 'hours_worked' | 'rank_weighted';

interface RankWeight {
    role: string;
    weight: number;
}

const DEFAULT_RANK_WEIGHTS: RankWeight[] = [
    { role: 'manager', weight: 1.5 },
    { role: 'chef', weight: 1.3 },
    { role: 'sous_chef', weight: 1.2 },
    { role: 'barman', weight: 1.1 },
    { role: 'server', weight: 1.0 },
    { role: 'runner', weight: 0.8 },
    { role: 'plongeur', weight: 0.6 },
];

interface StaffMember {
    userId: string;
    role: string;
    hoursWorked: number;
}

interface TipShare {
    userId: string;
    amountInMicrounits: Microunits;
    percent: number;
}

interface TipPool {
    id: string;
    tenantId: string;
    periode: string;
    totalInMicrounits: Microunits;
    rule: DistributionRule;
    shares: TipShare[];
    distributedAt: string;
}

export const TipDistributionService = {
    distribute(
        totalInMicrounits: Microunits,
        staff: StaffMember[],
        rule: DistributionRule = 'hours_worked',
        customWeights?: RankWeight[]
    ): TipShare[] {
        if (staff.length === 0 || totalInMicrounits <= 0) return [];

        const weights = customWeights ?? DEFAULT_RANK_WEIGHTS;
        const weightMap = new Map(weights.map(w => [w.role, w.weight]));

        let shares: TipShare[];

        switch (rule) {
            case 'equal': {
                const perPerson = Math.floor(totalInMicrounits / staff.length);
                shares = staff.map(s => ({
                    userId: s.userId,
                    amountInMicrounits: toMicrounits(perPerson),
                    percent: Math.round((1 / staff.length) * 10000) / 100,
                }));
                break;
            }

            case 'hours_worked': {
                const totalHours = staff.reduce((sum, s) => sum + s.hoursWorked, 0);
                if (totalHours === 0) return this.distribute(totalInMicrounits, staff, 'equal');

                shares = staff.map(s => {
                    const ratio = s.hoursWorked / totalHours;
                    return {
                        userId: s.userId,
                        amountInMicrounits: toMicrounits(Math.floor(totalInMicrounits * ratio)),
                        percent: Math.round(ratio * 10000) / 100,
                    };
                });
                break;
            }

            case 'rank_weighted': {
                const totalHours = staff.reduce((sum, s) => sum + s.hoursWorked, 0);
                if (totalHours === 0) return this.distribute(totalInMicrounits, staff, 'equal');

                const weightedPoints = staff.map(s => ({
                    ...s,
                    points: s.hoursWorked * (weightMap.get(s.role) ?? 1.0),
                }));
                const totalPoints = weightedPoints.reduce((sum, s) => sum + s.points, 0);

                shares = weightedPoints.map(s => {
                    const ratio = s.points / totalPoints;
                    return {
                        userId: s.userId,
                        amountInMicrounits: toMicrounits(Math.floor(totalInMicrounits * ratio)),
                        percent: Math.round(ratio * 10000) / 100,
                    };
                });
                break;
            }
        }

        return shares;
    },

    async recordPool(
        tenantId: string,
        periode: string,
        totalInMicrounits: Microunits,
        staff: StaffMember[],
        rule: DistributionRule = 'hours_worked'
    ): Promise<TipPool> {
        const shares = this.distribute(totalInMicrounits, staff, rule);

        const id = Nexus.adapter.generateId(`tenants/${tenantId}/tipPools`);
        const pool: TipPool = {
            id,
            tenantId,
            periode,
            totalInMicrounits,
            rule,
            shares,
            distributedAt: new Date().toISOString(),
        };

        await Nexus.adapter.set(
            `tenants/${tenantId}/tipPools/${id}`,
            pool as unknown as import('@/shared/nexus-contract').SovereignData
        );

        empireAudit.log({
            module: 'human',
            action: 'tip_pool_distributed',
            timestamp: new Date(),
            details: {
                periode,
                rule,
                totalEur: totalInMicrounits / 1_000_000,
                staffCount: staff.length,
            } as unknown as import('@/shared/nexus-contract').SovereignData,
        });

        return pool;
    },

    async getByPeriode(tenantId: string, periode: string): Promise<TipPool[]> {
        return Nexus.adapter.query<TipPool>(
            `tenants/${tenantId}/tipPools`,
            { where: [{ field: 'periode', operator: '==', value: periode }] }
        );
    },
};
