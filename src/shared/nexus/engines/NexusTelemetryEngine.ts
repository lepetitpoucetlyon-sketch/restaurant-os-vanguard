/* eslint-disable no-restricted-imports -- aggregator: must use deep paths for cycle prevention */
import { ChaosMonkey } from '@/modules/intelligence/ia/resilience/ChaosMonkey';
import { ResilienceSlayer } from '@/modules/intelligence/ia/resilience/ResilienceSlayer';
import { Sentry } from '@/lib/sentry';

/**
 * 📡 NexusTelemetryEngine
 * Responsibility: System observation, fault injection, and Sentry context mapping.
 */
export class NexusTelemetryEngine {
    static initSession(tenantId: string) {
        if (typeof window !== 'undefined') {
            Sentry.setTag("empire.domain", tenantId);
            Sentry.setTag("nexus.grade", "X+++");
            Sentry.setContext("Sovereign Session", {
                activeTenant: tenantId,
                initializedAt: new Date().toISOString()
            });
        }
    }

    static mountChaosMonkeys() {
        if (typeof window !== 'undefined') {
            (window as unknown as Record<string, unknown>).awakenTheMonkey = (intensity?: number) => {
                ChaosMonkey.start(intensity);
                ResilienceSlayer.start();
            };
            (window as unknown as Record<string, unknown>).silenceTheMonkey = () => {
                ChaosMonkey.stop();
                ResilienceSlayer.stop();
            };
        }
    }

    static unmountChaosMonkeys() {
        ChaosMonkey.stop();
        ResilienceSlayer.stop();
    }
}
