import { SovereignNode } from '@/shared/nexus-contract';

import { Product } from '@/domain/schemas/commerce';
export type { Product };

export interface Quote extends SovereignNode {
    title: string;
    number?: string;
    amount?: number;
    amountInCents: number;
    amountInMicrounits?: number; // microunits = cents × 10 000
    status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'converted' | 'rejected' | 'expired';
    customerId: string;
    customerName: string;
    validUntil?: string;
    totals: {
        totalHTInCents: number;
        totalHTInMicrounits?: number; // microunits = cents × 10 000
        totalTTCInCents: number;
        totalTTCInMicrounits?: number; // microunits = cents × 10 000
        totalTaxInCents: number;
        totalTaxInMicrounits?: number; // microunits = cents × 10 000
        totalDiscountInCents: number;
        totalDiscountInMicrounits?: number; // microunits = cents × 10 000
    };
    customer?: {
        id: string;
        name: string;
        email?: string;
        type: 'individual' | 'company';
    };
    items: Array<{
        id: string;
        name: string;
        quantity: number;
        priceInCents: number;
        priceInMicrounits?: number; // microunits = cents × 10 000
    }>;
}

export interface Group extends SovereignNode {
    name: string;
    contact?: string;
    type: string;
    status: 'pending' | 'confirmed' | 'cancelled' | string;
    budget?: number;
    date?: string;
    time?: string;
    pax?: number;
    tags?: string[];
}
