import { logger } from '@/lib/logger';

export interface TenantBenchmarkData {
  tenantId: string;
  foodCostRatio: number; // e.g. 28.5%
  laborCostRatio: number; // e.g. 34.0%
  averageCheckInMicrounits: number;
}

export interface FleetBenchmarkSummary {
  totalTenantsAudited: number;
  averageFoodCostRatio: number;
  averageLaborCostRatio: number;
  averageCheckInMicrounits: number;
  topPerformersTenantIds: string[];
}

/**
 * 🌐 FleetBenchmarkingEngine (Item 8.3)
 * Moteur de benchmark anonymisé inter-établissements pour le Cockpit MCC.
 * Calcule les moyennes de la flotte (Food Cost, Labor Cost, Ticket Moyen) et identifie les établissements leaders.
 */
export class FleetBenchmarkingEngine {
  static computeFleetSummary(fleetData: TenantBenchmarkData[]): FleetBenchmarkSummary {
    if (fleetData.length === 0) {
      return {
        totalTenantsAudited: 0,
        averageFoodCostRatio: 0,
        averageLaborCostRatio: 0,
        averageCheckInMicrounits: 0,
        topPerformersTenantIds: [],
      };
    }

    const totalFoodCost = fleetData.reduce((sum, t) => sum + t.foodCostRatio, 0);
    const totalLaborCost = fleetData.reduce((sum, t) => sum + t.laborCostRatio, 0);
    const totalCheck = fleetData.reduce((sum, t) => sum + t.averageCheckInMicrounits, 0);

    const avgFoodCost = Number((totalFoodCost / fleetData.length).toFixed(2));
    const avgLaborCost = Number((totalLaborCost / fleetData.length).toFixed(2));
    const avgCheck = Math.round(totalCheck / fleetData.length);

    // Top performers: Food Cost <= avgFoodCost AND Labor Cost <= avgLaborCost
    const topPerformers = fleetData
      .filter(t => t.foodCostRatio <= avgFoodCost && t.laborCostRatio <= avgLaborCost)
      .map(t => t.tenantId);

    logger.info(`[FleetBenchmarkingEngine] Flotte MCC (${fleetData.length} tenants) -> Avg FC: ${avgFoodCost}%, Avg LC: ${avgLaborCost}%`);

    return {
      totalTenantsAudited: fleetData.length,
      averageFoodCostRatio: avgFoodCost,
      averageLaborCostRatio: avgLaborCost,
      averageCheckInMicrounits: avgCheck,
      topPerformersTenantIds: topPerformers,
    };
  }
}
