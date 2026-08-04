import type { IPaymentProvider, PaymentEvent, Transaction, CheckoutOrder } from '../types';
import { toMicrounits } from '@/domain/schemas/primitives';
import type { Microunits } from '@/domain/schemas/primitives';
import { logger } from '@/lib/logger';

/**
 * Stripe — étend l'usage existant (abonnements MCC) aux paiements clients directs.
 * Variable requise : STRIPE_SECRET_KEY
 */
export class StripePaymentProvider implements IPaymentProvider {
    readonly id = 'stripe';

    private get secretKey(): string {
        const key = process.env.STRIPE_SECRET_KEY;
        if (!key) throw new Error('STRIPE_SECRET_KEY manquant');
        return key;
    }

    private async stripePost<T>(path: string, body: Record<string, string>): Promise<T> {
        const res = await fetch(`https://api.stripe.com/v1${path}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.secretKey}`,
                'Content-Type':  'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams(body),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
            throw new Error(`Stripe ${path} → ${res.status}: ${err.error?.message ?? 'unknown'}`);
        }
        return res.json() as Promise<T>;
    }

    async createCheckout(order: CheckoutOrder, returnUrl: string): Promise<string> {
        // Montant Stripe en centimes (microunits / 10000)
        const amountCents = Math.round(Number(order.totalInMicrounits) / 10_000);
        const session = await this.stripePost<{ url: string }>('/checkout/sessions', {
            'line_items[0][price_data][currency]':       'eur',
            'line_items[0][price_data][product_data][name]': order.description,
            'line_items[0][price_data][unit_amount]':    String(amountCents),
            'line_items[0][quantity]':                   '1',
            'mode':                                       'payment',
            'success_url':                               returnUrl,
            'cancel_url':                                returnUrl,
            ...(order.customerEmail ? { 'customer_email': order.customerEmail } : {}),
            'metadata[order_id]':                        order.id,
        });
        return session.url;
    }

    onWebhook(payload: unknown): PaymentEvent {
        const event = payload as { type: string; data: { object: Record<string, unknown> } };
        const obj   = event.data.object;
        return {
            type:                event.type === 'payment_intent.succeeded' ? 'payment.succeeded'
                               : event.type === 'payment_intent.payment_failed' ? 'payment.failed'
                               : 'refund.succeeded',
            transactionId:       String(obj['id'] ?? ''),
            amountInMicrounits:  toMicrounits(Math.round(Number(obj['amount'] ?? 0) * 10_000)),
            currency:            String(obj['currency'] ?? 'eur').toUpperCase(),
        };
    }

    async getTransactions(_tenantId: string, since: Date): Promise<Transaction[]> {
        const sinceTs = Math.floor(since.getTime() / 1000);
        const res = await fetch(
            `https://api.stripe.com/v1/charges?created[gte]=${sinceTs}&limit=100`,
            { headers: { 'Authorization': `Bearer ${this.secretKey}` } }
        );
        if (!res.ok) throw new Error(`Stripe charges → ${res.status}`);
        const data = await res.json() as { data: Array<Record<string, unknown>> };
        return data.data.map(c => ({
            id:                  `stripe_${c['id']}`,
            externalId:          String(c['id'] ?? ''),
            amountInMicrounits:  toMicrounits(Math.round(Number(c['amount'] ?? 0) * 10_000)),
            currency:            String(c['currency'] ?? 'eur').toUpperCase(),
            status:              c['status'] === 'succeeded' ? 'succeeded' : c['status'] === 'failed' ? 'failed' : 'pending',
            createdAt:           new Date(Number(c['created']) * 1000).toISOString(),
            description:         c['description'] ? String(c['description']) : undefined,
        }));
    }

    async refund(transactionId: string, amountInMicrounits: Microunits): Promise<void> {
        const amountCents = Math.round(Number(amountInMicrounits) / 10_000);
        const externalId  = transactionId.replace('stripe_', '');
        await this.stripePost('/refunds', {
            charge: externalId,
            amount: String(amountCents),
        });
        logger.info('[StripePaymentProvider] refund', externalId, amountCents);
    }
}
