"use server";

import { requireSession } from '@/lib/server/verifySession';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { toError } from '@/lib/toError';

export async function adjustStockAction(tenantId: string, itemId: string, oldQuantity: number, newQuantity: number, reason: string, adjustedBy: string) {
    try {
        await requireSession(tenantId);
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

export async function receiveStockAction(tenantId: string, data: any) {
    try {
        await requireSession(tenantId);
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

export async function updateIngredientThresholdsAction(tenantId: string, ingredientId: string, minQuantity?: number, reorderQuantity?: number) {
    try {
        await requireSession(tenantId);
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
