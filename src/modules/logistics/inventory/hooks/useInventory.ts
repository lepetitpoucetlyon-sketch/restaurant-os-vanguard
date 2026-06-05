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
import { SovereignNode, SovereignData, OperationalIdentity, SovereignField } from "@shared/nexus-contract";
import { tenantIdAtom } from "@/store/pillars/sovereign";
import { DomainRegistry } from "@shared/nexus/engines/DomainRegistry";
import { Nexus } from "@/lib/nexus/NexusAdapter";
import { Ingredient, StockItem, Preparation, StorageLocation, IngredientUnit, IngredientCategory } from "@shared/nexus/contracts/logistics";

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

    // 🛡️ SOVEREIGN MAPPING (Grade X)
    const toIngredient = (n: SovereignNode): Ingredient => {
        const attr = (n.attributes || {}) as Record<string, SovereignField>;
        return {
            id: String(n.id),
            name: String(attr.name || ''),
            unit: (attr.unit || 'unit') as IngredientUnit,
            minQuantity: Number(attr.minQuantity || 0),
            costInCents: Number(attr.costInCents || 0),
            category: (attr.category || 'other') as IngredientCategory,
            supplier: String(attr.supplier || ''),
            defaultStorageLocation: String(attr.defaultStorageLocation || ''),
            createdAt: typeof n.createdAt === 'string' ? n.createdAt : now,
            updatedAt: now
        } as Ingredient;
    };

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
        console.log('[Inventory] Bridge: Receive Order', id, data);
    }, []);

    const cancelOrder = useCallback((id: string) => {
        console.log('[Inventory] Bridge: Cancel Order', id);
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

    return { 
        data: stockItems, 
        stockItems,
        ingredients: ingredients.map(i => toIngredient(i as unknown as SovereignNode)),
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
        consumeStock
    };
}
