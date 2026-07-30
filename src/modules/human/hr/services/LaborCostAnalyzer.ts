import { Nexus } from '@/lib/nexus/NexusAdapter';
import type { ClockEntry } from '@/modules/human/connectors/timeclock/types';
import { logger } from '@/lib/logger';

export interface LaborMetrics {
    currentLaborCostInCents: number;
    projectedDailyLaborCostInCents: number;
    currentRevenueInCents: number;
    laborCostPercentage: number;
    alertStatus: 'OK' | 'WARNING' | 'CRITICAL';
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
            // 1. Récupération des pointages
            const raw = await Nexus.adapter.get<Record<string, ClockEntry>>(
                `tenants/${tenantId}/timeclock/${today}`
            );
            const entries = raw ? Object.values(raw) : [];

            // 2. Calcul du temps de travail
            let totalHoursWorked = 0;
            const openShifts: Record<string, number> = {};

            for (const entry of entries) {
                if (entry.type === 'clock_in') {
                    openShifts[entry.employeeId] = new Date(entry.timestamp).getTime();
                } else if (entry.type === 'clock_out' && openShifts[entry.employeeId]) {
                    const durationMs = new Date(entry.timestamp).getTime() - openShifts[entry.employeeId];
                    totalHoursWorked += durationMs / (1000 * 60 * 60);
                    delete openShifts[entry.employeeId];
                }
            }

            // Ajouter le temps partiel pour les shifts ouverts (jusqu'à "now")
            const now = Date.now();
            for (const startTime of Object.values(openShifts)) {
                totalHoursWorked += (now - startTime) / (1000 * 60 * 60);
            }

            // 3. Application du taux horaire (simulé à 15€/h moyen pour cet exemple)
            // Dans la vraie vie, on irait chercher le contrat de chaque employé
            const AVG_HOURLY_RATE_CENTS = 1500;
            const currentLaborCostInCents = Math.round(totalHoursWorked * AVG_HOURLY_RATE_CENTS);

            // 4. Calcul du pourcentage
            const laborCostPercentage = currentRevenueInCents > 0 
                ? (currentLaborCostInCents / currentRevenueInCents) * 100 
                : 0;

            // 5. Statut
            let alertStatus: 'OK' | 'WARNING' | 'CRITICAL' = 'OK';
            if (laborCostPercentage > 35) alertStatus = 'WARNING';
            if (laborCostPercentage > 40) alertStatus = 'CRITICAL';

            logger.info(`[LaborCostAnalyzer] CA: ${currentRevenueInCents/100}€ | Labor: ${currentLaborCostInCents/100}€ | Ratio: ${laborCostPercentage.toFixed(1)}%`);

            return {
                currentLaborCostInCents,
                projectedDailyLaborCostInCents: currentLaborCostInCents * 1.5, // Estimation grossière fin de journée
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
