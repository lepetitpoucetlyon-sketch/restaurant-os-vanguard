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
        // Simulation d'un appel à l'agrégateur de flotte (qui a le droit de lire tous les tenants)
        return {
            medianFoodCostPct: 28.5,
            medianLaborCostPct: 32.0,
            medianTicketAOV: 2450 // 24.50€
        };
    }

    /**
     * Compare le tenant actuel à la flotte.
     */
    static async compareTenantToFleet(tenantId: string): Promise<TenantBenchmarkComparison> {
        logger.info(`[Benchmarking] Calcul du benchmark pour le tenant ${tenantId}`);
        
        const fleetMetrics = await this.getFleetMedianMetrics();
        
        // Simulation des métriques du tenant (normalement calculées via DailyConsolidationService)
        const tenantMetrics = {
            foodCostPct: 30.2,
            laborCostPct: 31.5,
            ticketAOV: 2200
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
