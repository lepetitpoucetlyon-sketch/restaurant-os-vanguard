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
        const ingredients = await Nexus.adapter.query(path) as unknown as Ingredient[];
        
        // Final industrial filtering (simulating fuzzy match)
        return ingredients.filter(i => 
            (i.name || '').toLowerCase().includes(query.toLowerCase()) || 
            (i.tags || []).some((t: string) => t.toLowerCase().includes(query.toLowerCase()))
        );
    } catch (error) {
        logger.error(`[ServerAction] Search failed`, error);
        return [];
    }
}


/**
 * consumeStockAction
 * 📉 Operational Deduction: Reduces quantity of a stock item.
 */
export async function consumeStockAction(tenantId: string, itemId: string, quantity: number, reason: string) {
    logger.info(`[ServerAction] Consuming ${quantity} from ${itemId} (Reason: ${reason})`);
    
    try {
        const path = `tenants/${tenantId}/stockItems/${itemId}`;
        const item = await Nexus.adapter.get<StockItem>(path);
        
        if (!item) throw new Error("Stock item not found");
        
        const newQuantity = Math.max(0, item.quantity - quantity);
        await Nexus.adapter.update(path, { 
            quantity: newQuantity,
            status: newQuantity === 0 ? 'out_of_stock' : item.status,
            updatedAt: new Date().toISOString()
        });

        logger.info(`[ServerAction] Stock consumed successfully. New quantity: ${newQuantity}`);
        return { success: true };
    } catch (error) {
        logger.error(`[ServerAction] Consumption failed`, error);
        throw new Error("Failed to consume stock");
    }
}

/**
 * deleteStockItemAction
 * 🗑️ Purge Operation
 */
export async function deleteStockItemAction(tenantId: string, itemId: string) {
    logger.info(`[ServerAction] Deleting Stock Item: ${itemId}`);
    try {
        await Nexus.adapter.delete(`tenants/${tenantId}/stockItems/${itemId}`);
        return { success: true };
    } catch (error) {
        logger.error(`[ServerAction] Delete failed`, error);
        throw new Error("Failed to delete stock item");
    }
}
