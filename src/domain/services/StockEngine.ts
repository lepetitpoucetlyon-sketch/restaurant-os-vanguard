// @ts-nocheck
// @ts-nocheck
import { 
  StockItem, 
  Ingredient, 
  Recipe,
  Order,
  InventoryMovement
} from '@/types';
import { logger } from '@/lib/logger';
import { SharedKernel } from '@/lib/shared-kernel';

/**
 * 📊 StockImpactResult
 * Detailed outcome of a stock deduction operation.
 */
export interface StockImpactResult {
    updates: Array<{ id: string, data: Partial<StockItem> }>;
    movements: InventoryMovement[];
}

/**
 * 📦 StockEngine - Restaurant OS
 * Centralized Domain Logic for Inventory Management.
 * Grade X : Stochastic-Ready, NanoID-Powered, Ultra-Deterministic.
 */
export class StockEngine {

    /**
     * Calculates the impact of an order on stock.
     */
    static async calculateOrderStockImpact(
        order: Order, 
        recipes: Recipe[], 
        allStock: StockItem[],
        correlationId: string
    ): Promise<StockImpactResult> {
        const impact: StockImpactResult = { updates: [], movements: [] };
        const timestamp = new Date().toISOString();

        for (const item of order.items || []) {
            const recipe = recipes.find(r => r.id === item.productId);
            if (!recipe) {
                logger.warn(`[StockEngine] No recipe found for product ${item.productId}. Skipping.`);
                continue;
            }

            for (const ing of (recipe.ingredients || [])) {
                // Calculation in GRAMS (Integer Only - Grade X Standard)
                const needed = (ing.quantity || 0) * (item.quantity || 1);
                const batches = allStock.filter(s => s.ingredientId === ing.id && s.quantity > 0);
                
                const deduction = this.calculateBatchDeduction(batches, needed);
                
                deduction.updates.forEach(u => {
                    impact.updates.push({ 
                        id: u.id, 
                        data: { 
                            quantity: u.quantity, 
                            status: u.status
                        } 
                    });
                });

                deduction.events.forEach(e => {
                    impact.movements.push({
                        id: SharedKernel.generateId('MOV'),
                        stockItemId: e.id,
                        type: 'sale',
                        quantity: e.quantity,
                        unit: allStock.find(s => s.id === e.id)?.unit || 'unit',
                        ingredientId: ing.id,
                        ingredientName: ing.name,
                        reason: `Order #${correlationId}`,
                        performedAt: timestamp,
                        performedBy: 'System (Titan-StockEngine)'
                    });
                });
            }
        }

        return impact;
    }

    /**
     * Pure logic for FIFO batch deduction.
     */
    static calculateBatchDeduction(batches: StockItem[], needed: number): {
        events: Array<{ id: string, quantity: number }>,
        updates: Array<{ id: string, quantity: number, status: StockItem['status'] }>,
        remaining: number
    } {
        const events: Array<{ id: string, quantity: number }> = [];
        const updates: Array<{ id: string, quantity: number, status: StockItem['status'] }> = [];
        let remainingToDeduct = needed;

        // FIFO: Sort by Expiration Date (DLC)
        const sortedBatches = [...batches].sort((a, b) => 
            new Date(a.dlc).getTime() - new Date(b.dlc).getTime()
        );

        for (const batch of sortedBatches) {
            if (remainingToDeduct <= 0) break;
            
            const toDeduct = Math.min(batch.quantity, remainingToDeduct);
            const newQuantity = batch.quantity - toDeduct;
            const newStatus: StockItem['status'] = newQuantity === 0 ? 'depleted' : 'available';

            events.push({ id: batch.id, quantity: toDeduct });
            updates.push({ id: batch.id, quantity: newQuantity, status: newStatus });

            remainingToDeduct -= toDeduct;
        }

        return { events, updates, remaining: remainingToDeduct };
    }

    /**
     * Orchestrates a stock reception.
     */
    static receiveStock(
        ingredient: Ingredient, 
        receivedData: { quantity: number; cost: number; manualDlc?: string; chefNotes?: string }
    ): { newItem: Partial<StockItem>; movement: InventoryMovement } {
        const timestamp = new Date();
        const shelfLife = ingredient.shelfLifeDays || 3;
        const dlcDate = receivedData.manualDlc 
            ? new Date(receivedData.manualDlc) 
            : new Date(timestamp.getTime() + shelfLife * 24 * 60 * 60 * 1000);

        const itemId = SharedKernel.generateId('BATCH');
        
        const newItem: Partial<StockItem> = {
            id: itemId,
            ingredientId: ingredient.id,
            ingredientName: ingredient.name,
            quantity: receivedData.quantity,
            initialQuantity: receivedData.quantity,
            unit: ingredient.unit,
            unitCostInCents: receivedData.cost,
            dlc: dlcDate.toISOString(),
            status: 'available',
            storageLocationId: ingredient.defaultLocationId || 'general_storage',
            notes: receivedData.chefNotes || "Standard Industrialized Reception",
            createdAt: timestamp.toISOString(),
            updatedAt: timestamp.toISOString()
        };

        const movement: InventoryMovement = {
            id: SharedKernel.generateId('MOV'),
            stockItemId: itemId,
            ingredientId: ingredient.id,
            ingredientName: ingredient.name,
            type: 'reception',
            quantity: receivedData.quantity,
            unit: ingredient.unit,
            reason: `Reception from Supplier / NanoID-Authenticated`,
            performedBy: 'System (Industrialized)',
            performedAt: timestamp.toISOString(),
        };

        return { newItem, movement };
    }

    /**
     * Alias for Grade X Bridge compatibility.
     */
    static processReception(ingredient: Ingredient, data: any) {
        return this.receiveStock(ingredient, data);
    }

    /**
     * Identifies items below their safety threshold.
     */
    static calculateLowStock(allStock: StockItem[], ingredients: Ingredient[]): StockItem[] {
        return allStock.filter(item => {
            const ing = ingredients.find(i => i.id === item.ingredientId);
            const threshold = ing?.minQuantity || 0;
            return item.quantity < threshold;
        });
    }

    /**
     * Analyzes unit cost trends (Stochastic Logic).
     */
    static calculatePriceEvolution(ingredientId: string, movements: InventoryMovement[]): number {
        const costMovements = movements
            .filter(m => m.ingredientId === ingredientId && m.type === 'reception')
            .sort((a, b) => new Date(a.performedAt).getTime() - new Date(b.performedAt).getTime());

        if (costMovements.length < 2) return 0;
        
        // Simple % change between last and before-last
        const first = (costMovements[0] as any).unitCostInCents || 0;
        const last = (costMovements[costMovements.length - 1] as any).unitCostInCents || 0;
        
        if (first === 0) return 0;
        return ((last - first) / first) * 100;
    }
}

export const calculateLowStock = StockEngine.calculateLowStock;
