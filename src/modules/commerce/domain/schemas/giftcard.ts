import { z } from 'zod';
import { MicrounitsSchema, UUIDSchema, TimestampSchema, sanitized } from '@/shared/schemas/primitives';

export const GiftCardSchema = z.object({
    id: UUIDSchema,
    tenantId: z.string(),
    code: z.string().min(8).max(32),
    balanceInMicrounits: MicrounitsSchema,
    initialAmountInMicrounits: MicrounitsSchema,
    status: z.enum(['active', 'depleted', 'expired', 'revoked']).default('active'),
    purchasedBy: UUIDSchema.optional(),
    recipientName: sanitized(0, 80).optional(),
    recipientEmail: z.string().email().optional(),
    issuedAt: TimestampSchema,
    expiresAt: z.string().optional(),
    lastUsedAt: z.string().optional(),
    journalEntryId: UUIDSchema.optional(),
});

export type GiftCard = z.infer<typeof GiftCardSchema>;

export const GiftCardTransactionSchema = z.object({
    id: UUIDSchema,
    giftCardId: UUIDSchema,
    tenantId: z.string(),
    type: z.enum(['issue', 'redeem', 'refund', 'expire']),
    amountInMicrounits: MicrounitsSchema,
    balanceAfterInMicrounits: MicrounitsSchema,
    orderId: UUIDSchema.optional(),
    operatorId: UUIDSchema,
    timestamp: TimestampSchema,
});

export type GiftCardTransaction = z.infer<typeof GiftCardTransactionSchema>;
