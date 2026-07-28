import type { IEmailMarketingProvider } from './types';
import { NativeEmailMarketingProvider } from './providers/NativeEmailMarketingProvider';
import { BrevoProvider } from './providers/BrevoProvider';

const PROVIDER_REGISTRY: Record<string, () => IEmailMarketingProvider> = {
    native: () => new NativeEmailMarketingProvider(),
    brevo:  () => new BrevoProvider(),
};

export const DEFAULT_EMAIL_MARKETING_PROVIDER = 'native';

export class EmailMarketingProviderFactory {
    static get(providerId?: string | null): IEmailMarketingProvider {
        const id = (
            providerId ??
            process.env.EMAIL_MARKETING_DEFAULT_PROVIDER ??
            DEFAULT_EMAIL_MARKETING_PROVIDER
        ).toLowerCase();
        const factory = PROVIDER_REGISTRY[id];
        if (!factory) {
            throw new Error(
                `Provider email marketing inconnu : "${id}". Disponibles : ${Object.keys(PROVIDER_REGISTRY).join(', ')}`
            );
        }
        return factory();
    }

    static list(): string[] {
        return Object.keys(PROVIDER_REGISTRY);
    }
}
