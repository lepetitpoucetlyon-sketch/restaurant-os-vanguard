"use client";

import { useMemo, useCallback } from "react";
import { useAtomValue } from "jotai";
import { 
    stockItemsNodeAtom, 
    ingredientsNodeAtom, 
    preparationsNodeAtom, 
    storageLocationsNodeAtom 
} from "../store/inventoryAtoms";
import { wasteLogsNodeAtom } from "@/modules/compliance/haccp/store/complianceAtoms";
import { useVisibilityPurge } from "@/hooks/useVisibilityPurge";
import { SovereignNode, SovereignData, OperationalIdentity } from "@shared/nexus-contract";
import { tenantIdAtom } from "@/store/pillars/sovereign";
import { DomainRegistry } from "@shared/nexus/engines/DomainRegistry";
import { Nexus } from "@/lib/nexus/NexusAdapter";
import { Ingredient, StockItem, Preparation, StorageLocation } from "@shared/nexus/contracts/logistics";
import { mapNodeToIngredient } from "./inventoryMappers";
import { logger } from "@/lib/logger";

/**
 * 🥫 useInventory - Grade X Atomic Bridge (Source of Truth)
 * Centralisation de la gestion des stocks et de la chaîne d'approvisionnement.
 */
export function useInventory() {
    useVisibilityPurge('stockItems');
    const tenantId = useAtomValue(tenantIdAtom);
    const now = new Date().toISOString();
    
    const stockNode = useAtomValue(stockItemsNodeAtom);
    const ingredientsNode = useAtomValue(ingredientsNodeAtom);
    const preparationsNode = useAtomValue(preparationsNodeAtom);
    const storageNode = useAtomValue(storageLocationsNodeAtom);
    const wasteNode = useAtomValue(wasteLogsNodeAtom);

    const stockItems = (stockNode.data || []) as StockItem[];
    const ingredients = (ingredientsNode.data || []) as Ingredient[];
    const preparations = (preparationsNode.data || []) as Preparation[];
    const storageLocations = (storageNode.data || []) as StorageLocation[];
    const wasteLogs = (wasteNode.data || []) as unknown[]; // WasteLog mapping later

    const lowStockItems = useMemo(() => 
        stockItems.filter((i: StockItem) => i.quantity <= (i.minQuantity || 0)), 
        [stockItems]
    );

    const receiveOrder = useCallback((id: string, data: SovereignData) => {
        logger.debug('[Inventory] Bridge: Receive Order', id, data);
    }, []);

    const cancelOrder = useCallback((id: string) => {
        logger.debug('[Inventory] Bridge: Cancel Order', id);
    }, []);

    const addStockItem = async (data: Partial<SovereignNode>) => {
        if (!tenantId) return;
        const path = `tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.RESOURCES)}`;
        await Nexus.adapter.create(path, { ...data, updatedAt: now });
    };

    const addPreparation = async (data: Partial<SovereignNode>) => {
        if (!tenantId) return;
        const path = `tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.RESOURCES)}`;
        await Nexus.adapter.create(path, { ...data, updatedAt: now });
    };

    const addWaste = async (data: Partial<SovereignNode>) => {
        if (!tenantId) return;
        const path = `tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.FLOWS)}`;
        await Nexus.adapter.create(path, { ...data, updatedAt: now });
    };

    const transferStock = async (id: string, locationId: string, _qty: number) => {
        if (!tenantId) return;
        const path = `tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.RESOURCES)}/${id}`;
        await Nexus.adapter.update(path, {
            locationId,
            updatedAt: now
        });
    };

    const consumeStock = async (id: string, qty: number, reason?: string) => {
        if (!tenantId) return;
        const path = `tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.RESOURCES)}/${id}`;
        await Nexus.adapter.update(path, {
            lastConsumption: qty,
            lastReason: reason,
            updatedAt: now
        });
    };

    const deductStockForProduct = async (productId: string, quantity: number) => {
        if (!tenantId) return;
        const product = await Nexus.adapter.get<{ linkedStockItemId?: string; recipeId?: string }>(
            `tenants/${tenantId}/products/${productId}`
        );
        if (!product) return;

        const stockBase = `tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.RESOURCES)}`;

        if (product.recipeId) {
            const recipe = await Nexus.adapter.get<{ ingredients?: Array<{ ingredientId: string; quantity: number }> }>(
                `tenants/${tenantId}/recipes/${product.recipeId}`
            );
            await Promise.allSettled(
                (recipe?.ingredients ?? []).map(async (ing) => {
                    if (!ing.ingredientId) return;
                    const itemPath = `${stockBase}/${ing.ingredientId}`;
                    const stockItem = await Nexus.adapter.get<{ quantity?: number }>(itemPath);
                    if (!stockItem) return;
                    const newQty = Math.max(0, (stockItem.quantity ?? 0) - ing.quantity * quantity);
                    await Nexus.adapter.update(itemPath, { quantity: newQty, updatedAt: now });
                })
            );
        } else if (product.linkedStockItemId) {
            const itemPath = `${stockBase}/${product.linkedStockItemId}`;
            const stockItem = await Nexus.adapter.get<{ quantity?: number }>(itemPath);
            if (stockItem) {
                const newQty = Math.max(0, (stockItem.quantity ?? 0) - quantity);
                await Nexus.adapter.update(itemPath, { quantity: newQty, updatedAt: now });
            }
        }
    };

    return {
        data: stockItems,
        stockItems,
        ingredients: ingredients.map(i => mapNodeToIngredient(i as unknown as SovereignNode, now)),
        preparations,
        storageLocations,
        wasteLogs,
        lowStockItems,
        isLoading: stockNode.loading || ingredientsNode.loading,
        error: stockNode.error || ingredientsNode.error,
        receiveOrder,
        cancelOrder,
        addStockItem,
        addPreparation,
        addWaste,
        transferStock,
        consumeStock,
        deductStockForProduct,
    };
}
