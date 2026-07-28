import type { IAccountingProvider } from './types';
import { PennylaneProvider } from './providers/PennylaneProvider';

const PROVIDER_REGISTRY: Record<string, () => IAccountingProvider> = {
    pennylane: () => new PennylaneProvider(),
};

export const DEFAULT_ACCOUNTING_PROVIDER = 'pennylane';

export class AccountingProviderFactory {
    static get(providerId?: string | null): IAccountingProvider {
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
        return factory();
    }

    static list(): string[] {
        return Object.keys(PROVIDER_REGISTRY);
    }
}
