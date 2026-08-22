import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export interface TenantPerformanceMetric {
  tenantId: string;
  clusterCategory: string; // 'bistronomie_lyon', 'fast_casual_paris', 'brasserie_marseille'
  avgTicketInMicrounits: number;
  foodCostRatioPct: number;
  revenuePerStaffHourInMicrounits: number;
}

export interface BenchmarkReport {
  tenantId: string;
  clusterCategory: string;
  avgTicketInMicrounits: number;
  clusterAvgTicketInMicrounits: number;
  foodCostRatioPct: number;
  clusterMedianFoodCostPct: number;
  percentileRank: number; // 0 - 100
}

/**
 * CrossTenantBenchmarkService — Angle mort MCC-A3.
 * Benchmark analytique anonymisé inter-restaurants par cluster géographique et typologie d'établissement (comparaison ticket moyen, food cost ratio, quartiles de performance).
 */
export class CrossTenantBenchmarkService {
  static computeBenchmark(
    tenantMetric: TenantPerformanceMetric,
    clusterCohort: TenantPerformanceMetric[]
  ): BenchmarkReport {
    if (clusterCohort.length === 0) {
      return {
        tenantId: tenantMetric.tenantId,
        clusterCategory: tenantMetric.clusterCategory,
        avgTicketInMicrounits: tenantMetric.avgTicketInMicrounits,
        clusterAvgTicketInMicrounits: tenantMetric.avgTicketInMicrounits,
        foodCostRatioPct: tenantMetric.foodCostRatioPct,
        clusterMedianFoodCostPct: tenantMetric.foodCostRatioPct,
        percentileRank: 50,
      };
    }

    const totalTicket = clusterCohort.reduce((sum, m) => sum + m.avgTicketInMicrounits, 0);
    const clusterAvgTicket = Math.round(totalTicket / clusterCohort.length);

    const sortedFoodCosts = clusterCohort.map(m => m.foodCostRatioPct).sort((a, b) => a - b);
    const medianFoodCost = sortedFoodCosts[Math.floor(sortedFoodCosts.length / 2)];

    // Rank by ticket: lower is 0, higher is 100
    const lowerCount = clusterCohort.filter(m => m.avgTicketInMicrounits < tenantMetric.avgTicketInMicrounits).length;
    const percentileRank = Math.round((lowerCount / clusterCohort.length) * 100);

    NexusEventBus.emit('fleet.benchmark_computed', {
      v: 1,
      tenantId: tenantMetric.tenantId,
      clusterCategory: tenantMetric.clusterCategory,
      avgTicketInMicrounits: tenantMetric.avgTicketInMicrounits,
      foodCostRatioPct: tenantMetric.foodCostRatioPct,
      percentileRank,
      computedAt: Date.now(),
    });

    return {
      tenantId: tenantMetric.tenantId,
      clusterCategory: tenantMetric.clusterCategory,
      avgTicketInMicrounits: tenantMetric.avgTicketInMicrounits,
      clusterAvgTicketInMicrounits: clusterAvgTicket,
      foodCostRatioPct: tenantMetric.foodCostRatioPct,
      clusterMedianFoodCostPct: medianFoodCost,
      percentileRank,
    };
  }
}
