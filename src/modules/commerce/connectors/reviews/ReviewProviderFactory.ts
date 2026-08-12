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
        const provider = factory();

        return new Proxy(provider, {
            get(target, prop) {
                if (prop === 'fetchRecent') {
                    return async (tenantId: string, since: Date) => {
                        const reviews = await target.fetchRecent(tenantId, since);
                        const { NexusEventBus } = await import('@orchestration/NexusEventBus');
                        
                        for (const review of reviews) {
                            const eventName = review.rating <= 3 ? 'review.negative' : 'review.positive';
                            // Fire & forget event emission
                            NexusEventBus.emit(eventName, {
                                v: 1,
                                tenantId,
                                reviewId: review.id,
                                customerId: review.authorName,
                                rating: review.rating,
                                platform: review.source,
                                content: review.text || ''
                            }).catch(() => {});
                        }
                        return reviews;
                    };
                }
                const value = Reflect.get(target, prop);
                return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(target) : value;
            }
        });
    }

    static list(): string[] {
        return Object.keys(PROVIDER_REGISTRY);
    }
}
