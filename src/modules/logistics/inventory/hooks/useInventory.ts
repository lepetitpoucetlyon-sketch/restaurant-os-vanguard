"use client";

import { useMemo, useCallback } from "react";
import { useAtomValue } from "jotai";
import { 
    stockItemsNodeAtom, 
    ingredientsNodeAtom, 
    preparationsNodeAtom, 
    storageLocationsNodeAtom 
} from "../store/inventoryAtoms";
        // FIXME (Modular Monolith): Remove cross-module import. Use domain/ or NexusEventBus.
        // eslint-disable-next-line vanguard/no-inter-module-imports
import { wasteLogsNodeAtom } from "@/modules/compliance/haccp/store";
import { useVisibilityPurge } from "@/shared/hooks/useVisibilityPurge";
import { SovereignNode, SovereignData, OperationalIdentity } from "@shared/nexus-contract";
import { tenantIdAtom } from "@/store/pillars/sovereign";
import { DomainRegistry } from "@shared/nexus/engines/DomainRegistry";
import { Nexus } from "@/lib/nexus/NexusAdapter";
import { StockItem, Preparation, StorageLocation } from "@shared/nexus/contracts/logistics";
import { mapNodeToIngredient } from "./inventoryMappers";
import { logger } from "@/lib/logger";

/**
 * 🥫 useInventory - Grade X Atomic Bridge (Source of Truth)
 * Centralisation de la gestion des stocks et de la chaîne d'approvisionnement.
 */
async function deductByRecipe(tenantId: string, recipeId: string, stockBase: string, quantity: number) {
    const recipe = await Nexus.adapter.get<{ ingredients?: Array<{ ingredientId: string; quantity: number }> }>(
        `tenants/${tenantId}/recipes/${recipeId}`
    );
    await Promise.allSettled(
        (recipe?.ingredients ?? []).map(async (ing) => {
            if (!ing.ingredientId) return;
            const itemPath = `${stockBase}/${ing.ingredientId}`;
            const stockItem = await Nexus.adapter.get<{ quantity?: number }>(itemPath);
            if (!stockItem) return;
            const newQty = Math.max(0, (stockItem.quantity ?? 0) - ing.quantity * quantity);
            await Nexus.adapter.update(itemPath, { quantity: newQty, updatedAt: new Date().toISOString() });
        })
    );
}

async function deductDirectItem(stockBase: string, itemId: string, quantity: number) {
    const itemPath = `${stockBase}/${itemId}`;
    const stockItem = await Nexus.adapter.get<{ quantity?: number }>(itemPath);
    if (!stockItem) return;
    const newQty = Math.max(0, (stockItem.quantity ?? 0) - quantity);
    await Nexus.adapter.update(itemPath, { quantity: newQty, updatedAt: new Date().toISOString() });
}

async function deductStock(tenantId: string, productId: string, quantity: number) {
    const product = await Nexus.adapter.get<{ linkedStockItemId?: string; recipeId?: string }>(
        `tenants/${tenantId}/products/${productId}`
    );
    if (!product) return;
    const stockBase = `tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.RESOURCES)}`;
    if (product.recipeId) {
        await deductByRecipe(tenantId, product.recipeId, stockBase, quantity);
    } else if (product.linkedStockItemId) {
        await deductDirectItem(stockBase, product.linkedStockItemId, quantity);
    }
}

export function useInventory() {
    useVisibilityPurge('stockItems');
    const tenantId = useAtomValue(tenantIdAtom);

    const stockNode = useAtomValue(stockItemsNodeAtom);
    const ingredientsNode = useAtomValue(ingredientsNodeAtom);
    const preparationsNode = useAtomValue(preparationsNodeAtom);
    const storageNode = useAtomValue(storageLocationsNodeAtom);
    const wasteNode = useAtomValue(wasteLogsNodeAtom);

    const stockItems = (stockNode.data ?? []) as StockItem[];
    const preparations = (preparationsNode.data ?? []) as Preparation[];
    const storageLocations = (storageNode.data ?? []) as StorageLocation[];
    const wasteLogs = (wasteNode.data ?? []) as unknown[]; // WasteLog mapping later

    const lowStockItems = useMemo(() =>
        stockItems.filter((i: StockItem) => i.quantity <= (i.minQuantity || 0)),
        [stockItems]
    );

    // Mémoïsé sur ingredientsNode.data : re-calcule seulement quand les données changent,
    // pas à chaque render. Le timestamp est capturé au moment du changement de données.
    const ingredients = useMemo(() =>
        (ingredientsNode.data ?? []).map(i => mapNodeToIngredient(i as unknown as SovereignNode, new Date().toISOString())),
        [ingredientsNode.data]
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
        await Nexus.adapter.create(path, { ...data, updatedAt: new Date().toISOString() });
    };

    const addPreparation = async (data: Partial<SovereignNode>) => {
        if (!tenantId) return;
        const path = `tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.RESOURCES)}`;
        await Nexus.adapter.create(path, { ...data, updatedAt: new Date().toISOString() });
    };

    const addWaste = async (data: Partial<SovereignNode>) => {
        if (!tenantId) return;
        const path = `tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.FLOWS)}`;
        await Nexus.adapter.create(path, { ...data, updatedAt: new Date().toISOString() });
    };

    const transferStock = async (id: string, locationId: string, _qty: number) => {
        if (!tenantId) return;
        const path = `tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.RESOURCES)}/${id}`;
        await Nexus.adapter.update(path, {
            locationId,
            updatedAt: new Date().toISOString(),
        });
    };

    const consumeStock = async (id: string, qty: number, reason?: string) => {
        if (!tenantId) return;
        const path = `tenants/${tenantId}/${DomainRegistry.resolve(OperationalIdentity.RESOURCES)}/${id}`;
        await Nexus.adapter.update(path, {
            lastConsumption: qty,
            lastReason: reason,
            updatedAt: new Date().toISOString(),
        });
    };

    const deductStockForProduct = async (productId: string, quantity: number) => {
        if (!tenantId) return;
        await deductStock(tenantId, productId, quantity);
    };

    return {
        data: stockItems,
        stockItems,
        ingredients,
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
