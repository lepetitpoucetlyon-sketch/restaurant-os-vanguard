import { Nexus } from '@/lib/nexus/NexusAdapter';

interface ShiftEntry {
    userId: string;
    type: 'CLOCK_IN' | 'CLOCK_OUT' | 'BREAK_START' | 'BREAK_END';
    timestamp: string;
}

interface LaborSnapshot {
    date: string;
    totalLaborCostEur: number;
    forecastRevenueEur: number;
    laborPercent: number;
    staffCount: number;
    hoursWorked: number;
    isOverStaffed: boolean;
}

const TARGET_LABOR_PERCENT = 30;

export const LaborCostService = {
    async computeRealtime(tenantId: string, date: string): Promise<LaborSnapshot> {
        const dayStart = `${date}T00:00:00Z`;
        const dayEnd = `${date}T23:59:59Z`;

        const [shifts, users, forecast] = await Promise.all([
            Nexus.adapter.query<ShiftEntry>(
                `tenants/${tenantId}/shiftEntries`,
                {
                    where: [
                        { field: 'timestamp', operator: '>=', value: dayStart },
                        { field: 'timestamp', operator: '<=', value: dayEnd },
                    ],
                    orderBy: { field: 'timestamp', direction: 'asc' },
                }
            ),
            Nexus.adapter.query<{ id: string; hourlyRateInMicrounits?: number }>(
                `tenants/${tenantId}/users`, {}
            ),
            Nexus.adapter.query<{ date: string; forecastRevenueInMicrounits: number }>(
                `tenants/${tenantId}/revenueForecast`,
                { where: [{ field: 'date', operator: '==', value: date }] }
            ),
        ]);

        const rateMap = new Map(users.map(u => [u.id, (u.hourlyRateInMicrounits ?? 0) / 1_000_000]));
        const activeStaff = new Set<string>();

        const sessionsByUser = new Map<string, { clockIn: number; breaks: number }>();
        let totalHours = 0;
        let totalCost = 0;

        for (const shift of shifts) {
            const ts = new Date(shift.timestamp).getTime();
            if (shift.type === 'CLOCK_IN') {
                sessionsByUser.set(shift.userId, { clockIn: ts, breaks: 0 });
                activeStaff.add(shift.userId);
            } else if (shift.type === 'CLOCK_OUT') {
                const session = sessionsByUser.get(shift.userId);
                if (session) {
                    const netMs = ts - session.clockIn - session.breaks;
                    const hours = netMs / (1000 * 3600);
                    totalHours += hours;
                    totalCost += hours * (rateMap.get(shift.userId) ?? 0);
                    sessionsByUser.delete(shift.userId);
                }
            }
        }

        const forecastRevenue = forecast[0]
            ? forecast[0].forecastRevenueInMicrounits / 1_000_000
            : 0;
        const laborPercent = forecastRevenue > 0
            ? Math.round((totalCost / forecastRevenue) * 10000) / 100
            : 0;

        return {
            date,
            totalLaborCostEur: Math.round(totalCost * 100) / 100,
            forecastRevenueEur: Math.round(forecastRevenue * 100) / 100,
            laborPercent,
            staffCount: activeStaff.size,
            hoursWorked: Math.round(totalHours * 100) / 100,
            isOverStaffed: laborPercent > TARGET_LABOR_PERCENT,
        };
    },
};
