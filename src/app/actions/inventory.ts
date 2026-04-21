"use server";

import { SovereignData } from "@/shared/nexus-contract";

export async function receiveStockAction(tenantId: string, ingredient: import('@/types').StockItem, data: SovereignData): Promise<{ success: boolean }> {
    console.log('[NexusInventory] ReceiveStockAction triggered', { tenantId, ingredient, data });
    return { success: true };
}

export async function searchIngredientsAction(query: string): Promise<import('@/types').StockItem[]> {
    console.log('[NexusInventory] SearchIngredientsAction triggered', query);
    return [];
}
