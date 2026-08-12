"use server";

import { NexusEventBus } from '@orchestration/NexusEventBus';
import { toError } from '@/lib/toError';

import { createSafeAction } from "@/lib/server/actionWrapper";
import { z } from "zod";

const RecipePayloadSchema = z.object({
    name: z.string().optional(),
    ingredients: z.array(z.object({
        ingredientId: z.string().optional(),
        name: z.string().optional(),
        quantity: z.number().optional(),
        unit: z.string().optional(),
    })).optional(),
    steps: z.array(z.string()).optional(),
}).passthrough();

const OrderItemSchema = z.object({
    id: z.string().optional(),
    productId: z.string().optional(),
    name: z.string().optional(),
    quantity: z.number().int().min(1).optional(),
    priceInMicrounits: z.number().int().min(0).optional(),
}).passthrough();

const SubmitOrderPayloadSchema = z.object({
    id: z.string().optional(),
    items: z.array(OrderItemSchema).optional(),
    tableId: z.string().optional(),
    covers: z.number().int().min(0).optional(),
}).passthrough();

const DailyPrepPayloadSchema = z.object({
    tasks: z.array(z.object({
        id: z.string().optional(),
        name: z.string().optional(),
        completed: z.boolean().optional(),
    })).optional(),
}).passthrough();

export type RecipePayload = z.infer<typeof RecipePayloadSchema>;
export type SubmitOrderPayload = z.infer<typeof SubmitOrderPayloadSchema>;
export type DailyPrepPayload = z.infer<typeof DailyPrepPayloadSchema>;

export const respondToModificationAction = createSafeAction(
    z.tuple([
        z.string().min(1, 'orderId requis'),
        z.string().min(1, 'itemId requis'),
        z.boolean(),
        z.string().min(1, 'responder requis'),
        z.string().optional()
    ]),
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
    z.tuple([z.string().min(1, 'id requis'), RecipePayloadSchema]),
    { page: "kitchen", action: "modify_recipe" },
    async (tenantId, id: string, data: RecipePayload) => {
        try {
            await NexusEventBus.emitDurable('kitchen.recipe.updated', { tenantId, id, data });
            return { success: true };
        } catch (err) {
            return { success: false, error: toError(err).message };
        }
    }
);

export const togglePrepTaskAction = createSafeAction(
    z.tuple([z.string().min(1, 'id requis'), z.string().min(1, 'newStatus requis')]),
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
    z.tuple([SubmitOrderPayloadSchema]),
    { page: "pos", action: "send_to_kitchen" },
    async (tenantId, sanitizedOrder: SubmitOrderPayload) => {
        try {
            await NexusEventBus.emitDurable('kitchen.order.created', { tenantId, data: sanitizedOrder });
            return { success: true };
        } catch (err) {
            return { success: false, error: toError(err).message };
        }
    }
);

export const updateOrderStatusAction = createSafeAction(
    z.tuple([z.string().min(1, 'id requis'), z.string().min(1, 'status requis')]),
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
    z.tuple([z.string().min(1, 'dateIso requise'), DailyPrepPayloadSchema]),
    { page: "kitchen", action: "manage_prep_task" },
    async (tenantId, dateIso: string, data: DailyPrepPayload) => {
        try {
            await NexusEventBus.emitDurable('ops.prepTask.completed', { tenantId, dateIso, data });
            return { success: true };
        } catch (err) {
            return { success: false, error: toError(err).message };
        }
    }
);

export const fireNextCourseAction = createSafeAction(
    z.tuple([z.string().min(1, 'orderId requis'), z.number().int().min(0), z.string().min(1, 'firedBy requis'), z.string().optional()]),
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
    z.tuple([z.string().min(1, 'orderId requis'), z.string().min(1, 'itemId requis'), z.string().optional()]),
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
    z.tuple([z.string().min(1, 'orderId requis'), z.string().min(1, 'itemId requis'), z.string().min(1), z.string().min(1), z.enum(['client_refusal', 'quality', 'allergen', 'other']).optional()]),
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
