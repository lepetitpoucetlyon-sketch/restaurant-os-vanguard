import type { IDeliveryProvider } from './types';
import { ClickCollectProvider } from './providers/ClickCollectProvider';
import { UberEatsProvider } from './providers/UberEatsProvider';

const PROVIDER_REGISTRY: Record<string, () => IDeliveryProvider> = {
    clickcollect: () => new ClickCollectProvider(),
    ubereats:     () => new UberEatsProvider(),
};

export const DEFAULT_DELIVERY_PROVIDER = 'clickcollect';

export class DeliveryProviderFactory {
    static get(providerId?: string | null): IDeliveryProvider {
        const id = (
            providerId ??
            process.env.DELIVERY_DEFAULT_PROVIDER ??
            DEFAULT_DELIVERY_PROVIDER
        ).toLowerCase();
        const factory = PROVIDER_REGISTRY[id];
        if (!factory) {
            throw new Error(
                `Provider livraison inconnu : "${id}". Disponibles : ${Object.keys(PROVIDER_REGISTRY).join(', ')}`
            );
        }
        return factory();
    }

    static list(): string[] {
        return Object.keys(PROVIDER_REGISTRY);
    }
}
