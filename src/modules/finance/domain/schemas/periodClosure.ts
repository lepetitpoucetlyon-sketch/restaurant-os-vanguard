import { z } from 'zod';
import { MicrounitsSchema } from '@/shared/schemas/primitives';
import { TaxRateSchema } from './finance';

export const PeriodTypeSchema = z.enum(['monthly', 'annual']);
export type PeriodType = z.infer<typeof PeriodTypeSchema>;

export const PeriodClosureSchema = z.object({
    id: z.string(),
    tenantId: z.string(),
    periodType: PeriodTypeSchema,
    periodKey: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    totalRevenueInMicrounits: MicrounitsSchema,
    totalExpenseInMicrounits: MicrounitsSchema,
    tvaCollected: z.record(TaxRateSchema, MicrounitsSchema),
    transactionCount: z.number().int().min(0),
    grandTotalInMicrounits: MicrounitsSchema,
    hash: z.string().length(64),
    previousHash: z.string().length(64),
    closedAt: z.string(),
    closedBy: z.string(),
});

export type PeriodClosure = z.infer<typeof PeriodClosureSchema>;
