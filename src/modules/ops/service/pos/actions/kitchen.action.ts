"use server";

import { verifySession } from '@/lib/server/verifySession';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { toError } from '@/lib/toError';

export async function respondToModificationAction(tenantId: string, orderId: string, itemId: string, approved: boolean, responder: string, note?: string) {
    try {
        await verifySession(tenantId);
        const data = {
            [`items.${itemId}.modification.approved`]: approved,
            [`items.${itemId}.modification.respondedBy`]: responder,
            [`items.${itemId}.modification.responseNote`]: note,
            [`items.${itemId}.modification.respondedAt`]: new Date().toISOString(),
        };
        await NexusEventBus.emitDurable('kitchen.order.updated', { tenantId, id: orderId, data });
        return { success: true };
    } catch (err) {
        return { success: false, error: toError(err).message };
    }
}

export async function updateRecipeAction(tenantId: string, id: string, data: any) {
    try {
        await verifySession(tenantId);
        await NexusEventBus.emitDurable('kitchen.recipe.updated', { tenantId, id, data });
        return { success: true };
    } catch (err) {
        return { success: false, error: toError(err).message };
    }
}

export async function togglePrepTaskAction(tenantId: string, id: string, newStatus: string) {
    try {
        await verifySession(tenantId);
        await NexusEventBus.emitDurable('kitchen.preptask.toggled', { tenantId, id, status: newStatus });
        return { success: true };
    } catch (err) {
        return { success: false, error: toError(err).message };
    }
}

export async function submitOrderAction(tenantId: string, sanitizedOrder: any) {
    try {
        await verifySession(tenantId);
        await NexusEventBus.emitDurable('kitchen.order.created', { tenantId, data: sanitizedOrder });
        return { success: true };
    } catch (err) {
        return { success: false, error: toError(err).message };
    }
}

export async function updateOrderStatusAction(tenantId: string, id: string, status: string) {
    try {
        await verifySession(tenantId);
        const data = {
            status,
            attributes: { status },
            updatedAt: new Date().toISOString()
        };
        await NexusEventBus.emitDurable('kitchen.order.updated', { tenantId, id, data });
        return { success: true };
    } catch (err) {
        return { success: false, error: toError(err).message };
    }
}

export async function updateDailyPrepListAction(tenantId: string, dateIso: string, data: any) {
    try {
        await verifySession(tenantId);
        await NexusEventBus.emitDurable('ops.prepTask.completed', { tenantId, dateIso, data });
        return { success: true };
    } catch (err) {
        return { success: false, error: toError(err).message };
    }
}

export async function fireNextCourseAction(tenantId: string, orderId: string, course: number, firedBy: string, stationId?: string) {
    try {
        await verifySession(tenantId);
        await NexusEventBus.emitDurable('kds.fire_next_course', {
            v: 1,
            tenantId,
            orderId,
            course,
            stationId,
            firedBy,
            firedAt: Date.now(),
        });
        return { success: true };
    } catch (err) {
        return { success: false, error: toError(err).message };
    }
}

export async function markItemDoneAction(tenantId: string, orderId: string, itemId: string, operatorId?: string) {
    try {
        await verifySession(tenantId);
        await NexusEventBus.emitDurable('kds.item_done', {
            v: 1,
            tenantId,
            orderId,
            itemId,
            operatorId,
        });
        return { success: true };
    } catch (err) {
        return { success: false, error: toError(err).message };
    }
}

export async function reboundDishAction(
    tenantId: string,
    orderId: string,
    itemId: string,
    productName: string,
    operatorId: string,
    reason: 'client_refusal' | 'quality' | 'allergen' | 'other' = 'other'
) {
    try {
        await verifySession(tenantId);
        await NexusEventBus.emitDurable('kds.dish_rebound', {
            v: 1,
            tenantId,
            orderId,
            itemId,
            productName,
            operatorId,
            reason,
            reboundAt: Date.now(),
        });
        return { success: true };
    } catch (err) {
        return { success: false, error: toError(err).message };
    }
}


