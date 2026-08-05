import { z } from 'zod';
import { MicrounitsSchema, UUIDSchema, TimestampSchema, sanitized } from '@/domain/schemas/primitives';

export const CustomerAccountSchema = z.object({
    id: UUIDSchema,
    tenantId: z.string(),
    subjectId: UUIDSchema,
    displayName: sanitized(1, 100),
    creditLimitInMicrounits: MicrounitsSchema,
    balanceInMicrounits: z.number().int(),
    status: z.enum(['active', 'suspended', 'closed']).default('active'),
    createdAt: TimestampSchema,
    lastChargeAt: z.string().optional(),
});

export type CustomerAccount = z.infer<typeof CustomerAccountSchema>;

export const AccountChargeSchema = z.object({
    id: UUIDSchema,
    tenantId: z.string(),
    accountId: UUIDSchema,
    type: z.enum(['charge', 'payment', 'adjustment']),
    amountInMicrounits: z.number().int(),
    balanceAfterInMicrounits: z.number().int(),
    orderId: UUIDSchema.optional(),
    operatorId: UUIDSchema,
    note: sanitized(0, 200).optional(),
    timestamp: TimestampSchema,
});

export type AccountCharge = z.infer<typeof AccountChargeSchema>;
