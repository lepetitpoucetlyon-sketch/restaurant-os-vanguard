/**
 * 🏛️ Billing Types - Grade X+++
 */

export interface BillingSubscription {
    id: string;
    tenantId: string;
    customerId: string;
    planId: string;
    amountInCents: number;
    billingCycle: 'monthly' | 'yearly';
    nextBillingDate: string | Date;
    status: 'active' | 'suspended' | 'cancelled';
    consecutiveFailures: number;
    maxFailures: number;
}

export interface BillingEvent {
    subscriptionId: string;
    status: 'success' | 'failed';
    amountChargedInCents: number;
    timestamp: string;
    failureReason?: string;
}
