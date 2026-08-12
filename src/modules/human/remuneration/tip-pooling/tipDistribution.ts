import { Nexus } from '@/lib/nexus/NexusAdapter';
import type { Microunits } from '@/shared/schemas/primitives';
import { toMicrounits } from '@/shared/schemas/primitives';
import { empireAudit } from '@/lib/audit';
import type { PlatformVariant } from '@nexus/contracts';
import { resolveTipWeightsByLevel } from '@/verticals/_shared/roles';

type DistributionRule = 'equal' | 'hours_worked' | 'rank_weighted';

interface StaffMember {
    userId: string;
    /** Niveau RBAC numérique (PERMISSION_ROLE_LEVELS) — universel toutes verticales. */
    level: number;
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
        variant: PlatformVariant = 'restaurant'
    ): TipShare[] {
        if (staff.length === 0 || totalInMicrounits <= 0) return [];

        const weights = resolveTipWeightsByLevel(variant);
        const weightMap = new Map(weights.map(w => [w.level, w.weight]));

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
                    points: s.hoursWorked * (weightMap.get(s.level) ?? 1.0),
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
        rule: DistributionRule = 'hours_worked',
        variant: PlatformVariant = 'restaurant'
    ): Promise<TipPool> {
        const shares = this.distribute(totalInMicrounits, staff, rule, variant);

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
            pool
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
            },
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
