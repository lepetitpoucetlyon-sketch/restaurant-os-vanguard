import { logger } from '@/lib/axiom';
import { EmpireInstance } from '@/domain/types/empire';

/**
 * FleetCommander - Domain Service for Multi-Instance Management
 */
export const FleetCommander = {
  /**
   * Evaluates the health score of an instance based on alerts and metrics
   */
  evaluateHealth(activeAlerts: number, errorRate: number, uptime: number): number {
    let score = 100;
    score -= activeAlerts * 5;
    score -= errorRate * 10;
    if (uptime < 99) score -= (99 - uptime) * 2;
    
    const finalScore = Math.max(0, Math.min(100, score));
    
    if (finalScore < 70) {
      logger.error('FleetCommander: Critical health score detected for instance', { score: finalScore });
    }
    
    return finalScore;
  },

  /**
   * Aggregates revenue across the entire fleet
   */
  calculateTotalRevenue(instances: EmpireInstance[]): number {
    return instances.reduce((total, inst) => total + inst.metrics.dailyRevenue, 0);
  },

  /**
   * Identifies the top performing instances
   */
  getTopPerformers(instances: EmpireInstance[], limit: number = 3): EmpireInstance[] {
    return [...instances]
      .sort((a, b) => b.metrics.dailyRevenue - a.metrics.dailyRevenue)
      .slice(0, limit);
  },

  /**
   * Generates a sync payload for global configuration push
   */
  generateGlobalSyncPayload(baseConfig: Record<string, unknown>, overrides: Record<string, unknown>): Record<string, unknown> {
    logger.info('FleetCommander: Generating global sync payload', { overrideKeys: Object.keys(overrides) as any });
    return {
      ...baseConfig,
      ...overrides,
      pushedAt: new Date().toISOString(),
      source: 'MCC_COMMANDER'
    };
  }
};
