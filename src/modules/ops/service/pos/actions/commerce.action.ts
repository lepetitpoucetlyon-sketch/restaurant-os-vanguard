"use server";

import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { toError } from '@/lib/toError';

import { createSafeAction } from "@/lib/server/actionWrapper";
import { z } from "zod";

export const markReservationArrivedAction = createSafeAction(
    z.tuple([z.string()]),
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
    z.tuple([z.unknown()]),
    { page: "marketing", action: "create_campaign" },
    async (tenantId, data: any) => {
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
    z.tuple([z.unknown()]),
    { page: "marketing", action: "create_campaign" },
    async (tenantId, data: any) => {
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
    z.tuple([z.unknown()]),
    { page: "crm", action: "create_client" },
    async (tenantId, data: any) => {
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
