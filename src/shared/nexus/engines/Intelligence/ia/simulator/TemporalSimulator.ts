import { logger } from "@/lib/logger";
import { Nexus } from "@/lib/nexus/NexusAdapter";
import { SimulationProfile, SIMULATION_PROFILES } from './SimulationService';

/**
 * 🌀 TemporalSimulator - Grade X Monte-Carlo Engine
 * Handles time-warped simulation of restaurant operations.
 */

export interface SimulationMetrics {
    totalTransactions: number;
    totalRevenueCents: number;
    errorCount: number;
    stockAlerts: number;
    activeConvives: number;
    burnoutIndex: number;
}

/**
 * 🌀 TemporalSimulator - Grade X Orchestrator
 * Manages the off-thread SimulationWorker and bridges metrics to the UI.
 */
export class TemporalSimulator {
    private isRunning: boolean = false;
    private worker: Worker | null = null;
    private timeMultiplier: number = 1;
    private forkId: string;
    
    public metrics: SimulationMetrics = {
        totalTransactions: 0,
        totalRevenueCents: 0,
        errorCount: 0,
        stockAlerts: 0,
        activeConvives: 0,
        burnoutIndex: 0
    };

    constructor(
        private tenantId: string = 'bistrolyon'
    ) {
        this.forkId = `sim_${Date.now()}`;
    }

    async initialize() {
        await Nexus.activateSimulacraMode(this.forkId);
        logger.info(`[Simulator] Temporal shell synchronized for tenant: ${this.tenantId}`);
    }

    start(profile: SimulationProfile = 'DEFAULT', multiplier: number = 5) {
        if (this.isRunning) return;
        this.isRunning = true;
        this.timeMultiplier = multiplier;
        
        const config = SIMULATION_PROFILES[profile];
        
        // Spawn Grade X Worker
        this.worker = new Worker(new URL('./Simulation.worker.ts', import.meta.url));
        
        this.worker.onmessage = (e) => {
            if (e.data.type === 'METRICS_UPDATE') {
                this.metrics = {
                    ...e.data.metrics,
                    // Calculate burnout index in main thread or worker? 
                    // Let's keep common metrics in worker, derived in main if needed.
                    burnoutIndex: Math.min(100, (e.data.metrics.activeConvives / (config.staffCount * 4)) * 100)
                };
            }
        };

        this.worker.postMessage({
            action: 'start',
            config: {
                arrivalRate: config.maxVol, // Simple mapping for now
                staffCount: config.staffCount,
                chaosProbability: config.chaosProbability,
                timeMultiplier: this.timeMultiplier
            }
        });

        logger.info(`[Simulator] Temporal flow initiated (Off-Thread). Profile: ${profile}`);
    }

    stop() {
        if (this.worker) {
            this.worker.postMessage({ action: 'stop' });
            this.worker.terminate();
            this.worker = null;
        }
        this.isRunning = false;
        Nexus.deactivateSimulacraMode();
        logger.info('[Simulator] Temporal flow suspended. Reality restored.');
    }

    getMetrics() { return this.metrics; }
    getForkId() { return this.forkId; }
}

export const simulator = new TemporalSimulator();
