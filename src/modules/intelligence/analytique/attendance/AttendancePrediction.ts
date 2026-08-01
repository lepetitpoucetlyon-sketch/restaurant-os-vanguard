import { Nexus } from '@/lib/nexus/NexusAdapter';

interface ReservationRecord {
  date: string;          // ISO "YYYY-MM-DD"
  partySize?: number;
  covers?: number;
  status: string;
}

/**
 * 🔮 Predicts attendance for a target date.
 *
 * Algorithm: fetches the last 8 weeks of confirmed/arrived/seated reservations
 * for the same day-of-week as `targetDate`, groups covers by calendar day,
 * then returns min/median/max over those 8 data-points.
 *
 * @param targetDate - Unix timestamp (ms) of the day to forecast
 * @param tenantId   - Optional tenant override; uses Nexus.activeTenant if omitted
 */
export async function predictAttendance(
  targetDate: number,
  tenantId?: string
): Promise<{ low: number; median: number; high: number }> {
  const day = new Date(targetDate);
  const targetDayOfWeek = day.getDay();

  const eightWeeksAgo = new Date(targetDate - 8 * 7 * 24 * 60 * 60 * 1000);

  const resolvedTenant = tenantId ?? (Nexus.activeTenant ?? undefined);
  const collectionPath = resolvedTenant
    ? `tenants/${resolvedTenant}/reservations`
    : 'reservations';

  const allReservations = await Nexus.adapter
    .query<ReservationRecord>(collectionPath, {
      where: [
        {
          field: 'status',
          operator: 'in',
          value: ['confirmed', 'arrived', 'seated'],
        },
      ],
    })
    .catch(() => [] as ReservationRecord[]);

  // Group total covers per calendar day for matching weekdays in the window
  const coversByDate = new Map<string, number>();
  for (const r of allReservations) {
    const rDate = new Date(r.date);
    if (
      rDate.getDay() === targetDayOfWeek &&
      rDate.getTime() >= eightWeeksAgo.getTime() &&
      rDate.getTime() < targetDate
    ) {
      const key = r.date.slice(0, 10);
      coversByDate.set(key, (coversByDate.get(key) ?? 0) + (r.covers ?? r.partySize ?? 0));
    }
  }

  const samples = Array.from(coversByDate.values()).sort((a, b) => a - b);

  if (samples.length === 0) {
    return { low: 0, median: 0, high: 0 };
  }

  const low = samples[0]!;
  const high = samples[samples.length - 1]!;
  const mid = Math.floor(samples.length / 2);
  const median =
    samples.length % 2 === 0
      ? Math.round(((samples[mid - 1]! + samples[mid]!) / 2))
      : samples[mid]!;

  return { low, median, high };
}
