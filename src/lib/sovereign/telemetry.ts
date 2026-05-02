import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

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
        const actionsRef = collection(db, 'mcc', 'sam_actions', 'logs');
        await addDoc(actionsRef, {
            action,
            module,
            previousState,
            newState,
            reason,
            timestamp: serverTimestamp(),
            protocol: 'PHYSICAL_ACTIVE'
        });
        console.log(`[SOVEREIGN_TELEMETRY] Logged corrective action: ${action}`);
    } catch (err) {
        console.error('[SOVEREIGN_TELEMETRY] Failed to log corrective action', err);
    }
}
