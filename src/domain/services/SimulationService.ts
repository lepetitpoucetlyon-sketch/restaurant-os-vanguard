import { Order, StockItem, Ingredient, InventoryMovement, FiscalSeal, User } from '@/types';
import { FiscalEngine } from './FiscalEngine';
import { StockEngine } from './StockEngine';
import { logger } from '@/lib/logger';
import { Nexus } from '@/lib/nexus/NexusAdapter';

/**
 * 🌀 SimulationEngine - Grade X "Quantique"
 * Moteur de simulation stochastique haute performance.
 */
export type SimulationMode = 'EMPIRE' | 'CHAOS';
export type SimulationProfile = 'PIZZERIA_RUSH' | 'FINE_DINING_CALM' | 'SUMMER_PEAK' | 'DEFAULT';

interface ProfileConfig {
    minVol: number;
    maxVol: number;
    chaosProbability: number;
    avgProductCount: number;
    laborCostPerHour: number;
    staffCount: number;
}

const SIMULATION_PROFILES: Record<SimulationProfile, ProfileConfig> = {
    PIZZERIA_RUSH: { minVol: 80, maxVol: 150, chaosProbability: 0.05, avgProductCount: 4, laborCostPerHour: 4500, staffCount: 4 },
    FINE_DINING_CALM: { minVol: 15, maxVol: 30, chaosProbability: 0.15, avgProductCount: 2, laborCostPerHour: 8500, staffCount: 6 },
    SUMMER_PEAK: { minVol: 120, maxVol: 250, chaosProbability: 0.08, avgProductCount: 6, laborCostPerHour: 6500, staffCount: 10 },
    DEFAULT: { minVol: 40, maxVol: 100, chaosProbability: 0.1, avgProductCount: 3, laborCostPerHour: 5000, staffCount: 3 }
};

export interface MonteCarloResult {
    timelineId: string;
    metrics: {
        totalRevenue: number;
        totalFoodCost: number;
        totalLaborCost: number;
        netProfit: number;
        burnoutIndex: number; // 0 to 100
        anomalyCount: number;
    };
    days: number;
}

export const SimulationService = {
    /**
     * Box-Muller transform for realistic distribution
     */
    generateGaussian(min: number, max: number): number {
        const u = 1 - Math.random();
        const v = Math.random();
        const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        const mean = (min + max) / 2;
        const stdDev = (max - min) / 6;
        return Math.max(min, Math.min(max, z * stdDev + mean));
    },

    /**
     * Simulation d'une journée complète avec calcul financier et burnout.
     */
    async simulateDay(
        date: Date, 
        mode: SimulationMode, 
        profileId: SimulationProfile = 'DEFAULT',
        context: {
            ingredients: Ingredient[],
            stockItems: StockItem[],
            lastSeal?: FiscalSeal
        }
    ): Promise<MonteCarloResult['metrics'] & { orders: Order[] }> {
        const metrics = {
            totalRevenue: 0,
            totalFoodCost: 0,
            totalLaborCost: 0,
            netProfit: 0,
            burnoutIndex: 0,
            anomalyCount: 0
        };

        const config = SIMULATION_PROFILES[profileId];
        const dailyVolume = Math.round(this.generateGaussian(config.minVol, config.maxVol));
        
        // Labor Cost Calculation
        metrics.totalLaborCost = config.laborCostPerHour * 10 * config.staffCount; // 10h workday

        // Peak Intensity vs Staff Count (Burnout Index)
        const intensity = dailyVolume / config.staffCount;
        metrics.burnoutIndex = Math.min(100, (intensity / 15) * 100);

        const orders: Order[] = [];
        let currentLastSeal = context.lastSeal;

        for (let i = 0; i < dailyVolume; i++) {
            const isChaos = mode === 'CHAOS' && Math.random() < config.chaosProbability;
            if (isChaos) metrics.anomalyCount++;

            // Simple Order Logic
            const orderId = `sim_${profileId}_${Date.now()}_${i}`;
            const revenue = Math.round(this.generateGaussian(1500, 4500)); // ~15€ to 45€
            metrics.totalRevenue += revenue;
            metrics.totalFoodCost += Math.round(revenue * 0.28); // 28% food cost baseline

            // Record virtual order
            const order: Order = {
                id: orderId,
                tableId: 'T1',
                tableNumber: '1',
                serverName: 'Virtual Agent',
                timestamp: date,
                items: [],
                totalInCents: revenue,
                status: 'paid',
                customerName: 'Simulated'
            };

            await Nexus.adapter.set(Nexus.getTenantPath(`orders/${orderId}`), order);
            orders.push(order);
        }

        metrics.netProfit = metrics.totalRevenue - metrics.totalFoodCost - metrics.totalLaborCost;

        return { ...metrics, orders };
    },

    /**
     * 🎲 MONTE CARLO LOOP
     * Exécute N simulations pour dégager des tendances statistiques.
     */
    async runMonteCarlo(
        days: number,
        iterations: number,
        profileId: SimulationProfile,
        mode: SimulationMode
    ): Promise<MonteCarloResult[]> {
        const results: MonteCarloResult[] = [];

        for (let iter = 0; iter < iterations; iter++) {
            const timelineId = `timeline_${Date.now()}_${iter}`;
            
            // On entre dans une réalité parallèle pour cette itération
            await Nexus.activateSimulacraMode(timelineId);

            const timelineMetrics = {
                totalRevenue: 0,
                totalFoodCost: 0,
                totalLaborCost: 0,
                netProfit: 0,
                burnoutIndex: 0,
                anomalyCount: 0
            };

            for (let d = 0; d < days; d++) {
                const day = await this.simulateDay(new Date(), mode, profileId, { 
                    ingredients: [], // Placeholder
                    stockItems: []   // Placeholder
                });
                
                timelineMetrics.totalRevenue += day.totalRevenue;
                timelineMetrics.totalFoodCost += day.totalFoodCost;
                timelineMetrics.totalLaborCost += day.totalLaborCost;
                timelineMetrics.anomalyCount += day.anomalyCount;
                timelineMetrics.burnoutIndex = Math.max(timelineMetrics.burnoutIndex, day.burnoutIndex);
            }

            timelineMetrics.netProfit = timelineMetrics.totalRevenue - timelineMetrics.totalFoodCost - timelineMetrics.totalLaborCost;

            results.push({
                timelineId,
                metrics: timelineMetrics,
                days
            });

            // On sort de la réalité parallèle pour préparer la suivante
            Nexus.deactivateSimulacraMode();
        }

        return results;
    }
};
