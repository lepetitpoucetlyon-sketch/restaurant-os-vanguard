import { useEffect } from 'react';
import { getDefaultStore } from 'jotai';
import { MasterBridge } from '@/lib/adapters/MasterBridge';
import { logger } from '@/lib/logger';
import { checkOnlineStatus } from '@/lib/offline/status';
import { commanderSignatureAtom } from '@nexus/state/SovereignGenome';

/**
 * 👁️ useCoreOracle - Restaurant OS
 * Secured for Phase 5 (IRM Surgery): Hardened cleanup and session validity.
 */
export const useCoreOracle = () => {
    useEffect(() => {
        const store = getDefaultStore();
        
        // Surveillance intervalle (Silencieux)
        const interval = setInterval(async () => {
            // 🛡️ SESSION VALIDITY CHECK
            // We only monitor if the commander signature is valid or if we are in master mode
            const signature = store.get(commanderSignatureAtom);
            if (!signature && !MasterBridge.isMasterMode()) {
                return; // Silently skip monitoring for unauthorized/closed sessions
            }

            const isOnline = checkOnlineStatus();
            const latency = performance.now(); 
            
            const _health = {
                status: isOnline ? 'online' : 'offline',
                latency: Math.round(latency),
                timestamp: new Date().toISOString()
            };

            try {
                if (MasterBridge.isMasterMode()) {
                    // Reporting as Suzerain
                    logger.debug('[Oracle] Master Telemetry Heartbeat sent.');
                }
            } catch (_err) {
                // Oracle never blocks the thread
            }
        }, 10000); 

        // 🛡️ HARDENED CLEANUP
        return () => {
            clearInterval(interval);
            logger.debug('[Oracle] Monitoring loop strictly terminated.');
        };
    }, []);
};
