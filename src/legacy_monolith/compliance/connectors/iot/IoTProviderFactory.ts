import type { IIoTProvider } from './types';
import { MqttProvider } from './providers/MqttProvider';
import { WebhookIoTProvider } from './providers/WebhookIoTProvider';

const PROVIDER_REGISTRY: Record<string, () => IIoTProvider> = {
    mqtt:    () => new MqttProvider(),
    webhook: () => new WebhookIoTProvider(),
};

export const DEFAULT_IOT_PROVIDER = 'webhook';

export class IoTProviderFactory {
    static get(providerId?: string | null): IIoTProvider {
        const id = (
            providerId ??
            process.env.IOT_DEFAULT_PROVIDER ??
            DEFAULT_IOT_PROVIDER
        ).toLowerCase();
        const factory = PROVIDER_REGISTRY[id];
        if (!factory) {
            throw new Error(
                `Provider IoT inconnu : "${id}". Disponibles : ${Object.keys(PROVIDER_REGISTRY).join(', ')}`
            );
        }
        return factory();
    }

    static list(): string[] {
        return Object.keys(PROVIDER_REGISTRY);
    }
}
