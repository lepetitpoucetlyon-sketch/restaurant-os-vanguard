import type { ISupplierProvider } from './types';
import { EmailPdfSupplierProvider } from './providers/EmailPdfSupplierProvider';

const PROVIDER_REGISTRY: Record<string, () => ISupplierProvider> = {
    email_pdf: () => new EmailPdfSupplierProvider(),
};

export const DEFAULT_SUPPLIER_PROVIDER = 'email_pdf';

export class SupplierProviderFactory {
    static get(providerId?: string | null): ISupplierProvider {
        const id = (
            providerId ??
            process.env.SUPPLIER_DEFAULT_PROVIDER ??
            DEFAULT_SUPPLIER_PROVIDER
        ).toLowerCase();
        const factory = PROVIDER_REGISTRY[id];
        if (!factory) {
            throw new Error(
                `Provider fournisseurs inconnu : "${id}". Disponibles : ${Object.keys(PROVIDER_REGISTRY).join(', ')}`
            );
        }
        return factory();
    }

    static list(): string[] {
        return Object.keys(PROVIDER_REGISTRY);
    }
}
