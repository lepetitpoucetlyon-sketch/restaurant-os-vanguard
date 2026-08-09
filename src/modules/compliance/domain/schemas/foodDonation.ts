import { z } from 'zod';
import { MicrounitsSchema, TimestampSchema, UUIDSchema, sanitized } from '@/shared/schemas/primitives';

export const FoodDonationSchema = z.object({
    id: UUIDSchema,
    tenantId: z.string(),
    date: TimestampSchema,
    operatorId: UUIDSchema,
    recipientOrg: sanitized(1, 120),
    items: z.array(z.object({
        productName: sanitized(1, 80),
        quantity: z.number().int().min(1),
        estimatedValueInMicrounits: MicrounitsSchema,
    })).min(1),
    totalValueInMicrounits: MicrounitsSchema,
    notes: sanitized(0, 500).optional(),
    receiptReference: z.string().optional(),
});

export type FoodDonation = z.infer<typeof FoodDonationSchema>;
