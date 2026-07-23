import { z } from 'zod';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { MicrounitsSchema, UUIDSchema, sanitized } from '@/domain/schemas/primitives';

export const DigitalReceiptSchema = z.object({
    id: UUIDSchema,
    tenantId: z.string(),
    orderId: UUIDSchema,
    journalEntryId: UUIDSchema,
    fiscalSealId: UUIDSchema,
    receiptNumber: z.string(),
    totalTTCInMicrounits: MicrounitsSchema,
    tvaBreakdown: z.record(z.string(), MicrounitsSchema),
    paymentMethod: z.enum(['card', 'cash', 'split']),
    stripePaymentIntentId: z.string().optional(),
    generatedAt: z.string(),
    url: z.string().optional(),
});

export type DigitalReceipt = z.infer<typeof DigitalReceiptSchema>;

export const PayAtTableService = {
    async createDigitalReceipt(
        tenantId: string,
        params: {
            orderId: string;
            journalEntryId: string;
            fiscalSealId: string;
            receiptNumber: string;
            totalTTCInMicrounits: number;
            tvaBreakdown: Record<string, number>;
            paymentMethod: 'card' | 'cash' | 'split';
            stripePaymentIntentId?: string;
        }
    ): Promise<DigitalReceipt> {
        const id = Nexus.adapter.generateId(`tenants/${tenantId}/digitalReceipts`);
        const receipt: DigitalReceipt = {
            id,
            tenantId,
            ...params,
            totalTTCInMicrounits: params.totalTTCInMicrounits as import('@/domain/schemas/primitives').Microunits,
            tvaBreakdown: params.tvaBreakdown as Record<string, import('@/domain/schemas/primitives').Microunits>,
            generatedAt: new Date().toISOString(),
        };

        await Nexus.adapter.set(
            `tenants/${tenantId}/digitalReceipts/${id}`,
            receipt as unknown as import('@/shared/nexus-contract').SovereignData
        );

        return receipt;
    },

    async getByOrder(tenantId: string, orderId: string): Promise<DigitalReceipt | null> {
        const results = await Nexus.adapter.query<DigitalReceipt>(
            `tenants/${tenantId}/digitalReceipts`,
            { where: [{ field: 'orderId', operator: '==', value: orderId }] }
        );
        return results[0] ?? null;
    },
};
