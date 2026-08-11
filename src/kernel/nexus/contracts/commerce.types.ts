import { z } from 'zod';
import { SanitizedStringSchema, MicrounitsSchema, UUIDSchema, TaxRateSchema } from '@/shared/schemas/primitives';
import type { SovereignNode } from '@/shared/nexus-contract';

export const ProductSchema = z.object({
  id:                UUIDSchema,
  type:              z.literal('product').default('product'),
  name:              z.string().min(1).pipe(SanitizedStringSchema),
  description:       z.string().pipe(SanitizedStringSchema).optional(),
  priceInMicrounits: MicrounitsSchema,
  priceInCents:      z.number().int().optional(), // Legacy compat
  taxRate:           TaxRateSchema.default('0.10'),
  categoryId:        UUIDSchema,
  imageUrl:          z.string().url().optional(),
  sku:               z.string().optional(),
  isAvailable:       z.boolean().default(true),
  stockQuantity:     z.number().optional(),
  allergens:         z.array(z.string()).default([]),
  recipeId:          z.string().optional(),
  updatedAt:         z.number().default(Date.now()),
}).catchall(z.any());

export type Product = z.infer<typeof ProductSchema>;

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
