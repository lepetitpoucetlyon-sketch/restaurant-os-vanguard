import { useMemo, useState } from 'react';
import { useKitchen } from '@/modules/ops/providers/NexusOpsProvider';
import { KitchenStation, resolveStation } from '../contracts/kds-constants';
import { Order } from '@nexus/contracts';

/**
 * 👨‍🍳 useKDSController - Grade X Domain Logic
 */
export const useKDSController = () => {
    const { nodes: orders, updateOrderStatus, getPendingModifications, isLoading, error } = useKitchen();
    
    // UI State managed at domain level
    const [activeStation, setActiveStation] = useState<KitchenStation>('all');
    const [rushMode, setRushMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // --- Filtering & Sorting Logic (Grade X) ---
    const filteredOrders = useMemo(() => {
        const activeOrders = (orders as Order[]).filter(o => o?.status !== 'delivered');
        let result = activeOrders;

        if (activeStation !== 'all') {
            result = result.filter(order =>
                order.items.some(item => (resolveStation(item.name)) === activeStation)
            ).map(order => ({
                ...order,
                items: order.items.filter(item => (resolveStation(item.name)) === activeStation)
            }));
        }

        if (searchQuery) {
            result = result.filter(o =>
                (o.tableNumber || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                (o.serverName || "").toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        return result.sort((a, b) => {
            const isAReady = a?.status === 'ready';
            const isBReady = b?.status === 'ready';
            if (isAReady && !isBReady) return 1;
            if (!isAReady && isBReady) return -1;
            return new Date(a.timestamp ?? 0).getTime() - new Date(b.timestamp ?? 0).getTime();
        });
    }, [orders, activeStation, searchQuery]);

    const preparingOrdersCount = useMemo(() => 
        orders.filter((o) => (o as { status?: string })?.status === 'preparing' || o?.status === 'new').length,
    [orders]);

    const pendingModificationsCount = useMemo(() => 
        getPendingModifications().length,
    [getPendingModifications]);

    return {
        // Data
        orders: filteredOrders,
        allOrders: orders,
        isLoading,
        error,
        
        // Counters
        preparingOrdersCount,
        pendingModificationsCount,
        
        // State & Actions
        activeStation,
        setActiveStation,
        rushMode,
        setRushMode,
        searchQuery,
        setSearchQuery,
        
        // Mutations
        updateOrderStatus,
        getPendingModifications
    };
};
