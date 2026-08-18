import { Nexus } from '@/lib/nexus/NexusAdapter';
import type { ClockEntry } from '../../../connectors/timeclock/types';
import { logger } from '@/lib/logger';

export interface LaborMetrics {
    currentLaborCostInCents: number;
    projectedDailyLaborCostInCents: number;
    currentRevenueInCents: number;
    laborCostPercentage: number;
    alertStatus: 'OK' | 'WARNING' | 'CRITICAL';
}

function calculateEmployeeHours(entries: ClockEntry[], now: number): Record<string, number> {
    const openMap: Record<string, number> = {};
    const employeeHours: Record<string, number> = {};

    for (const entry of entries) {
        if (entry.type === 'clock_in') {
            openMap[entry.employeeId] = new Date(entry.timestamp).getTime();
        } else if (entry.type === 'clock_out' && openMap[entry.employeeId]) {
            const durationMs = new Date(entry.timestamp).getTime() - openMap[entry.employeeId];
            employeeHours[entry.employeeId] = (employeeHours[entry.employeeId] || 0) + (durationMs / 3600000);
            delete openMap[entry.employeeId];
        }
    }

    for (const [employeeId, clockInTime] of Object.entries(openMap)) {
        const durationMs = Math.max(0, now - clockInTime);
        employeeHours[employeeId] = (employeeHours[employeeId] || 0) + (durationMs / 3600000);
    }

    return employeeHours;
}

function determineLaborAlertStatus(percentage: number): 'OK' | 'WARNING' | 'CRITICAL' {
    if (percentage > 40) return 'CRITICAL';
    if (percentage > 35) return 'WARNING';
    return 'OK';
}

/**
 * 🧑‍🤝‍🧑 C4.3: Labor Cost Analyzer - Grade X
 * Croise en temps réel la masse salariale (pointages) avec le chiffre d'affaires (POS).
 */
export class LaborCostAnalyzer {
    /**
     * Analyse les coûts RH vs les revenus du jour.
     */
    static async analyzeDailyLaborCost(tenantId: string, currentRevenueInCents: number): Promise<LaborMetrics> {
        const today = new Date().toISOString().slice(0, 10);
        
        try {
            const raw = await Nexus.adapter.get<Record<string, ClockEntry>>(
                `tenants/${tenantId}/timeclock/${today}`
            );
            const entries = raw ? Object.values(raw) : [];
            const employeeHours = calculateEmployeeHours(entries, Date.now());

            let currentLaborCostInCents = 0;
            for (const [employeeId, hours] of Object.entries(employeeHours)) {
                const contract = await Nexus.adapter.get<{ hourlyRateCents: number }>(
                    `tenants/${tenantId}/hr/contracts/${employeeId}`
                );
                const rate = contract?.hourlyRateCents || 1500;
                currentLaborCostInCents += Math.round(hours * rate);
            }

            const laborCostPercentage = currentRevenueInCents > 0 
                ? (currentLaborCostInCents / currentRevenueInCents) * 100 
                : 0;

            const alertStatus = determineLaborAlertStatus(laborCostPercentage);

            logger.info(`[LaborCostAnalyzer] CA: ${currentRevenueInCents / 100}€ | Labor: ${currentLaborCostInCents / 100}€ | Ratio: ${laborCostPercentage.toFixed(1)}%`);

            return {
                currentLaborCostInCents,
                projectedDailyLaborCostInCents: Math.round(currentLaborCostInCents * 1.5),
                currentRevenueInCents,
                laborCostPercentage,
                alertStatus
            };
        } catch (e) {
            logger.error('[LaborCostAnalyzer] Erreur d\'analyse', e);
            throw e;
        }
    }
}
