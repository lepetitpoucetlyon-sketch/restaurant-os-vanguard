import { Nexus } from '@/lib/nexus/NexusAdapter';
import type { IDeskBooking, IOccupancyReport, IPassPlan } from './types';

/**
 * OccupancyAnalyticsService — logique métier propre à la verticale coworking.
 * Occupation des bureaux/salles + forfaits actifs.
 */
export const OccupancyAnalyticsService = {
  async listBookings(tenantId: string): Promise<IDeskBooking[]> {
    return Nexus.adapter.query<IDeskBooking>(`tenants/${tenantId}/deskBookings`, { limit: 200 });
  },

  async computeOccupancyReport(
    tenantId: string,
    periodStart: string,
    periodEnd: string
  ): Promise<IOccupancyReport> {
    const bookings = (await this.listBookings(tenantId)).filter(
      b => b.startsAt >= periodStart && b.startsAt <= periodEnd
    );

    const totalBookings = bookings.length;
    const checkedInCount = bookings.filter(b => b.status === 'checked-in' || b.status === 'checked-out').length;
    const noShowCount = bookings.filter(b => b.status === 'no-show').length;
    const occupancyRatePct = totalBookings > 0 ? (checkedInCount / totalBookings) * 100 : 0;

    return { periodStart, periodEnd, totalBookings, checkedInCount, noShowCount, occupancyRatePct };
  },

  async listActivePassPlans(tenantId: string): Promise<IPassPlan[]> {
    return Nexus.adapter.query<IPassPlan>(`tenants/${tenantId}/passPlans`, {
      where: [{ field: 'status', operator: '==', value: 'active' }],
      limit: 200,
    });
  },
};
