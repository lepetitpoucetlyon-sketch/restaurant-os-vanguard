"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { useCallback } from "react";
import { ordersNodeAtom, pendingModificationsAtom, updateNexusNode } from "@/store/operationalAtoms";
import { useVisibilityPurge } from "@/hooks/useVisibilityPurge";

/**
 * 📦 useOrders - Grade VI Atomic Bridge
 * Orchestration des commandes et du flux KDS.
 */
export function useOrders() {
    useVisibilityPurge('orders');
    const node = useAtomValue(ordersNodeAtom);
    const setNode = useSetAtom(ordersNodeAtom);
    const pendingModifications = useAtomValue(pendingModificationsAtom);
    
    const updateOrderStatus = useCallback(async (orderId: string, status: string) => {
        setNode(prev => updateNexusNode(prev, (orders) => 
            orders.map(o => o.id === orderId ? { ...o, status } : o)
        ));
    }, [setNode]);

    const stats = {
        totalRevenue: (node.data || []).reduce((acc, o) => acc + (o.totalInCents || 0), 0) / 100,
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
        // Sync avec NexusOps legacy support
        data: node.data || [],
        addOrder: async (order: any) => {
            setNode(prev => updateNexusNode(prev, (orders) => [order, ...orders]));
        }
    };
}
