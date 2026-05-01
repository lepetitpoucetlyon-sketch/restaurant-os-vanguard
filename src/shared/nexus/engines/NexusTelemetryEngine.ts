import { ChaosMonkey } from '@domain/services/ChaosMonkey';
import { ResilienceSlayer } from '@domain/services/ResilienceSlayer';

/**
 * 📡 NexusTelemetryEngine
 * Responsibility: System observation, fault injection, and Sentry context mapping.
 */
export class NexusTelemetryEngine {
    static initSession(tenantId: string) {
        if (typeof window !== 'undefined') {
            import('@sentry/nextjs').then(Sentry => {
                Sentry.setTag("empire.domain", tenantId);
                Sentry.setTag("nexus.grade", "X+++");
                Sentry.setContext("Sovereign Session", {
                    activeTenant: tenantId,
                    initializedAt: new Date().toISOString()
                });
            }).catch(() => {
                console.warn('[Telemetry] Sentry not loaded.');
            });
        }
    }

    static mountChaosMonkeys() {
        if (typeof window !== 'undefined') {
            (window as any).awakenTheMonkey = (intensity?: number) => {
                ChaosMonkey.start(intensity);
                ResilienceSlayer.start();
            };
            (window as any).silenceTheMonkey = () => {
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
