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
        totalHTInMicrounits: number;
        totalTTCInMicrounits: number;
        totalTaxInMicrounits: number;
        totalDiscountInMicrounits: number;
        /** @deprecated use totalHTInMicrounits */
        totalHTInCents?: number;
        /** @deprecated use totalTTCInMicrounits */
        totalTTCInCents?: number;
        /** @deprecated use totalTaxInMicrounits */
        totalTaxInCents?: number;
        /** @deprecated use totalDiscountInMicrounits */
        totalDiscountInCents?: number;
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
