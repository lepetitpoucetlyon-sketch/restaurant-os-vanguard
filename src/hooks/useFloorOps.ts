// @ts-nocheck
// @ts-nocheck
'use client';

import { useAtom } from 'jotai';
import { tablesAtom, tablesLoadingAtom } from '@/store/operationalAtoms';
import { Table, TableStatus } from '@/types';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { useCallback, useEffect } from 'react';

/**
 * 🍷 useFloorOps (Grade IX)
 * Unified hook for floor plan and table management.
 * Replaces the legacy usePMS hotel-centric logic.
 */
export function useFloorOps() {
    const [tables, setTables] = useAtom(tablesAtom);
    const [isLoading, setIsLoading] = useAtom(tablesLoadingAtom);

    const refreshTables = useCallback(async () => {
        setIsLoading(true);
        try {
            // Nexus.adapter resolves the tenant path automatically in Grade IX
            const data = await Nexus.adapter.get<Table[]>('tables');
            if (data && Array.isArray(data)) {
                setTables(data);
            }
        } finally {
            setIsLoading(false);
        }
    }, [setTables, setIsLoading]);

    const updateTableStatus = useCallback(
        async (tableId: string, status: TableStatus) => {
            // Updated path to be restaurant-centric
            await Nexus.adapter.update(`tables/${tableId}`, { status, updatedAt: new Date().toISOString() });

            // Optimistic update
            setTables((prev) => prev.map((t) => (t.id === tableId ? { ...t, status } : t)));
        },
        [setTables],
    );

    useEffect(() => {
        if (tables.length === 0) {
            refreshTables();
        }
    }, [tables.length, refreshTables]);

    return {
        tables,
        isLoading,
        updateTableStatus,
        refreshTables,
    };
}
