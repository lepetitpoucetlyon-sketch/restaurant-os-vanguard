import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

interface TempReading {
    equipmentId: string;
    temperature: number;
    recordedAt: string;
}

interface DriftAlert {
    equipmentId: string;
    equipmentName: string;
    currentTemp: number;
    avgTemp: number;
    trend: 'rising' | 'falling';
    driftPerHour: number;
    estimatedBreachIn: number;
    threshold: number;
}

const FRIDGE_MAX_TEMP = 4;
const FREEZER_MAX_TEMP = -18;
const MIN_READINGS_FOR_TREND = 3;
const DRIFT_ALERT_THRESHOLD = 0.5;

export const TempTrendService = {
    async detectDrift(tenantId: string): Promise<DriftAlert[]> {
        const lookbackHours = 6;
        const since = new Date(Date.now() - lookbackHours * 3600 * 1000).toISOString();

        const [readings, equipment] = await Promise.all([
            Nexus.adapter.query<TempReading>(
                `tenants/${tenantId}/tempReadings`,
                {
                    where: [{ field: 'recordedAt', operator: '>=', value: since }],
                    orderBy: { field: 'recordedAt', direction: 'asc' },
                }
            ),
            Nexus.adapter.query<{
                id: string;
                name: string;
                type: 'fridge' | 'freezer' | 'hot_hold';
            }>(
                `tenants/${tenantId}/equipment`, {}
            ),
        ]);

        const byEquipment = new Map<string, TempReading[]>();
        for (const r of readings) {
            const arr = byEquipment.get(r.equipmentId) ?? [];
            arr.push(r);
            byEquipment.set(r.equipmentId, arr);
        }

        const alerts: DriftAlert[] = [];
        const equipMap = new Map(equipment.map(e => [e.id, e]));

        for (const [eqId, eqReadings] of byEquipment) {
            if (eqReadings.length < MIN_READINGS_FOR_TREND) continue;

            const eq = equipMap.get(eqId);
            if (!eq) continue;

            const threshold = eq.type === 'freezer' ? FREEZER_MAX_TEMP : FRIDGE_MAX_TEMP;

            const first = eqReadings[0];
            const last = eqReadings[eqReadings.length - 1];
            const hoursSpan =
                (new Date(last.recordedAt).getTime() - new Date(first.recordedAt).getTime()) / (3600 * 1000);
            if (hoursSpan < 0.5) continue;

            const tempDelta = last.temperature - first.temperature;
            const driftPerHour = tempDelta / hoursSpan;

            if (Math.abs(driftPerHour) < DRIFT_ALERT_THRESHOLD) continue;

            const trend: 'rising' | 'falling' = driftPerHour > 0 ? 'rising' : 'falling';
            const currentTemp = last.temperature;
            const avgTemp = eqReadings.reduce((s, r) => s + r.temperature, 0) / eqReadings.length;

            const isApproachingBreach =
                (eq.type !== 'hot_hold' && trend === 'rising' && currentTemp < threshold) ||
                (eq.type === 'freezer' && trend === 'rising' && currentTemp < threshold);

            if (isApproachingBreach) {
                const degreesLeft = threshold - currentTemp;
                const estimatedBreachIn = degreesLeft / driftPerHour;

                alerts.push({
                    equipmentId: eqId,
                    equipmentName: eq.name,
                    currentTemp: Math.round(currentTemp * 10) / 10,
                    avgTemp: Math.round(avgTemp * 10) / 10,
                    trend,
                    driftPerHour: Math.round(driftPerHour * 100) / 100,
                    estimatedBreachIn: Math.round(estimatedBreachIn * 10) / 10,
                    threshold,
                });
            }
        }

        if (alerts.length > 0) {
            logger.warn(`[TempTrend] ${alerts.length} equipment drifting toward breach`);
        }

        return alerts;
    },
};
