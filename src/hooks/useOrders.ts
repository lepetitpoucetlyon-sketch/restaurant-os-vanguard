"use client";

import { useAtomValue } from "jotai";
import { useCallback } from "react";
import { ordersNodeAtom, pendingModificationsAtom } from "@/store/operationalAtoms";
import { useVisibilityPurge } from "@/hooks/useVisibilityPurge";
import { useNexusMutation } from "./useNexusMutation";

/**
 * 📦 useOrders - Grade VI Atomic Bridge
 * Orchestration des commandes et du flux KDS.
 */
export function useOrders() {
    useVisibilityPurge('orders');
    const node = useAtomValue(ordersNodeAtom);
    const pendingModifications = useAtomValue(pendingModificationsAtom);
    
    // --- 🔨 LA FORGE ---
    const orderForge = useNexusMutation(ordersNodeAtom, 'orders', 'POS');
    
    const updateOrderStatus = useCallback(async (orderId: string, status: any) => {
        return orderForge.mutate('UPDATE', orderId, { status });
    }, [orderForge]);

    const stats = {
        totalRevenue: (node.data || []).reduce((acc: number, o: any) => acc + (o.totalInCents || 0), 0) / 100,
        expert: true
    };

    return { 
        orders: node.data || [], 
        isLoading: node.loading, 
        error: node.error,
        getPendingModifications: () => pendingModifications,
        updateOrderStatus,
        totalRevenue: stats.totalRevenue,
        expert: stats.expert,
        
        // --- Forge Actions ---
        addOrder: async (order: any) => {
            const orderId = order.id || `ord_${Date.now()}`;
            return orderForge.mutate('SET', orderId, order);
        },
        
        // Sync avec NexusOps legacy support
        data: node.data || []
    };
}
