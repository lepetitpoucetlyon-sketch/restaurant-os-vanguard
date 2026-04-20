"use client";

import { useMemo, useCallback } from "react";
import { useAtomValue } from "jotai";
import { stockItemsNodeAtom } from "../store/inventoryAtoms";
import { useVisibilityPurge } from "@/hooks/useVisibilityPurge";
import { StockItem } from "../types";

/**
 * 🥫 useInventory - Grade X Atomic Bridge
 * Centralisation de la gestion des stocks et de la chaîne d'approvisionnement.
 */
export function useInventory() {
    useVisibilityPurge('stockItems');
    const node = useAtomValue(stockItemsNodeAtom);
    const stockItems = (node.data || []) as StockItem[];

    const lowStockItems = useMemo(() => 
        stockItems.filter((i: StockItem) => i.quantity <= (i.minQuantity || 0)), 
        [stockItems]
    );

    const receiveOrder = useCallback((id: string, data: any) => {
        console.log('[Inventory] Bridge: Receive Order', id, data);
    }, []);

    const cancelOrder = useCallback((id: string) => {
        console.log('[Inventory] Bridge: Cancel Order', id);
    }, []);

    return { 
        stockItems, 
        ingredients: [], // To be expanded with domain filtering
        preparations: [],
        supplierOrders: [],
        storageLocations: [],
        lowStockItems, 
        isLoading: node.loading, 
        error: node.error,
        receiveOrder,
        cancelOrder,
        // Sync avec NexusOps legacy support
        data: stockItems
    };
}
