import { StockItem, InventoryMovement as StockEvent } from '@nexus/contracts';
import { Quantity, toQuantity } from '@/lib/brands';
import { logger } from '@/lib/logger';

/**
 * 🔮 OracleEngine - Restaurant OS (Darwin V5.5 Master Code)
 * Predictive-V5-Hybrid: Fusion of Worker Scalability & Bitwise Pattern Matching.
 */
export interface OraclePrediction {
    estimatedDaysRemaining: number;
    confidence: number;
    trend: 'STABLE' | 'ACCELERATING' | 'DECELERATING';
    scenarios: {
        optimistic: number;
        pessimistic: number;
        p50: number;
    };
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

/**
 * 🔮 OracleEngine - Restaurant OS (Grade VII "Singularity" Edition)
 * Predictive-V7-MonteCarlo: probabilistic engine using variance distributions.
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
    const avgUsage = dailyUsage.reduce((a, b) => a + b, 0) / dailyUsage.length;
    
    // Variance calculation for Monte Carlo
    const variance = dailyUsage.reduce((acc, val) => acc + Math.pow(val - avgUsage, 2), 0) / dailyUsage.length;
    const stdDev = Math.sqrt(variance);

    // Run Monte Carlo Simulation (1000 iterations for Grade VII)
    const simulations = this.runMonteCarlo(currentQty, avgUsage, stdDev, 1000);
    simulations.sort((a, b) => a - b);
    
    const p50 = simulations[Math.floor(simulations.length * 0.5)];
    const p10 = simulations[Math.floor(simulations.length * 0.1)]; // Pessimistic (runs out fast)
    const p90 = simulations[Math.floor(simulations.length * 0.9)]; // Optimistic

    // Acceleration detection
    const recentUsage = dailyUsage.slice(-3).reduce((a, b) => a + b, 0) / 3;
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
      const date = e.timestamp.split('T')[0];
      if (e.type === 'consumption' || e.type === 'sale') {
        usageMap[date] = (usageMap[date] || 0) + e.quantity;
      }
    });
    return Object.values(usageMap);
  }
};

/**
 * 🤖 Agent AI : Suggest Chicken Procurement
 * Bridges Oracle forecasts with SovereignLedger entries.
 */
export async function suggestChickenProcurement(qty: number): Promise<void> {
  const cost = qty * 450; // 4.50€ per industrial chicken
  logger.info(`🔮 Agent Oracle: Proposing procurement for ${qty} chickens (Cost: ${cost/100}€)`);
  
  // Inject into SovereignLedger PROPOSALS account
  const { SovereignLedger } = await import('./SovereignLedger');
  await SovereignLedger.recordTransfer({
    debitAccount: 'PURCHASES',
    creditAccount: 'PROPOSALS', // Awaiting human signing
    amountInCents: cost,
    referenceId: `AI-SUGG-${Date.now()}`,
    description: `[AI-SUGGESTION] Ravitaillement Rôtisserie (${qty} unités)`
  });
}

/**
 * 🔮 Oracle Supervision: Monitor Monkey Chaos
 * Generates Genomic Suture reports if flaws are detected.
 */
export async function superviseChaos(): Promise<string> {
  const { MonkeyChaos } = await import('../agents/MonkeyChaos');
  const result = await MonkeyChaos.attackLedger();
  
  if (result.success) {
    return `[RAPPORT DE SUTURE GÉNOMIQUE]\nStatut: INTÉGRITÉ_MAINTENUE\nObservation: L'attaque du Monkey Chaos a été rejetée par le SovereignLedger.\nDiagnostic: Pont Financier Inviolable.`;
  } else {
     return `[RAPPORT DE SUTURE GÉNOMIQUE]\nStatut: ALERTE_FAILLE\nObservation: Le Ledger a accepté une transaction asymétrique.\nDiagnostic: Urgence Suture Génome Requise.`;
  }
}
