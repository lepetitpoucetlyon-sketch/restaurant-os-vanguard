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
import { StockItem } from "../types";
import { SovereignNode, SovereignData, OperationalIdentity } from "@shared/nexus-contract";
import { tenantIdAtom } from "@/store/pillars/sovereign";
import { DomainRegistry } from "@shared/nexus/engines/DomainRegistry";
import { Nexus } from "@/lib/nexus/NexusAdapter";

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
    const toIngredient = (n: SovereignNode): import('@nexus/contracts').Ingredient => {
        const attr = (n.attributes || {}) as Record<string, any>;
        return {
            id: String(n.id),
            name: String(attr.name || ''),
            unit: (attr.unit || 'u') as import('@nexus/contracts').IngredientUnit,
            quantity: Number(attr.quantity || 0),
            minQuantity: Number(attr.minQuantity || 0),
            categoryId: String(attr.categoryId || ''),
            pricePerUnitInCents: Number(attr.pricePerUnitInCents || 0),
            costInCents: Number(attr.costInCents || 0),
            category: (attr.category || 'other') as any,
            supplier: (attr.supplier || '') as any,
            defaultStorageLocation: (attr.defaultStorageLocation || '') as any,
            createdAt: typeof n.createdAt === 'string' ? n.createdAt : now,
            updatedAt: now
        } as unknown as any;
    };

    const stockItems = (stockNode.data || []) as any[];
    const ingredients = (ingredientsNode.data || []) as any[];
    const preparations = (preparationsNode.data || []) as any[];
    const storageLocations = (storageNode.data || []) as any[];
    const wasteLogs = (wasteNode.data || []) as any[];

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

    const transferStock = async (id: string, locationId: string, qty: number) => {
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
            createdAt: now,
            updatedAt: now
        } as unknown as any);
    };

    return { 
        data: stockItems as StockItem[], 
        stockItems: stockItems as StockItem[],
        ingredients: ingredients.map(i => toIngredient(i as SovereignNode)),
        preparations: preparations as SovereignNode[],
        storageLocations: storageLocations as SovereignNode[],
        wasteLogs: wasteLogs as unknown as any[],
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
