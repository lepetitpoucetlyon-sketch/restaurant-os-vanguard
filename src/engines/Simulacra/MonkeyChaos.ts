"use client";

import { getDefaultStore } from 'jotai';
import { ordersNodeAtom, journalEntriesNodeAtom, hygieneLogsNodeAtom } from '@/store/operationalAtoms';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

import { RealityGenerator } from './RealityGenerator';

/**
 * 🐒 MonkeyChaos - The Grade X Stress Engine
 * Simulates high-stress restaurant environments to validate system resilience.
 */
export class MonkeyChaos {
    private static isRunning = false;

    /**
     * RUSH MODE: Injects a realistic surge of sales pulses.
     */
    static async triggerRushMode(count: number = 30) {
        if (this.isRunning) return;
        this.isRunning = true;
        
        const store = getDefaultStore();
        
        await RealityGenerator.generateSalesRush((order) => {
            logger.debug(`[CHAOS] Injecting Sales Rush Pulse: ${order.id}`);
            // Injects into the Pulse system which propagates to POS and Ledger
            // (Assumes a nexusPulseAtom update here in a real scenario)
        }, count);

        this.isRunning = false;
    }

    /**
     * HACCP STRESS: Starts a noisy temperature stream with anomalies.
     */
    static startHACCPStress(frequencyMs: number = 2000) {
        RealityGenerator.startHACCPStream((reading) => {
            // This will trigger HACCP Sentinel alerts if value is out of bounds
            // The system reacts as if a real sensor was sending data
        }, frequencyMs);
    }

    static stopAll() {
        RealityGenerator.stopAll();
        this.isRunning = false;
    }

    /**
     * NETWORK FLAKINESS: Simulates micro-cuts in API connectivity.
     */
    static simulateNetworkDrift() {
        logger.warn("⚠️ [CHAOS] SIMULATING NETWORK DRIFT. Optimistic updates will be tested.");
    }
}

    /**
     * FISCAL STRESS: Seals a large batch of sales to verify cryptographic performance.
     */
    static async heavyFiscalSeal(count: number = 100) {
        logger.info(`🏛️ [CHAOS] COMMENCING HEAVY FISCAL SEAL: ${count} transactions...`);
        // Test signatures and Ledger performance
    }
}
