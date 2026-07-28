import type { IPaymentProvider } from './types';
import { StripePaymentProvider } from './providers/StripePaymentProvider';

const PROVIDER_REGISTRY: Record<string, () => IPaymentProvider> = {
    stripe: () => new StripePaymentProvider(),
};

export const DEFAULT_PAYMENT_PROVIDER = 'stripe';

export class PaymentProviderFactory {
    static get(providerId?: string | null): IPaymentProvider {
        const id = (
            providerId ??
            process.env.PAYMENT_DEFAULT_PROVIDER ??
            DEFAULT_PAYMENT_PROVIDER
        ).toLowerCase();
        const factory = PROVIDER_REGISTRY[id];
        if (!factory) {
            throw new Error(
                `Provider paiement inconnu : "${id}". Disponibles : ${Object.keys(PROVIDER_REGISTRY).join(', ')}`
            );
        }
        return factory();
    }

    static list(): string[] {
        return Object.keys(PROVIDER_REGISTRY);
    }
}
