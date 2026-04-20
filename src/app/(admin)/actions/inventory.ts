// @ts-nocheck
"use server";

import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { StockItem, Ingredient } from '@/types';

/**
 * 📈 Inventory Actions - Restaurant OS
 * Production-grade server actions for stock movements.
 */

import { StockEngine } from '@/domain/services/StockEngine';

/**
 * 📈 Inventory Actions - Restaurant OS
 */

export async function receiveStockAction(tenantId: string, ingredient: Ingredient, receivedData: {
    quantity: number;
    cost: number;
    manualDlc?: string;
    chefNotes?: string;
    supplierId?: string;
}) {
    logger.info(`[ServerAction] Receiving Stock for: ${ingredient.name} (Tenant: ${tenantId})`);

    try {
        const batch = Nexus.adapter.batch();
        
        // 1. Delegate Logic to StockEngine
        const { newItem, movement } = StockEngine.receiveStock(ingredient, receivedData);

        // 2. Prepare paths
        const stockItemsPath = `tenants/${tenantId}/stockItems`;
        const itemPath = `${stockItemsPath}/${newItem.id}`;
        const movPath = `tenants/${tenantId}/inventoryMovements`;
        const movId = movement.id;

        // 3. Atomically Commit
        batch.set(itemPath, newItem);
        batch.set(`${movPath}/${movId}`, movement);

        await batch.commit();

        logger.info(`[ServerAction] Stock Received Successfully via StockEngine for ${ingredient.name}`);
        return { success: true, itemId: newItem.id };

    } catch (error) {
        logger.error(`[ServerAction] Stock Reception Failed!`, error);
        throw new Error("Failed to receive stock. Please check permissions.");
    }
}


/**
 * searchIngredientsAction
 * 👁️ Vision Support: Simulates a lookup against the tenant's real ingredient database.
 */
export async function searchIngredientsAction(tenantId: string, query: string): Promise<Ingredient[]> {
    logger.info(`[ServerAction] Vision Search: "${query}" (Tenant: ${tenantId})`);
    
    try {
        const path = `tenants/${tenantId}/ingredients`;
        const ingredients = await Nexus.adapter.query(path);
        
        // Final industrial filtering (simulating fuzzy match)
        return ingredients.filter(i => 
            i.name.toLowerCase().includes(query.toLowerCase()) || 
            i.tags?.some((t: string) => t.toLowerCase().includes(query.toLowerCase()))
        );
    } catch (error) {
        logger.error(`[ServerAction] Search failed`, error);
        return [];
    }
}

