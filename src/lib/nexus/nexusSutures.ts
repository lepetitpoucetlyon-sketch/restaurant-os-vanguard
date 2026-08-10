import { getDefaultStore } from 'jotai';
import {
    reservationStatsAtom
} from '@/bootstrap/store/pillars/commerce';
import {
    nexusPulseAtom
} from '@/bootstrap/store/pillars/core';

import { expectedCoversAtom } from '@shared/nexus/state/SovereignGenome';
import { logger } from '@/lib/logger';


/**
 * 🛰️ NexusSutures - Grade X Headless Logic
 * Orchestrates cross-domain reactive links without UI dependencies.
 */
export const NexusSutures = {
    private_unsubscribe: [] as (() => void)[],

    init() {
        const store = getDefaultStore();

        // 1. 📈 SUTURE : COMMERCE -> LOGISTICS (Forecasting)
        // Subscribes to reservation stats to update expected covers automatically.
        const unsubCommerce = store.sub(reservationStatsAtom, () => {
            const stats = store.get(reservationStatsAtom);
            if (stats?.todayCovers !== undefined) {
                const currentExpected = store.get(expectedCoversAtom);
                if (currentExpected !== stats.todayCovers) {
                    store.set(expectedCoversAtom, stats.todayCovers);
                    logger.debug(`[Suture] Expected covers updated to ${stats.todayCovers} via Commerce Reflex.`);
                }
            }
        });
        this.private_unsubscribe.push(unsubCommerce);

        // 2. 📡 SUTURE : SIGNAL BUS LISTENER
        // Potential for more complex pulses here
        const unsubPulse = store.sub(nexusPulseAtom, () => {
            const pulse = store.get(nexusPulseAtom);
            if (!pulse) return;
            
            // Example of a global logging/telemetry reflex
            if (pulse.type.startsWith('CRITICAL_')) {
                logger.warn(`[NexusSutures] Critical Pulse detected: ${pulse.type}`, pulse.payload);
            }
        });
        this.private_unsubscribe.push(unsubPulse);
    },

    stop() {
        this.private_unsubscribe.forEach((unsub: () => void) => unsub());
        this.private_unsubscribe = [];
    }
};
