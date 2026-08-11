/* eslint-disable no-restricted-imports -- aggregator: must use deep paths for cycle prevention */
import { Sentry, configureTenantScope } from '@/lib/sentry';
import type { PlatformVertical } from '@/lib/sentry';

/**
 * 📡 NexusTelemetryEngine
 * Responsibility: System observation, fault injection, and Sentry context mapping.
 */
export class NexusTelemetryEngine {
    static initSession(tenantId: string, vertical: PlatformVertical = 'restaurant') {
        if (typeof window !== 'undefined') {
            configureTenantScope({
                tenantId,
                vertical,
                appMode: (process.env.NEXT_PUBLIC_APP_MODE as 'tenant' | 'mcc') ?? 'tenant',
            });
            Sentry.setContext("Sovereign Session", {
                activeTenant: tenantId,
                vertical,
                initializedAt: new Date().toISOString()
            });
        }
    }

    static async mountChaosMonkeys() {
        if (typeof window !== 'undefined') {
            const { ChaosMonkey } = await import('@/modules/intelligence/ia/resilience/ChaosMonkey');
            const { ResilienceSlayer } = await import('@/modules/intelligence/ia/resilience/ResilienceSlayer');
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

    static async unmountChaosMonkeys() {
        if (typeof window !== 'undefined') {
            const { ChaosMonkey } = await import('@/modules/intelligence/ia/resilience/ChaosMonkey');
            const { ResilienceSlayer } = await import('@/modules/intelligence/ia/resilience/ResilienceSlayer');
            ChaosMonkey.stop();
            ResilienceSlayer.stop();
        }
    }
}
