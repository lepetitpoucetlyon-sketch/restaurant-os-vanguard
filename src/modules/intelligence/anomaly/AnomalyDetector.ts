import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';

type AnomalyType = 'excessive_voids' | 'excessive_comps' | 'discount_abuse' | 'cash_variance' | 'override_spike';

interface Anomaly {
    type: AnomalyType;
    severity: 'low' | 'medium' | 'critical';
    userId?: string;
    description: string;
    value: number;
    threshold: number;
    date: string;
}

interface AnomalyReport {
    date: string;
    anomalies: Anomaly[];
    scannedEvents: number;
}

const THRESHOLDS = {
    voidsPerShift: 5,
    compsPerShift: 3,
    discountPercentMax: 20,
    cashVarianceEur: 10,
    overridesPerDay: 10,
};

export const AnomalyDetector = {
    async scan(tenantId: string, date: string): Promise<AnomalyReport> {
        const dayStart = new Date(`${date}T00:00:00Z`).getTime();
        const dayEnd = new Date(`${date}T23:59:59Z`).getTime();

        const [auditEvents, cashSessions] = await Promise.all([
            Nexus.adapter.query<{
                action: string;
                userId?: string;
                timestamp: number;
                details?: Record<string, unknown>;
            }>(
                `tenants/${tenantId}/auditEvents`,
                {
                    where: [
                        { field: 'timestamp', operator: '>=', value: dayStart },
                        { field: 'timestamp', operator: '<=', value: dayEnd },
                    ],
                }
            ),
            Nexus.adapter.query<{
                closingInMicrounits?: number;
                openingInMicrounits?: number;
                collectedInMicrounits?: number;
                changeGivenInMicrounits?: number;
                userId: string;
            }>(
                `tenants/${tenantId}/cashSessions`,
                {
                    where: [
                        { field: 'openedAt', operator: '>=', value: `${date}T00:00:00Z` },
                        { field: 'openedAt', operator: '<=', value: `${date}T23:59:59Z` },
                    ],
                }
            ),
        ]);

        const anomalies: Anomaly[] = [];

        const voidsByUser = new Map<string, number>();
        const compsByUser = new Map<string, number>();
        const overridesByUser = new Map<string, number>();

        for (const event of auditEvents) {
            const uid = event.userId ?? 'unknown';

            if (event.action.includes('void') || event.action.includes('annul')) {
                voidsByUser.set(uid, (voidsByUser.get(uid) ?? 0) + 1);
            }
            if (event.action.includes('comp') || event.action.includes('offert')) {
                compsByUser.set(uid, (compsByUser.get(uid) ?? 0) + 1);
            }
            if (event.action.includes('override') || event.action.includes('elevation')) {
                overridesByUser.set(uid, (overridesByUser.get(uid) ?? 0) + 1);
            }
            if (event.action.includes('discount') || event.action.includes('remise')) {
                const pct = (event.details?.discountPercent as number) ?? 0;
                if (pct > THRESHOLDS.discountPercentMax) {
                    anomalies.push({
                        type: 'discount_abuse',
                        severity: 'medium',
                        userId: uid,
                        description: `Remise ${pct}% dépasse le seuil de ${THRESHOLDS.discountPercentMax}%`,
                        value: pct,
                        threshold: THRESHOLDS.discountPercentMax,
                        date,
                    });
                }
            }
        }

        for (const [userId, count] of voidsByUser) {
            if (count >= THRESHOLDS.voidsPerShift) {
                anomalies.push({
                    type: 'excessive_voids',
                    severity: count >= THRESHOLDS.voidsPerShift * 2 ? 'critical' : 'medium',
                    userId,
                    description: `${count} annulations (seuil: ${THRESHOLDS.voidsPerShift})`,
                    value: count,
                    threshold: THRESHOLDS.voidsPerShift,
                    date,
                });
            }
        }

        for (const [userId, count] of compsByUser) {
            if (count >= THRESHOLDS.compsPerShift) {
                anomalies.push({
                    type: 'excessive_comps',
                    severity: 'medium',
                    userId,
                    description: `${count} offerts (seuil: ${THRESHOLDS.compsPerShift})`,
                    value: count,
                    threshold: THRESHOLDS.compsPerShift,
                    date,
                });
            }
        }

        const totalOverrides = Array.from(overridesByUser.values()).reduce((s, v) => s + v, 0);
        if (totalOverrides >= THRESHOLDS.overridesPerDay) {
            anomalies.push({
                type: 'override_spike',
                severity: 'medium',
                description: `${totalOverrides} overrides d'autorisation (seuil: ${THRESHOLDS.overridesPerDay})`,
                value: totalOverrides,
                threshold: THRESHOLDS.overridesPerDay,
                date,
            });
        }

        for (const session of cashSessions) {
            if (session.closingInMicrounits != null && session.openingInMicrounits != null) {
                const expected = session.openingInMicrounits
                    + (session.collectedInMicrounits ?? 0)
                    - (session.changeGivenInMicrounits ?? 0);
                const variance = Math.abs(session.closingInMicrounits - expected) / 1_000_000;
                if (variance > THRESHOLDS.cashVarianceEur) {
                    anomalies.push({
                        type: 'cash_variance',
                        severity: variance > THRESHOLDS.cashVarianceEur * 3 ? 'critical' : 'medium',
                        userId: session.userId,
                        description: `Écart caisse ${variance.toFixed(2)} € (seuil: ${THRESHOLDS.cashVarianceEur} €)`,
                        value: variance,
                        threshold: THRESHOLDS.cashVarianceEur,
                        date,
                    });
                }
            }
        }

        if (anomalies.length > 0) {
            empireAudit.log({
                module: 'compliance',
                action: 'anomaly_detection_alert',
                timestamp: new Date(),
                severity: anomalies.some(a => a.severity === 'critical') ? 'critical' : 'medium',
                details: {
                    date,
                    anomalyCount: anomalies.length,
                    types: [...new Set(anomalies.map(a => a.type))],
                } as unknown as import('@/shared/nexus-contract').SovereignData,
            });
            logger.warn(`[AnomalyDetector] ${anomalies.length} anomalies detected for ${date}`);
        }

        return {
            date,
            anomalies,
            scannedEvents: auditEvents.length,
        };
    },
};
