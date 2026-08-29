'use client';

import { useMemo, useState, useEffect } from 'react';
import { useKitchen } from '../../../providers/hooks/kitchenHooks';
import { KitchenStation, resolveStation } from '../contracts/kds-constants';
import type { Order, OrderItem } from '@nexus/contracts';
import { useAuth } from '@/infrastructure/auth/hooks/useAuth';

function resolveLockedStation(role?: string): KitchenStation | null {
    if (!role) return null;
    const roleMap: Record<string, KitchenStation> = {
        bartender: 'bar',
        chef_grill: 'hot',
        chef_pastry: 'pastry',
        chef_cold: 'cold',
    };
    return roleMap[role] ?? null;
}

function filterOrdersByStationAndSearch(orders: Order[], station: KitchenStation, searchQuery: string): Order[] {
    let result = (orders ?? []).filter(o => o?.status !== 'delivered');

    if (station !== 'all') {
        result = result
            .filter(order => (order.items || []).some((item: OrderItem) => resolveStation(item.name) === station))
            .map(order => ({
                ...order,
                items: (order.items || []).filter((item: OrderItem) => resolveStation(item.name) === station),
            }));
    }

    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        result = result.filter(o =>
            (o.tableNumber || "").toLowerCase().includes(query) ||
            (o.serverName || "").toLowerCase().includes(query)
        );
    }

    return result.sort((a, b) => {
        const isAReady = a?.status === 'ready';
        const isBReady = b?.status === 'ready';
        if (isAReady !== isBReady) return isAReady ? 1 : -1;
        return new Date(a.timestamp ?? 0).getTime() - new Date(b.timestamp ?? 0).getTime();
    });
}

/**
 * 👨‍🍳 useKDSController - Grade X Domain Logic
 */
export const useKDSController = () => {
    const { nodes: orders, updateOrderStatus, getPendingModifications, isLoading, error } = useKitchen();
    const { currentUser } = useAuth();

    
    // RBAC Station Locking
    const lockedStation = useMemo(
        () => resolveLockedStation(currentUser?.role),
        [currentUser?.role]
    );

    // UI State managed at domain level
    const [activeStation, _setActiveStation] = useState<KitchenStation>(() => {
        if (lockedStation) return lockedStation;
        try { return (localStorage.getItem('kds-active-station') as KitchenStation) || 'all'; } 
        catch { return 'all'; }
    });

    useEffect(() => {
        if (lockedStation && activeStation !== lockedStation) {
            _setActiveStation(lockedStation);
        }
    }, [lockedStation, activeStation]);

    const setActiveStation = (s: KitchenStation) => {
        if (lockedStation) return; // Ignore si verrouillé
        _setActiveStation(s);
        try { localStorage.setItem('kds-active-station', s); } catch { /* LocalStorage non disponible */ }
    };

    const [rushMode, setRushMode] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // --- Filtering & Sorting Logic (Grade X) ---
    const filteredOrders = useMemo(
        () => filterOrdersByStationAndSearch(orders as Order[], activeStation, searchQuery),
        [orders, activeStation, searchQuery]
    );

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
        lockedStation,
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

