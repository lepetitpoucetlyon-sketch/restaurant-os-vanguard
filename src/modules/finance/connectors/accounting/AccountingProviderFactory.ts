import type { IAccountingProvider } from './types';
import { PennylaneProvider } from './providers/PennylaneProvider';

const PROVIDER_REGISTRY: Record<string, (credentials?: Record<string, string>) => IAccountingProvider> = {
    pennylane: (creds) => new PennylaneProvider(creds),
};

export const DEFAULT_ACCOUNTING_PROVIDER = 'pennylane';

export class AccountingProviderFactory {
    /**
     * Retourne une instance provider liée aux credentials du tenant.
     *
     * @param providerId  identifiant provider ('pennylane', ...)
     * @param credentials credentials déchiffrés du tenant (api_token, etc.)
     *                    — si absents, le provider tombera sur env vars pour compat.
     */
    static get(providerId?: string | null, credentials?: Record<string, string>): IAccountingProvider {
        const id = (
            providerId ??
            process.env.ACCOUNTING_DEFAULT_PROVIDER ??
            DEFAULT_ACCOUNTING_PROVIDER
        ).toLowerCase();
        const factory = PROVIDER_REGISTRY[id];
        if (!factory) {
            throw new Error(
                `Provider comptabilité inconnu : "${id}". Disponibles : ${Object.keys(PROVIDER_REGISTRY).join(', ')}`
            );
        }
        return factory(credentials);
    }

    static list(): string[] {
        return Object.keys(PROVIDER_REGISTRY);
    }
}
