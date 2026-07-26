import { z } from 'zod';
import { UUIDSchema, TimestampSchema } from './primitives';

export const LoyaltyTierSchema = z.enum(['bronze', 'silver', 'gold', 'platinum']);

export const LoyaltyAccountSchema = z.object({
    id: UUIDSchema,
    tenantId: z.string(),
    subjectId: UUIDSchema,
    points: z.number().int().min(0).default(0),
    lifetimePoints: z.number().int().min(0).default(0),
    tier: LoyaltyTierSchema.default('bronze'),
    lastEarnedAt: z.string().optional(),
    lastRedeemedAt: z.string().optional(),
    createdAt: TimestampSchema,
});

export type LoyaltyAccount = z.infer<typeof LoyaltyAccountSchema>;
export type LoyaltyTier = z.infer<typeof LoyaltyTierSchema>;

export const LoyaltyTransactionSchema = z.object({
    id: UUIDSchema,
    tenantId: z.string(),
    subjectId: UUIDSchema,
    type: z.enum(['earn', 'redeem', 'expire', 'adjust']),
    points: z.number().int(),
    balanceAfter: z.number().int().min(0),
    orderId: UUIDSchema.optional(),
    reason: z.string().optional(),
    operatorId: UUIDSchema.optional(),
    timestamp: TimestampSchema,
});

export type LoyaltyTransaction = z.infer<typeof LoyaltyTransactionSchema>;

export const TIER_THRESHOLDS: Record<LoyaltyTier, number> = {
    bronze: 0,
    silver: 500,
    gold: 2000,
    platinum: 5000,
};
