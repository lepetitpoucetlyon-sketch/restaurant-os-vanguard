"use client";

import { useCallback } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { tablesNodeAtom } from "@/store/operationalAtoms";
import { useVisibilityPurge } from "@/hooks/useVisibilityPurge";

/**
 * 🪑 useTables - Grade VI Atomic Bridge
 * Orchestration spatiale du restaurant et gestion des zones de service.
 */
export function useTables() {
    useVisibilityPurge('tables');
    const node = useAtomValue(tablesNodeAtom);
    const tables = node.data || [];
    const floors: any[] = []; 
    const zones: any[] = []; 

    const getTablesForFloor = useCallback((floorId: string) => 
        (tables || []).filter((t: any) => t.floorId === floorId), 
        [tables]
    );

    const getZonesForFloor = useCallback((floorId: string) => 
        (zones || []).filter((z: any) => z.floorId === floorId), 
        [zones]
    );

    return { 
        tables,
        data: tables,
        floors,
        zones,
        isZonesLocked: false,
        toggleZonesLock: () => {},
        currentFloorId: null,
        setCurrentFloor: () => {},
        getTablesForFloor,
        getZonesForFloor,
        addTable: async (table: any) => console.log('[Tables] Add:', table),
        updateTable: async (id: string, data: any) => console.log('[Tables] Update:', id, data),
        updateTablePosition: async (id: string, x: number, y: number) => console.log('[Tables] Move:', id, x, y),
        deleteTable: async (id: string) => console.log('[Tables] Delete:', id),
        addFloor: async (floor: any) => console.log('[Floors] Add:', floor),
        resetToTemplate: (template: string) => console.log('[Tables] Reset:', template),
        updateZone: (id: string, data: any) => console.log('[Zones] Update:', id, data),
        isLoading: node.loading, 
        error: node.error 
    };
}
