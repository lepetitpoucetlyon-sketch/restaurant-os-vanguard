"use server";

import { requireSession } from '@/lib/server/verifySession';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { toError } from '@/lib/toError';

import { createSafeAction } from "@/lib/server/actionWrapper";
import { z } from "zod";

export const adjustStockAction = createSafeAction(
    z.tuple([z.string(), z.number(), z.number(), z.string(), z.string()]),
    { page: "inventory", action: "adjust_qty" },
    async (tenantId, itemId: string, oldQuantity: number, newQuantity: number, reason: string, adjustedBy: string) => {
        try {
            await NexusEventBus.emitDurable('inventory.stock_adjusted', { 
                v: 1,
                tenantId, 
                itemId, 
                oldQuantity, 
                newQuantity, 
                reason, 
                adjustedBy 
            });
            return { success: true };
        } catch (err) {
            return { success: false, error: toError(err).message };
        }
    }
);

export const receiveStockAction = createSafeAction(
    z.tuple([z.string(), z.unknown()]),
    { page: "inventory", action: "add_stock" },
    async (tenantId, data: any) => {
        try {
            const { Nexus } = await import('@/lib/nexus/NexusAdapter');
            const deliveryId = Nexus.adapter.generateId('deliveries');
            const itemId = Nexus.adapter.generateId('stockItems');
            
            await NexusEventBus.emitDurable('stock.received', { 
                v: 1,
                tenantId, 
                deliveryId, 
                items: [
                    {
                        itemId,
                        quantity: data.quantity,
                        unitPrice: data.unitCost
                    }
                ]
            });

            // HACK: To support legacy data directly
            await Nexus.adapter.set(`stockItems/${itemId}`, {
                id: itemId,
                ...data
            });

            return { success: true, id: itemId };
        } catch (err) {
            return { success: false, error: toError(err).message };
        }
    }
);

export const updateIngredientThresholdsAction = createSafeAction(
    z.tuple([z.string(), z.number().optional(), z.number().optional()]),
    { page: "kitchen", action: "edit_recipe" }, // or inventory.manage_alerts
    async (tenantId, ingredientId: string, minQuantity?: number, reorderQuantity?: number) => {
        try {
            const updates: Record<string, number> = {};
            if (minQuantity !== undefined) updates.minQuantity = minQuantity;
            if (reorderQuantity !== undefined) updates.reorderQuantity = reorderQuantity;
            
            const { Nexus } = await import('@/lib/nexus/NexusAdapter');
            await Nexus.adapter.update(`ingredients/${ingredientId}`, updates);
            return { success: true };
        } catch (err) {
            return { success: false, error: toError(err).message };
        }
    }
);
