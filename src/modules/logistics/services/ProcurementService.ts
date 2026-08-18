import type { ProcurementOrder } from '@/lib/shared-kernel';
import { SharedKernel } from '@/lib/shared-kernel';
import { logger } from '@/lib/logger';
import { Nexus } from '@/lib/nexus/NexusAdapter';

import { StockItem } from '@nexus/contracts';

interface SupplierRecord {
    id: string;
    name: string;
    [key: string]: unknown;
}

/**
 * 📦 ProcurementService - Restaurant OS
 * Centralized Domain Logic for Automated Sourcing and Supplier Relations.
 * Grade X : Autonomous Supply Chain.
 */
export class ProcurementService {

    /**
     * Loads all suppliers from Nexus.
     * Returns an empty array when none are found (graceful degradation).
     */
    static async loadSuppliers(): Promise<SupplierRecord[]> {
        try {
            const results = await Nexus.adapter.query<SupplierRecord>('suppliers');
            return results ?? [];
        } catch (err) {
            logger.warn('[ProcurementService] Failed to load suppliers from Nexus', { error: err });
            return [];
        }
    }

    /**
     * Generates an automated Purchase Order for a specific ingredient.
     * When supplierId is omitted, the first available supplier in Nexus is used.
     * If no suppliers exist, the PO is flagged as unassigned (no hardcoded fallback).
     */
    static async generateAutomatedPO(params: {
        ingredientId: string,
        quantity: number,
        unit: string,
        estimatedUnitCostCents: number,
        supplierId?: string
    }): Promise<ProcurementOrder> {
        let resolvedSupplierId = params.supplierId;

        // Dynamic supplier resolution (log-1 fix: no more DEFAULT_SUPPLIER hardcode)
        if (!resolvedSupplierId) {
            const suppliers = await ProcurementService.loadSuppliers();
            if (suppliers.length > 0) {
                resolvedSupplierId = suppliers[0].id;
                logger.info(
                    `[ProcurementService] Auto-selected supplier: ${suppliers[0].name} (${resolvedSupplierId})`
                );
            } else {
                resolvedSupplierId = 'UNASSIGNED';
                logger.warn(
                    '[ProcurementService] No suppliers found in Nexus — PO created without supplier assignment.'
                );
            }
        }

        const po: ProcurementOrder = {
            id: SharedKernel.generateId('PO'),
            supplierId: resolvedSupplierId,
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
    static getRecentCostForIngredient(ingredientId: string, stockItems: StockItem[]): number {
        const batches = stockItems
            .filter(item => item.ingredientId === ingredientId)
            .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

        return batches.length > 0 ? batches[0].unitCostInCents : 0;
    }
}
