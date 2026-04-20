'use client';

import { useAtom } from 'jotai';
import { tablesNodeAtom, tablesLoadingAtom } from '../store/orderAtoms';
import { updateNexusNode } from '@/store/nexusNodeFactory';
import { Table, TableStatus } from '@/types';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { useCallback, useEffect } from 'react';

/**
 * 🍷 useFloorOps (Grade IX)
 * Unified hook for floor plan and table management.
 * Replaces the legacy usePMS hotel-centric logic.
 */
export function useFloorOps() {
    const [tablesNode, setTablesNode] = useAtom(tablesNodeAtom);
    const tables = tablesNode.data;
    const isLoading = tablesNode.loading;

    const refreshTables = useCallback(async () => {
        setTablesNode(prev => updateNexusNode(prev, { loading: true }));
        try {
            // Nexus.adapter resolves the tenant path automatically in Grade IX
            const data = await Nexus.adapter.query<Table>('tables');
            if (data && Array.isArray(data)) {
                setTablesNode(prev => updateNexusNode(prev, { data, loading: false }));
            }
        } finally {
            setTablesNode(prev => updateNexusNode(prev, { loading: false }));
        }
    }, [setTablesNode]);

    const updateTableStatus = useCallback(
        async (tableId: string, status: TableStatus) => {
            // Updated path to be restaurant-centric
            await Nexus.adapter.update(`tables/${tableId}`, { status, updatedAt: new Date().toISOString() });

            // Optimistic update
            setTablesNode((prev) => updateNexusNode(prev, { 
                data: prev.data.map((t) => (t.id === tableId ? { ...t, status } : t))
            }));
        },
        [setTablesNode],
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
