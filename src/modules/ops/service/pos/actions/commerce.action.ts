"use server";

import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { toError } from '@/lib/toError';

import { createSafeAction } from "@/lib/server/actionWrapper";
import { z } from "zod";

const CampaignPayloadSchema = z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    type: z.string().optional(),
    status: z.string().optional(),
    budgetInMicrounits: z.number().int().min(0).optional(),
}).passthrough();

const PostPayloadSchema = z.object({
    id: z.string().optional(),
    title: z.string().optional(),
    content: z.string().optional(),
    channel: z.string().optional(),
}).passthrough();

const CustomerPayloadSchema = z.object({
    id: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
}).passthrough();

export type CampaignPayload = z.infer<typeof CampaignPayloadSchema>;
export type PostPayload = z.infer<typeof PostPayloadSchema>;
export type CustomerPayload = z.infer<typeof CustomerPayloadSchema>;

export const markReservationArrivedAction = createSafeAction(
    z.tuple([z.string().min(1, 'reservationId requis')]),
    { page: "reservations", action: "mark_arrived" },
    async (tenantId, reservationId: string) => {
        try {
            const data = {
                status: 'arrived',
                arrivedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            await NexusEventBus.emitDurable('commerce.reservation.arrived', { tenantId, id: reservationId, data });
            return { success: true };
        } catch (err) {
            return { success: false, error: toError(err).message };
        }
    }
);

export const upsertCampaignAction = createSafeAction(
    z.tuple([CampaignPayloadSchema]),
    { page: "marketing", action: "create_campaign" },
    async (tenantId, data: CampaignPayload) => {
        try {
            if (data.id) {
                await NexusEventBus.emitDurable('commerce.campaign.updated', { tenantId, id: data.id, data });
            } else {
                await NexusEventBus.emitDurable('commerce.campaign.created', { tenantId, data });
            }
            return { success: true };
        } catch (err) {
            return { success: false, error: toError(err).message };
        }
    }
);

export const upsertPostAction = createSafeAction(
    z.tuple([PostPayloadSchema]),
    { page: "marketing", action: "create_campaign" },
    async (tenantId, data: PostPayload) => {
        try {
            if (data.id) {
                await NexusEventBus.emitDurable('commerce.post.updated', { tenantId, id: data.id, data });
            } else {
                await NexusEventBus.emitDurable('commerce.post.created', { tenantId, data: { ...data, type: 'post' } });
            }
            return { success: true };
        } catch (err) {
            return { success: false, error: toError(err).message };
        }
    }
);

export const upsertCustomerAction = createSafeAction(
    z.tuple([CustomerPayloadSchema]),
    { page: "crm", action: "create_client" },
    async (tenantId, data: CustomerPayload) => {
        try {
            if (data.id) {
                await NexusEventBus.emitDurable('commerce.customer.updated', { tenantId, id: data.id, data });
            } else {
                await NexusEventBus.emitDurable('commerce.customer.created', { tenantId, data: { ...data, type: 'customer' } });
            }
            return { success: true };
        } catch (err) {
            return { success: false, error: toError(err).message };
        }
    }
);
