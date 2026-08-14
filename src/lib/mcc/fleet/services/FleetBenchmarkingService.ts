import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

export interface FleetBenchmarkMetrics {
    medianFoodCostPct: number;
    medianLaborCostPct: number;
    medianTicketAOV: number; // Average Order Value en cents
}

export interface TenantBenchmarkComparison {
    tenantId: string;
    foodCostPct: number;
    foodCostDelta: number; // vs median
    laborCostPct: number;
    laborCostDelta: number;
    ticketAOV: number;
    ticketAOVDelta: number;
}

/**
 * 🏢 C5.4: Fleet Benchmarking Service
 * Compare un restaurant (tenant) à la médiane de la flotte (SovereignGuard respecté).
 */
export class FleetBenchmarkingService {
    
    /**
     * Calcule la médiane de la flotte (sur des données agrégées anonymisées).
     * Dans un vrai environnement, ceci est calculé par une Cloud Function asynchrone pour éviter 
     * qu'un tenant lise les données des autres.
     */
    static async getFleetMedianMetrics(): Promise<FleetBenchmarkMetrics> {
        const fallback: FleetBenchmarkMetrics = {
            medianFoodCostPct: 28.5,
            medianLaborCostPct: 32.0,
            medianTicketAOV: 2450 // 24.50€
        };
        
        try {
            const data = await Nexus.adapter.get<FleetBenchmarkMetrics>('global/fleet/benchmark_median');
            return data || fallback;
        } catch (err) {
            logger.warn('[FleetBenchmarkingService] Lecture métriques benchmark fleet échouée — fallback', { error: err });
            return fallback;
        }
    }

    /**
     * Compare le tenant actuel à la flotte.
     */
    static async compareTenantToFleet(tenantId: string): Promise<TenantBenchmarkComparison> {
        logger.info(`[Benchmarking] Calcul du benchmark pour le tenant ${tenantId}`);
        
        const fleetMetrics = await this.getFleetMedianMetrics();
        
        // Récupération des métriques réelles du tenant (via le DailyConsolidationService)
        const today = new Date().toISOString().slice(0, 10);
        const report = await Nexus.adapter.get<{ 
            foodCostPercentage: number; 
            laborCostPercentage: number;
            averageTicketInCents: number; 
        }>(`tenants/${tenantId}/flashReports/${today}`);
        
        const tenantMetrics = {
            foodCostPct: report?.foodCostPercentage || 0,
            laborCostPct: report?.laborCostPercentage || 0,
            ticketAOV: report?.averageTicketInCents || 0
        };

        return {
            tenantId,
            foodCostPct: tenantMetrics.foodCostPct,
            foodCostDelta: Number((tenantMetrics.foodCostPct - fleetMetrics.medianFoodCostPct).toFixed(2)),
            
            laborCostPct: tenantMetrics.laborCostPct,
            laborCostDelta: Number((tenantMetrics.laborCostPct - fleetMetrics.medianLaborCostPct).toFixed(2)),
            
            ticketAOV: tenantMetrics.ticketAOV,
            ticketAOVDelta: tenantMetrics.ticketAOV - fleetMetrics.medianTicketAOV,
        };
    }
}
