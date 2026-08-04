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

            // 3. Calcul du coût en croisant avec les contrats RH
            let currentLaborCostInCents = 0;
            const now = Date.now();
            
            for (const employeeId of Object.keys(openShifts)) {
                const hours = (now - openShifts[employeeId]) / (1000 * 60 * 60);
                
                // Récupération du contrat
                const contract = await Nexus.adapter.get<{ hourlyRateCents: number }>(
                    `tenants/${tenantId}/hr/contracts/${employeeId}`
                );
                const rate = contract?.hourlyRateCents || 1500; // 15€/h fallback
                currentLaborCostInCents += Math.round(hours * rate);
            }
            
            // Ajouter les coûts des shifts terminés
            const closedShiftsHours: Record<string, number> = {};
            for (const entry of entries) {
                 if (entry.type === 'clock_out') {
                     // Logique simplifiée : la durée a déjà été ajoutée dans totalHoursWorked mais il faut l'attribuer.
                     // On re-boucle proprement sur les paires in/out.
                 }
            }
            
            // Recalcul précis complet:
            currentLaborCostInCents = 0;
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
            
            // Shifts en cours
            for (const employeeId of Object.keys(openMap)) {
                const durationMs = now - openMap[employeeId];
                employeeHours[employeeId] = (employeeHours[employeeId] || 0) + (durationMs / 3600000);
            }

            // Calcul du coût individuel
            for (const employeeId of Object.keys(employeeHours)) {
                const contract = await Nexus.adapter.get<{ hourlyRateCents: number }>(
                    `tenants/${tenantId}/hr/contracts/${employeeId}`
                );
                const rate = contract?.hourlyRateCents || 1500;
                currentLaborCostInCents += Math.round(employeeHours[employeeId] * rate);
            }

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
