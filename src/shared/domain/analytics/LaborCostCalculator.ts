import { Nexus } from '@/lib/nexus/NexusAdapter';

export interface ShiftEntryRef {
    userId: string;
    type: 'CLOCK_IN' | 'CLOCK_OUT' | 'BREAK_START' | 'BREAK_END';
    timestamp: string;
}

export interface LaborSnapshot {
    date: string;
    totalLaborCostEur: number;
    forecastRevenueEur: number;
    laborPercent: number;
    staffCount: number;
    hoursWorked: number;
    isOverStaffed: boolean;
}

const TARGET_LABOR_PERCENT = 30;

export class LaborCostCalculator {
    static async computeRealtime(tenantId: string, date: string): Promise<LaborSnapshot> {
        const dayStart = `${date}T00:00:00Z`;
        const dayEnd = `${date}T23:59:59Z`;

        const [shifts, users, forecast] = await Promise.all([
            Nexus.adapter.query<ShiftEntryRef>(
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
                    const durationMs = ts - session.clockIn - session.breaks;
                    const durationHours = Math.max(0, durationMs / (1000 * 60 * 60));
                    const rate = rateMap.get(shift.userId) ?? 12.5; // SMIC hôtelier fallback
                    totalHours += durationHours;
                    totalCost += durationHours * rate * 1.45; // Coût chargé ~45%
                    sessionsByUser.delete(shift.userId);
                }
            }
        }

        const forecastRev = forecast.length > 0
            ? (forecast[0].forecastRevenueInMicrounits ?? 0) / 1_000_000
            : 0;

        const laborPercent = forecastRev > 0
            ? Math.round((totalCost / forecastRev) * 10000) / 100
            : 0;

        return {
            date,
            totalLaborCostEur: Math.round(totalCost * 100) / 100,
            forecastRevenueEur: Math.round(forecastRev * 100) / 100,
            laborPercent,
            staffCount: activeStaff.size,
            hoursWorked: Math.round(totalHours * 10) / 10,
            isOverStaffed: laborPercent > TARGET_LABOR_PERCENT,
        };
    }
}
