import type { InventoryMovement as StockEvent } from '@nexus/contracts';
import type { Quantity } from '@/lib/branding/brands';
import { logger } from '@/lib/logger';
import { StockOracleRegistry, type OraclePrediction } from '@/kernel/contracts';

export type { OraclePrediction };

/**
 * 🔮 OracleEngine - Restaurant OS (Darwin V5.5 Master Code)
 * Predictive-V5-Hybrid: Fusion of Worker Scalability & Bitwise Pattern Matching.
 */
export const OracleEngine = {

  
  /**
   * Predicts stockout date for a given ingredient using recursive pattern match and Monte Carlo.
   */
  async predictStockout(itemId: string, events: StockEvent[], currentQty: Quantity): Promise<OraclePrediction> {
    
    if (events.length < 5) {
      return { 
        estimatedDaysRemaining: 99, 
        confidence: 0.1, 
        trend: 'STABLE',
        scenarios: { optimistic: 99, pessimistic: 99, p50: 99 },
        riskLevel: 'LOW'
      };
    }

    const dailyUsage = this.calculateBitwiseDailyUsage(events);
    const avgUsage = dailyUsage.reduce((a: number, b: number) => a + b, 0) / dailyUsage.length;
    
    // Variance calculation for Monte Carlo
    const variance = dailyUsage.reduce((acc: number, val: number) => acc + Math.pow(val - avgUsage, 2), 0) / dailyUsage.length;
    const stdDev = Math.sqrt(variance);

    // Run Monte Carlo Simulation (1000 iterations for Grade VII)
    const simulations = this.runMonteCarlo(currentQty, avgUsage, stdDev, 1000);
    simulations.sort((a: number, b: number) => a - b);
    
    const p50 = simulations[Math.floor(simulations.length * 0.5)];
    const p10 = simulations[Math.floor(simulations.length * 0.1)]; // Pessimistic (runs out fast)
    const p90 = simulations[Math.floor(simulations.length * 0.9)]; // Optimistic

    // Acceleration detection
    const recentUsage = dailyUsage.slice(-3).reduce((a: number, b: number) => a + b, 0) / 3;
    const acceleration = recentUsage / (avgUsage || 1);

    let trend: 'STABLE' | 'ACCELERATING' | 'DECELERATING' = 'STABLE';
    if (acceleration > 1.2) trend = 'ACCELERATING';
    if (acceleration < 0.8) trend = 'DECELERATING';

    const riskLevel = p10 < 3 ? 'HIGH' : (p10 < 7 ? 'MEDIUM' : 'LOW');

    return {
      estimatedDaysRemaining: Math.round(p50),
      confidence: Math.min(0.95, (events.length / 50) * (1 - (stdDev / (avgUsage || 1)))),
      trend,
      scenarios: {
        optimistic: Math.round(p90),
        pessimistic: Math.round(p10),
        p50: Math.round(p50)
      },
      riskLevel
    };
  },

  /**
   * Probabilistic Kernel - Grade VII
   */
  runMonteCarlo(qty: number, avgUsage: number, stdDev: number, iterations: number): number[] {
    const results: number[] = [];
    for (let i = 0; i < iterations; i++) {
        let remaining = qty;
        let days = 0;
        // Max 180 days to prevent infinite loops in weird distributions
        while (remaining > 0 && days < 180) {
            // Box-Muller transform for Gaussian noise
            const u1 = Math.random();
            const u2 = Math.random();
            const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
            
            const simulatedUsage = Math.max(0, avgUsage + z * stdDev);
            remaining -= simulatedUsage;
            days++;
        }
        results.push(days);
    }
    return results;
  },

  /**
   * Transforms raw events into a bitwise intensity map.
   */
  calculateBitwiseDailyUsage(events: StockEvent[]): number[] {
    const usageMap: Record<string, number> = {};
    events.forEach(e => {
      const date = (e.performedAt as string).split('T')[0];
      if (e.type === 'consumption' || e.type === 'sale') {
        usageMap[date] = (usageMap[date] || 0) + e.quantity;
      }
    });
    return Object.values(usageMap);
  }
};

// Auto-enregistrement de l'implémentation IA dans le registre universel (ADR-015)
StockOracleRegistry.register(OracleEngine);

/**

 * 🤖 Agent AI : Suggest Procurement
 * Bridges Oracle forecasts with a finance.transfer_proposed event
 * (consumed by finance module via NexusEventBus handler).
 */
export async function suggestChickenProcurement(qty: number, tenantId: string): Promise<void> {
  const cost = qty * 450; // 4.50€ per unit
  logger.info(`🔮 Agent Oracle: Proposing procurement for ${qty} units (Cost: ${cost/100}€)`);

  const { NexusEventBus } = await import('@/shared/eventBus/NexusEventBus');
  await NexusEventBus.emit('finance.transfer_proposed', {
    v: 1,
    tenantId,
    debitAccount: 'PURCHASES',
    creditAccount: 'PROPOSALS',
    amountInCents: cost,
    referenceId: `AI-SUGG-${Date.now()}`,
    description: `[AI-SUGGESTION] Approvisionnement IA (${qty} unités)`,
    source: 'OracleEngine',
  });
}

/**
 * 🔮 Oracle Supervision: Monitor Monkey Chaos
 * Generates Genomic Suture reports if flaws are detected.
 */
export async function superviseChaos(tenantId: string): Promise<string> {
  const { MonkeyChaos } = await import('../ia/resilience/MonkeyChaos');
  const result = await MonkeyChaos.attackLedger(tenantId);
  
  if (result.success) {
    return `[RAPPORT DE SUTURE GÉNOMIQUE]\nStatut: INTÉGRITÉ_MAINTENUE\nObservation: L'attaque du Monkey Chaos a été rejetée par le SovereignLedger.\nDiagnostic: Pont Financier Inviolable.`;
  } else {
     return `[RAPPORT DE SUTURE GÉNOMIQUE]\nStatut: ALERTE_FAILLE\nObservation: Le Ledger a accepté une transaction asymétrique.\nDiagnostic: Urgence Suture Génome Requise.`;
  }
}
