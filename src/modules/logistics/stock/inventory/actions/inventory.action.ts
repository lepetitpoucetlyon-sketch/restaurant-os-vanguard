"use server";

import { NexusEventBus } from '@orchestration/NexusEventBus';
import { toError } from '@/lib/toError';

import { createSafeAction } from "@/lib/server/actionWrapper";
import { z } from "zod";

const ReceiveStockDataSchema = z.object({
    quantity: z.number().min(0.001, 'quantité positive requise'),
    unitCost: z.number().min(0).optional(),
    unitCostInMicrounits: z.number().int().min(0).optional(),
    name: z.string().optional(),
    unit: z.string().optional(),
}).passthrough();

export type ReceiveStockData = z.infer<typeof ReceiveStockDataSchema>;

export const adjustStockAction = createSafeAction(
    z.tuple([
        z.string().min(1, 'itemId requis'),
        z.number().min(0, 'quantité initiale doit être >= 0'),
        z.number().min(0, 'nouvelle quantité doit être >= 0'),
        z.string().min(1, 'motif obligatoire pour justification du mouvement'),
        z.string().min(1, 'adjustedBy requis')
    ]),
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
    z.tuple([ReceiveStockDataSchema]),
    { page: "inventory", action: "add_stock" },
    async (tenantId, data: ReceiveStockData) => {
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
    z.tuple([
        z.string().min(1, 'ingredientId requis'),
        z.number().min(0, 'minQuantity doit être >= 0').optional(),
        z.number().min(0, 'reorderQuantity doit être >= 0').optional()
    ]),
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
