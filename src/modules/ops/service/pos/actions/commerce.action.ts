"use server";

import { verifySession } from '@/lib/server/verifySession';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { toError } from '@/lib/toError';

export async function markReservationArrivedAction(tenantId: string, reservationId: string) {
    try {
        await verifySession(tenantId);
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

export async function upsertCampaignAction(tenantId: string, data: any) {
    try {
        await verifySession(tenantId);
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

export async function upsertPostAction(tenantId: string, data: any) {
    try {
        await verifySession(tenantId);
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

export async function upsertCustomerAction(tenantId: string, data: any) {
    try {
        await verifySession(tenantId);
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
