"use client";

import { useAtomValue } from "jotai";
import { useCallback } from "react";
import { ordersNodeAtom, pendingModificationsAtom } from "../store/orderAtoms";
import { useVisibilityPurge } from "@/hooks/useVisibilityPurge";
import { useNexusMutation } from "@/shared/hooks/useNexusMutation";
import { Order, OrderStatus } from "../types";

/**
 * 📦 useOrders - Grade X Atomic Bridge
 * Orchestration des commandes et du flux KDS.
 */
export function useOrders() {
    useVisibilityPurge('orders');
    const node = useAtomValue(ordersNodeAtom);
    const pendingModifications = useAtomValue(pendingModificationsAtom);
    
    const ordersNode = useAtomValue(ordersNodeAtom);
    const orderForge = useNexusMutation<Order>(ordersNodeAtom as any, 'orders', 'KITCHEN');
    
    const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus) => {
        return orderForge.mutate('UPDATE', orderId, { status } as Partial<Order>);
    }, [orderForge]);

    const stats = {
        totalRevenue: (node.data || []).reduce((acc: number, o: Order) => acc + (o.totalInCents || 0), 0) / 100,
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
        addOrder: async (order: Order) => {
            const orderId = order.id || `ord_${Date.now()}`;
            return orderForge.mutate('SET', orderId, order);
        },
        
        // Sync avec NexusOps legacy support
        data: node.data || []
    };
}
