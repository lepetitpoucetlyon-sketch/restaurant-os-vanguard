"use client";

/**
 * useSovereignTables — Adapter du kernel `useSovereignCollection`
 * pour la collection MUTABLE `tables` du pilier ops (plan de salle).
 *
 * ADR-010 Phase 2 — Migration ops vers useSovereignCollection.
 *
 * Cycle de vie d'une table :
 *   free/available → occupied → cleaning → available
 *                 ↘ reserved
 *                 ↘ locked (maintenance)
 *
 * MUTABLE, hors NF525.
 *
 * Usage :
 *   const { data, setStatus, updatePosition, updateSeats } =
 *     useSovereignTables({ tenantId });
 */

import { useCallback, useMemo } from 'react';
import { useSovereignCollection } from '@/kernel/hooks/useSovereignCollection';
import type { Table } from '../domain/schemas/ops';

export type TableStatus = 'free' | 'available' | 'occupied' | 'reserved' | 'cleaning' | 'locked';

export interface UseSovereignTablesOptions {
    tenantId: string;
    zoneId?: string;
    floorId?: string;
    statusFilter?: TableStatus | TableStatus[] | 'all';
    autoSync?: boolean;
}

export interface CreateTableInput {
    number: string;
    seats: number;
    x: number;
    y: number;
    zoneId: string;
    floorId?: string;
    shape?: 'rect' | 'circle';
    width?: number;
    height?: number;
    radius?: number;
    name?: string;
}

export interface UseSovereignTablesResult {
    data: Table[];
    isLoading: boolean;
    isSyncing: boolean;
    error: string | null;

    create: (input: CreateTableInput) => Promise<string>;
    setStatus: (id: string, status: TableStatus) => Promise<void>;
    updatePosition: (id: string, x: number, y: number) => Promise<void>;
    updateSeats: (id: string, seats: number) => Promise<void>;
    /** Marque libre (raccourci). */
    free: (id: string) => Promise<void>;
    /** Marque occupée (raccourci). */
    occupy: (id: string) => Promise<void>;
    /** Marque en nettoyage. */
    setCleaning: (id: string) => Promise<void>;
    remove: (id: string) => Promise<void>;
    refresh: () => Promise<void>;
}

const now = (): number => Date.now();

export function useSovereignTables(
    options: UseSovereignTablesOptions,
): UseSovereignTablesResult {
    const { tenantId, zoneId, floorId, statusFilter = 'all', autoSync } = options;

    const filter = useMemo(() => {
        if (statusFilter === 'all' && !zoneId && !floorId) return undefined;
        const statuses = statusFilter === 'all'
            ? null
            : Array.isArray(statusFilter) ? statusFilter : [statusFilter];
        return (item: Table) => {
            if (statuses && !statuses.includes(item.status as TableStatus)) return false;
            if (zoneId && item.zoneId !== zoneId) return false;
            if (floorId && item.floorId !== floorId) return false;
            return true;
        };
    }, [statusFilter, zoneId, floorId]);

    const {
        data,
        isLoading,
        isSyncing,
        error,
        set,
        update,
        delete: del,
        refresh,
    } = useSovereignCollection<Table>('tables', {
        tenantId,
        autoSync,
        filter,
    });

    const create = useCallback(async (input: CreateTableInput): Promise<string> => {
        const id = `tbl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const table: Table = {
            id,
            type: 'table',
            number: input.number,
            name: input.name,
            seats: input.seats,
            status: 'free',
            x: input.x,
            y: input.y,
            width: input.width,
            height: input.height,
            radius: input.radius,
            zoneId: input.zoneId,
            floorId: input.floorId,
            shape: input.shape ?? 'rect',
            schemaVersion: 2,
            updatedAt: now(),
        } as unknown as Table;
        await set(table);
        return id;
    }, [set]);

    const setStatus = useCallback(async (id: string, status: TableStatus) => {
        await update(id, {
            status,
            updatedAt: now(),
        } as unknown as Partial<Table>);
    }, [update]);

    const updatePosition = useCallback(async (id: string, x: number, y: number) => {
        await update(id, {
            x, y,
            updatedAt: now(),
        } as unknown as Partial<Table>);
    }, [update]);

    const updateSeats = useCallback(async (id: string, seats: number) => {
        if (seats < 1) throw new Error('[useSovereignTables] seats doit être >= 1');
        await update(id, {
            seats,
            updatedAt: now(),
        } as unknown as Partial<Table>);
    }, [update]);

    const free = useCallback((id: string) => setStatus(id, 'free'), [setStatus]);
    const occupy = useCallback((id: string) => setStatus(id, 'occupied'), [setStatus]);
    const setCleaning = useCallback((id: string) => setStatus(id, 'cleaning'), [setStatus]);

    return {
        data,
        isLoading,
        isSyncing,
        error,
        create,
        setStatus,
        updatePosition,
        updateSeats,
        free,
        occupy,
        setCleaning,
        remove: del,
        refresh,
    };
}
