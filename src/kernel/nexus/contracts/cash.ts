import { z } from 'zod';
import { MicrounitsSchema } from '@/shared/schemas/primitives';

export const CashSessionSchema = z.object({
    id: z.string(),
    openedAt: z.string(),
    openingInMicrounits: MicrounitsSchema,
    closedAt: z.string().optional(),
    closingInMicrounits: MicrounitsSchema.optional(),
    collectedInMicrounits: MicrounitsSchema,
    changeGivenInMicrounits: MicrounitsSchema,
    userId: z.string(),
    tenantId: z.string().optional(),
});

export type CashSession = z.infer<typeof CashSessionSchema>;

export const EUR_DENOMINATIONS = [
    { value: 500_00, label: '500 €', type: 'bill' },
    { value: 200_00, label: '200 €', type: 'bill' },
    { value: 100_00, label: '100 €', type: 'bill' },
    { value: 50_00, label: '50 €', type: 'bill' },
    { value: 20_00, label: '20 €', type: 'bill' },
    { value: 10_00, label: '10 €', type: 'bill' },
    { value: 5_00, label: '5 €', type: 'bill' },
    { value: 2_00, label: '2 €', type: 'coin' },
    { value: 1_00, label: '1 €', type: 'coin' },
    { value: 50, label: '0,50 €', type: 'coin' },
    { value: 20, label: '0,20 €', type: 'coin' },
    { value: 10, label: '0,10 €', type: 'coin' },
    { value: 5, label: '0,05 €', type: 'coin' },
    { value: 2, label: '0,02 €', type: 'coin' },
    { value: 1, label: '0,01 €', type: 'coin' },
] as const;

export const DenominationCountSchema = z.object({
    valueCents: z.number().int().positive(),
    count: z.number().int().min(0),
});

export const CashCountSchema = z.object({
    id: z.string(),
    sessionId: z.string(),
    type: z.enum(['opening', 'closing', 'skim', 'drop']),
    denominations: z.array(DenominationCountSchema),
    totalInMicrounits: MicrounitsSchema,
    blindMode: z.boolean().default(false),
    countedAt: z.string(),
    operatorId: z.string(),
    validatedBy: z.string().optional(),
});

export type CashCount = z.infer<typeof CashCountSchema>;
export type DenominationCount = z.infer<typeof DenominationCountSchema>;

export function fromLegacyCents(legacy: {
    id: string;
    openedAt: string;
    openingAmountInCents: number;
    closedAt?: string;
    closingAmountInCents?: number;
    cashCollectedInCents: number;
    changeGivenInCents: number;
    userId: string;
}): CashSession {
    return CashSessionSchema.parse({
        id: legacy.id,
        openedAt: legacy.openedAt,
        openingInMicrounits: legacy.openingAmountInCents * 10_000,
        closedAt: legacy.closedAt,
        closingInMicrounits: legacy.closingAmountInCents != null
            ? legacy.closingAmountInCents * 10_000
            : undefined,
        collectedInMicrounits: legacy.cashCollectedInCents * 10_000,
        changeGivenInMicrounits: legacy.changeGivenInCents * 10_000,
        userId: legacy.userId,
    });
}
