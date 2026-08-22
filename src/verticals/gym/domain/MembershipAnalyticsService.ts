import { Nexus } from '@/lib/nexus/NexusAdapter';
import { toMicrounits } from '@/shared/schemas/primitives';
import type { IMembership, IMembershipChurnReport, IClassSession } from './types';

/**
 * MembershipAnalyticsService — logique métier propre à la verticale gym.
 * Churn des abonnements + occupation des cours collectifs.
 */
export const MembershipAnalyticsService = {
  async listMemberships(tenantId: string): Promise<IMembership[]> {
    return Nexus.adapter.query<IMembership>(`tenants/${tenantId}/memberships`, { limit: 200 });
  },

  async computeChurnReport(
    tenantId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<IMembershipChurnReport> {
    const memberships = await this.listMemberships(tenantId);

    const activeCount = memberships.filter(m => m.status === 'active').length;
    const frozenCount = memberships.filter(m => m.status === 'frozen').length;
    const expiredCount = memberships.filter(m => m.status === 'expired').length;
    const churnedCount = memberships.filter(
      m => m.status === 'cancelled' && m.expiresAt >= periodStart && m.expiresAt <= periodEnd
    ).length;
    const totalAtPeriodStart = memberships.filter(m => m.startedAt <= periodStart).length;
    const churnRatePct = totalAtPeriodStart > 0 ? (churnedCount / totalAtPeriodStart) * 100 : 0;
    const monthlyRecurringRevenueInMicrounits = toMicrounits(
      memberships
        .filter(m => m.status === 'active')
        .reduce((sum, m) => sum + m.monthlyFeeInMicrounits, 0)
    );

    return {
      periodStart,
      periodEnd,
      activeCount,
      frozenCount,
      expiredCount,
      churnedCount,
      churnRatePct,
      monthlyRecurringRevenueInMicrounits,
    };
  },

  async listUpcomingClasses(tenantId: string): Promise<IClassSession[]> {
    return Nexus.adapter.query<IClassSession>(`tenants/${tenantId}/classSessions`, {
      where: [{ field: 'startsAt', operator: '>=', value: new Date().toISOString() }],
      limit: 50,
    });
  },
};
