import type { IEmailInvoiceProvider } from './types';
import { GmailInvoiceProvider } from './providers/GmailInvoiceProvider';
import { ImapInvoiceProvider } from './providers/ImapInvoiceProvider';

const PROVIDER_REGISTRY: Record<string, () => IEmailInvoiceProvider> = {
    gmail: () => new GmailInvoiceProvider(),
    imap:  () => new ImapInvoiceProvider(),
};

export const DEFAULT_INVOICE_PROVIDER = 'gmail';

export class InvoiceProviderFactory {
    static get(providerId?: string | null): IEmailInvoiceProvider {
        const id = (
            providerId ??
            process.env.INVOICE_DEFAULT_PROVIDER ??
            DEFAULT_INVOICE_PROVIDER
        ).toLowerCase();
        const factory = PROVIDER_REGISTRY[id];
        if (!factory) {
            throw new Error(
                `Provider factures inconnu : "${id}". Disponibles : ${Object.keys(PROVIDER_REGISTRY).join(', ')}`
            );
        }
        return factory();
    }

    static list(): string[] {
        return Object.keys(PROVIDER_REGISTRY);
    }
}
