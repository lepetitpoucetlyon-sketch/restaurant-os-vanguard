import type { ITimeclockProvider } from './types';
import { ManualTimeclockProvider } from './providers/ManualTimeclockProvider';
import { QrCodeTimeclockProvider } from './providers/QrCodeTimeclockProvider';

const PROVIDER_REGISTRY: Record<string, () => ITimeclockProvider> = {
    manual:  () => new ManualTimeclockProvider(),
    qrcode:  () => new QrCodeTimeclockProvider(),
};

export const DEFAULT_TIMECLOCK_PROVIDER = 'manual';

export class TimeclockProviderFactory {
    static get(providerId?: string | null): ITimeclockProvider {
        const id = (
            providerId ??
            process.env.TIMECLOCK_DEFAULT_PROVIDER ??
            DEFAULT_TIMECLOCK_PROVIDER
        ).toLowerCase();
        const factory = PROVIDER_REGISTRY[id];
        if (!factory) {
            throw new Error(
                `Provider pointage inconnu : "${id}". Disponibles : ${Object.keys(PROVIDER_REGISTRY).join(', ')}`
            );
        }
        return factory();
    }

    static list(): string[] {
        return Object.keys(PROVIDER_REGISTRY);
    }
}
