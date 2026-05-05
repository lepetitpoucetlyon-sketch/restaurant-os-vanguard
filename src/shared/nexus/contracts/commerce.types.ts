import { SovereignNode, SovereignMap } from '@/shared/nexus-contract';
import { OrderItem } from './ops.types';
import { OptionGroup } from './common.types';

import { Product } from '@/domain/schemas/commerce';
export type { Product };

export interface Quote extends SovereignNode {
    title: string;
    number?: string;
    amount?: number;
    amountInCents: number;
    status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'converted' | 'rejected' | 'expired';
    customerId: string;
    customerName: string;
    validUntil?: string;
    totals: {
        totalHTInCents: number;
        totalTTCInCents: number;
        totalTaxInCents: number;
        totalDiscountInCents: number;
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
