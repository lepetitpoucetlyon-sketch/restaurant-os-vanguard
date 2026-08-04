import type { Microunits } from '@/domain/schemas/primitives';

export type PaymentEventType = 'payment.succeeded' | 'payment.failed' | 'refund.succeeded';

export interface PaymentEvent {
    type: PaymentEventType;
    transactionId: string;
    amountInMicrounits: Microunits;
    currency: string;
    metadata?: Record<string, string>;
}

export interface Transaction {
    id: string;
    externalId: string;
    amountInMicrounits: Microunits;
    currency: string;
    status: 'succeeded' | 'failed' | 'pending' | 'refunded';
    createdAt: string; // ISO 8601
    description?: string;
}

export interface CheckoutOrder {
    id: string;
    totalInMicrounits: Microunits;
    description: string;
    customerEmail?: string;
}

export interface IPaymentProvider {
    readonly id: string;
    /** Returns the checkout URL to redirect the customer to. */
    createCheckout(order: CheckoutOrder, returnUrl: string): Promise<string>;
    onWebhook(payload: unknown): PaymentEvent;
    getTransactions(tenantId: string, since: Date): Promise<Transaction[]>;
    refund(transactionId: string, amountInMicrounits: Microunits): Promise<void>;
}
