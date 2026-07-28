import type { IReviewProvider } from './types';
import { GoogleBusinessProvider } from './providers/GoogleBusinessProvider';

const PROVIDER_REGISTRY: Record<string, () => IReviewProvider> = {
    google: () => new GoogleBusinessProvider(),
};

export const DEFAULT_REVIEW_PROVIDER = 'google';

export class ReviewProviderFactory {
    static get(providerId?: string | null): IReviewProvider {
        const id = (
            providerId ??
            process.env.REVIEW_DEFAULT_PROVIDER ??
            DEFAULT_REVIEW_PROVIDER
        ).toLowerCase();
        const factory = PROVIDER_REGISTRY[id];
        if (!factory) {
            throw new Error(
                `Provider avis inconnu : "${id}". Disponibles : ${Object.keys(PROVIDER_REGISTRY).join(', ')}`
            );
        }
        return factory();
    }

    static list(): string[] {
        return Object.keys(PROVIDER_REGISTRY);
    }
}
