import { YieldState } from '@/lib/shared-kernel';
import { MarketingService } from '@modules/commerce/acquisition/marketing/services/MarketingService';
import { ProcurementService } from '@modules/logistics/services/ProcurementService';
import { logger } from '@/lib/logger';

/**
 * 🌀 NexusYieldEngine - Restaurant OS
 * The Suzerain Orchestrator for Yield Management and Automated Resilience.
 * Grade X : Cross-Hegemony Integration.
 */
export class NexusYieldEngine {
    private static DEFAULT_CRITICAL_THRESHOLD = 5000; // fallback when ingredient has no minQuantity
    private static DEFAULT_REORDER_QUANTITY = 10000;  // fallback when ingredient has no reorderQuantity
    private static VELOCITY_RUSH_THRESHOLD = 50; // orders per hour (test value)

    /**
     * Executes a full Yield Cycle across all hegemonies.
     */
    static async processYieldCycle(context: {
        products: { id: string, name: string, basePriceCents: number }[],
        allStock: import('@nexus/contracts').StockItem[],
        currentVelocity: number
    }): Promise<YieldState[]> {
        const results: YieldState[] = [];

        for (const product of context.products) {
            // 1. ANALYZE STOCK HEALTH (Backoffice)
            // For simplicity, we check if ANY batch of this product is low.
            // In a real scenario, we'd map products to ingredients.
            const productStock = context.allStock.filter(s => s.ingredientId === product.id);
            const totalStock = productStock.reduce((acc, s) => acc + s.quantity, 0);
            // log-2: use per-ingredient minQuantity if set, otherwise global fallback
            const threshold = productStock[0]?.minQuantity ?? this.DEFAULT_CRITICAL_THRESHOLD;
            const isCritical = totalStock < threshold;

            // 2. ANALYZE VELOCITY (Ops)
            const isRush = context.currentVelocity > this.VELOCITY_RUSH_THRESHOLD;

            // 3. APPLY YIELD STRATEGY (Marketing)
            let yieldFactor = 1.0;
            if (isRush && isCritical) {
                yieldFactor = 1.15; // +15% Imperial Protocol
                MarketingService.updateDynamicPricing(product.id, yieldFactor);
            } else {
                MarketingService.updateDynamicPricing(product.id, 1.0);
            }

            // 4. TRIGGER PROCUREMENT (Admin)
            if (isCritical) {
                const recentCost = ProcurementService.getRecentCostForIngredient(product.id, context.allStock);
                // log-3: use per-ingredient reorderQuantity if set, otherwise global fallback
                const reorderQty = productStock[0]?.reorderQuantity ?? this.DEFAULT_REORDER_QUANTITY;
                await ProcurementService.generateAutomatedPO({
                    ingredientId: product.id,
                    quantity: reorderQty,
                    unit: 'g',
                    estimatedUnitCostCents: recentCost
                });
                logger.info(`[NexusYieldEngine] Automated Sourcing Triggered for ${product.name}`);
            }

            results.push({
                productId: product.id,
                productName: product.name,
                basePriceCents: product.basePriceCents,
                adjustedPriceCents: Math.round(product.basePriceCents * yieldFactor),
                yieldFactor,
                salesVelocity: context.currentVelocity,
                stockLevel: totalStock,
                isCritical
            });
        }

        return results;
    }
}
