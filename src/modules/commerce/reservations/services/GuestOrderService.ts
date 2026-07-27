import { z } from 'zod';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { MicrounitsSchema, UUIDSchema, TimestampSchema, sanitized } from '@/domain/schemas/primitives';

export const GuestOrderItemSchema = z.object({
    productId: UUIDSchema,
    name: sanitized(1, 80),
    quantity: z.number().int().min(1),
    unitPriceInMicrounits: MicrounitsSchema,
    notes: sanitized(0, 200).optional(),
    modifiers: z.array(z.string()).default([]),
});

export const GuestOrderSchema = z.object({
    id: UUIDSchema,
    tenantId: z.string(),
    tableId: UUIDSchema,
    items: z.array(GuestOrderItemSchema).min(1),
    status: z.enum(['pending_validation', 'validated', 'rejected']).default('pending_validation'),
    submittedAt: TimestampSchema,
    validatedBy: UUIDSchema.optional(),
    validatedAt: TimestampSchema.optional(),
    rejectionReason: sanitized(0, 200).optional(),
});

export type GuestOrder = z.infer<typeof GuestOrderSchema>;
export type GuestOrderItem = z.infer<typeof GuestOrderItemSchema>;

export const GuestOrderService = {
    async submit(
        tenantId: string,
        tableId: string,
        items: GuestOrderItem[]
    ): Promise<GuestOrder> {
        const id = Nexus.adapter.generateId(`tenants/${tenantId}/guestOrders`);
        const order: GuestOrder = {
            id,
            tenantId,
            tableId,
            items,
            status: 'pending_validation',
            submittedAt: Date.now(),
        };
        GuestOrderSchema.parse(order);
        await Nexus.adapter.set(
            `tenants/${tenantId}/guestOrders/${id}`,
            order as unknown as import('@/shared/nexus-contract').SovereignData
        );
        return order;
    },

    async validate(
        tenantId: string,
        guestOrderId: string,
        serverId: string
    ): Promise<void> {
        await Nexus.adapter.update(
            `tenants/${tenantId}/guestOrders/${guestOrderId}`,
            {
                status: 'validated',
                validatedBy: serverId,
                validatedAt: Date.now(),
            }
        );
    },

    async reject(
        tenantId: string,
        guestOrderId: string,
        serverId: string,
        reason: string
    ): Promise<void> {
        await Nexus.adapter.update(
            `tenants/${tenantId}/guestOrders/${guestOrderId}`,
            {
                status: 'rejected',
                validatedBy: serverId,
                validatedAt: Date.now(),
                rejectionReason: reason,
            }
        );
    },

    async getPending(tenantId: string): Promise<GuestOrder[]> {
        return Nexus.adapter.query<GuestOrder>(
            `tenants/${tenantId}/guestOrders`,
            {
                where: [{ field: 'status', operator: '==', value: 'pending_validation' }],
                orderBy: { field: 'submittedAt', direction: 'asc' },
            }
        );
    },
};
