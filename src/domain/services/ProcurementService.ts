// @ts-nocheck
import { ProcurementOrder } from '@/lib/shared-kernel';
import { SharedKernel } from '@/lib/shared-kernel';
import { logger } from '@/lib/logger';
import { Nexus } from '@/lib/nexus/NexusAdapter';

/**
 * 📦 ProcurementService - Restaurant OS
 * Centralized Domain Logic for Automated Sourcing and Supplier Relations.
 * Grade X : Autonomous Supply Chain.
 */
export class ProcurementService {
    
    /**
     * Generates an automated Purchase Order for a specific ingredient.
     */
    static async generateAutomatedPO(params: {
        ingredientId: string,
        quantity: number,
        unit: string,
        estimatedUnitCostCents: number,
        supplierId?: string
    }): Promise<ProcurementOrder> {
        const po: ProcurementOrder = {
            id: SharedKernel.generateId('PO'),
            supplierId: params.supplierId || 'DEFAULT_SUPPLIER',
            ingredientId: params.ingredientId,
            quantity: params.quantity,
            unit: params.unit,
            estimatedCostCents: params.quantity * params.estimatedUnitCostCents,
            status: 'sent',
            createdAt: new Date().toISOString()
        };

        logger.info(`[ProcurementService] Generating Sovereign PO: ${po.id}`, { po });

        // Persist to the Admin Registry (Backoffice/Procurement)
        await Nexus.adapter.set(Nexus.getTenantPath(`procurement/orders/${po.id}`), po);

        return po;
    }

    /**
     * Analyzes current stock batches to find the most recent cost.
     */
    static getRecentCostForIngredient(ingredientId: string, stockItems: any[]): number {
        const batches = stockItems
            .filter(item => item.ingredientId === ingredientId)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        return batches.length > 0 ? batches[0].unitCostInCents : 0;
    }
}
