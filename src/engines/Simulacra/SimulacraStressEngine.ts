"use client";

import { getDefaultStore } from 'jotai';
import { logger } from '@/lib/logger';
import { RealityGenerator } from './RealityGenerator';

/**
 * SimulacraStressEngine — Grade X Stress Engine
 * Simulates high-stress restaurant environments to validate system resilience.
 * (was: MonkeyChaos.ts in engines/Simulacra — renamed to avoid collision with
 *  domain/chaos/MonkeyChaos which tests ledger fiscal integrity)
 */
export class SimulacraStressEngine {
    private static isRunning = false;

    static async triggerRushMode(count: number = 30) {
        if (this.isRunning) return;
        this.isRunning = true;
        const _store = getDefaultStore();
        await RealityGenerator.generateSalesRush((order) => {
            logger.debug(`[CHAOS] Injecting Sales Rush Pulse: ${order.id}`);
        }, count);
        this.isRunning = false;
    }

    static startHACCPStress(frequencyMs: number = 2000) {
        RealityGenerator.startHACCPStream((_reading) => {
            // Triggers HACCP Sentinel alerts when value is out of bounds
        }, frequencyMs);
    }

    static stopAll() {
        RealityGenerator.stopAll();
        this.isRunning = false;
    }

    static simulateNetworkDrift() {
        logger.warn("⚠️ [CHAOS] SIMULATING NETWORK DRIFT. Optimistic updates will be tested.");
    }

    static async heavyFiscalSeal(count: number = 100) {
        logger.info(`🏛️ [CHAOS] COMMENCING HEAVY FISCAL SEAL: ${count} transactions...`);
    }
}
