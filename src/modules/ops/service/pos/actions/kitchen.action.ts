"use server";

import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { toError } from '@/lib/toError';

import { createSafeAction } from "@/shared/nexus/actions/actionWrapper";
import { z } from "zod";

export const respondToModificationAction = createSafeAction(
    z.tuple([z.string(), z.string(), z.boolean(), z.string(), z.string().optional()]),
    { page: "pos", action: "send_to_kitchen" },
    async (tenantId, orderId: string, itemId: string, approved: boolean, responder: string, note?: string) => {
        try {
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
);

export const updateRecipeAction = createSafeAction(
    z.tuple([z.string(), z.custom<unknown>(() => true)]),
    { page: "kitchen", action: "modify_recipe" },
    async (tenantId, id: string, data: any) => {
        try {
            await NexusEventBus.emitDurable('kitchen.recipe.updated', { tenantId, id, data });
            return { success: true };
        } catch (err) {
            return { success: false, error: toError(err).message };
        }
    }
);

export const togglePrepTaskAction = createSafeAction(
    z.tuple([z.string(), z.string()]),
    { page: "kitchen", action: "manage_prep_task" },
    async (tenantId, id: string, newStatus: string) => {
        try {
            await NexusEventBus.emitDurable('kitchen.preptask.toggled', { tenantId, id, status: newStatus });
            return { success: true };
        } catch (err) {
            return { success: false, error: toError(err).message };
        }
    }
);

export const submitOrderAction = createSafeAction(
    z.tuple([z.custom<unknown>(() => true)]),
    { page: "pos", action: "send_to_kitchen" },
    async (tenantId, sanitizedOrder: any) => {
        try {
            await NexusEventBus.emitDurable('kitchen.order.created', { tenantId, data: sanitizedOrder });
            return { success: true };
        } catch (err) {
            return { success: false, error: toError(err).message };
        }
    }
);

export const updateOrderStatusAction = createSafeAction(
    z.tuple([z.string(), z.string()]),
    { page: "kds", action: "mark_in_progress" },
    async (tenantId, id: string, status: string) => {
        try {
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
);

export const updateDailyPrepListAction = createSafeAction(
    z.tuple([z.string(), z.custom<unknown>(() => true)]),
    { page: "kitchen", action: "manage_prep_task" },
    async (tenantId, dateIso: string, data: any) => {
        try {
            await NexusEventBus.emitDurable('ops.prepTask.completed', { tenantId, dateIso, data });
            return { success: true };
        } catch (err) {
            return { success: false, error: toError(err).message };
        }
    }
);

export const fireNextCourseAction = createSafeAction(
    z.tuple([z.string(), z.number(), z.string(), z.string().optional()]),
    { page: "kds", action: "prioritize" },
    async (tenantId, orderId: string, course: number, firedBy: string, stationId?: string) => {
        try {
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
);

export const markItemDoneAction = createSafeAction(
    z.tuple([z.string(), z.string(), z.string().optional()]),
    { page: "kds", action: "mark_ready" },
    async (tenantId, orderId: string, itemId: string, operatorId?: string) => {
        try {
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
);

export const reboundDishAction = createSafeAction(
    z.tuple([z.string(), z.string(), z.string(), z.string(), z.enum(['client_refusal', 'quality', 'allergen', 'other']).optional()]),
    { page: "kds", action: "cancel_from_kds" },
    async (
        tenantId,
        orderId: string,
        itemId: string,
        productName: string,
        operatorId: string,
        reason: 'client_refusal' | 'quality' | 'allergen' | 'other' = 'other'
    ) => {
        try {
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
);


