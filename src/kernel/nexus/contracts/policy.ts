import { z } from 'zod';

export const PolicyTypeSchema = z.enum(['sod', 'threshold', 'template']);
export type PolicyType = z.infer<typeof PolicyTypeSchema>;

export const SodRuleSchema = z.object({
    incompatibleActions: z.array(z.string()).min(2),
    description: z.string().optional(),
});

export const ThresholdRuleSchema = z.object({
    action: z.string(),
    field: z.enum(['amount', 'discountPct', 'quantity']),
    maxValue: z.number(),
    requiredRoleLevel: z.number().min(10).max(100),
});

export const PolicySchema = z.object({
    id: z.string(),
    tenantId: z.string(),
    type: PolicyTypeSchema,
    name: z.string(),
    enabled: z.boolean().default(true),
    sodRule: SodRuleSchema.optional(),
    thresholdRule: ThresholdRuleSchema.optional(),
    createdAt: z.number(),
    updatedAt: z.number(),
});

export type Policy = z.infer<typeof PolicySchema>;
export type SodRule = z.infer<typeof SodRuleSchema>;
export type ThresholdRule = z.infer<typeof ThresholdRuleSchema>;
