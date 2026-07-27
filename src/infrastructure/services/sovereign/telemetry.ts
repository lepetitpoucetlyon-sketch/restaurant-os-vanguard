import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

export interface TelemetryThresholds {
    warning: number;
    critical: number;
}

export const TELEMETRY_THRESHOLDS = {
    JSErrors: {
        warning: 5, // 5%
        critical: 10 // 10%
    },
    LatencyMs: {
        warning: 1000, // 1s
        critical: 3000 // 3s
    },
    ApiFailures: {
        warning: 2, // 2%
        critical: 5 // 5%
    }
};

export async function logCorrectiveAction(action: string, module: string, previousState: boolean, newState: boolean, reason: string) {
    try {
        const logId = Nexus.adapter.generateId('mcc/sam_actions/logs');
        await Nexus.adapter.create(`mcc/sam_actions/logs/${logId}`, {
            action,
            module,
            previousState,
            newState,
            reason,
            timestamp: Nexus.adapter.serverTimestamp(),
            protocol: 'PHYSICAL_ACTIVE'
        });
        logger.info(`[SOVEREIGN_TELEMETRY] Logged corrective action: ${action}`);
    } catch (err) {
        console.error('[SOVEREIGN_TELEMETRY] Failed to log corrective action', err);
    }
}
