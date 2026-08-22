"use client";

/**
 * useSovereignBreakdowns — Adapter souverain pour `equipmentBreakdowns` (facility).
 * ADR-013 Phase 5.
 * Cas d'usage : ticket incident maintenance capté en cave (sans wifi), sync
 * dès reconnexion — plus jamais d'incident perdu dans un trou réseau.
 */

import { useCallback, useMemo } from 'react';
import { useSovereignCollection } from '@/kernel/hooks/useSovereignCollection';
import type { EquipmentBreakdown } from '@/modules/facility';

export type BreakdownStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'WAITING_PARTS';

export interface UseSovereignBreakdownsOptions {
    tenantId: string;
    statusFilter?: BreakdownStatus | BreakdownStatus[] | 'all';
    equipmentId?: string;
    autoSync?: boolean;
}

export interface CreateBreakdownInput {
    equipmentId: string;
    equipmentName: string;
    severity: EquipmentBreakdown['severity'];
    symptom: string;
    declaredBy: string;
    errorCode?: string;
    photoUrl?: string;
}

export interface UseSovereignBreakdownsResult {
    data: EquipmentBreakdown[];
    isLoading: boolean;
    isSyncing: boolean;
    error: string | null;

    create: (input: CreateBreakdownInput) => Promise<string>;
    startWork: (id: string) => Promise<void>;
    setWaitingParts: (id: string, partsMissing?: string[]) => Promise<void>;
    resolve: (id: string, notes?: string, costInMicrounits?: number, partsReplaced?: string[]) => Promise<void>;
    remove: (id: string) => Promise<void>;
    refresh: () => Promise<void>;
}

const nowIso = () => new Date().toISOString();

export function useSovereignBreakdowns(options: UseSovereignBreakdownsOptions): UseSovereignBreakdownsResult {
    const { tenantId, statusFilter = 'all', equipmentId, autoSync } = options;

    const filter = useMemo(() => {
        if (statusFilter === 'all' && !equipmentId) return undefined;
        const statuses = statusFilter === 'all'
            ? null
            : Array.isArray(statusFilter) ? statusFilter : [statusFilter];
        return (b: EquipmentBreakdown) => {
            if (statuses && !statuses.includes(b.status as BreakdownStatus)) return false;
            if (equipmentId && b.equipmentId !== equipmentId) return false;
            return true;
        };
    }, [statusFilter, equipmentId]);

    const {
        data, isLoading, isSyncing, error,
        set, update, delete: del, refresh,
    } = useSovereignCollection<EquipmentBreakdown>('equipmentBreakdowns', { tenantId, autoSync, filter });

    const create = useCallback(async (input: CreateBreakdownInput): Promise<string> => {
        const id = `brk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const breakdown: EquipmentBreakdown = {
            id,
            tenantId,
            equipmentId: input.equipmentId,
            equipmentName: input.equipmentName,
            severity: input.severity,
            errorCode: input.errorCode,
            symptom: input.symptom,
            declaredBy: input.declaredBy,
            declaredAt: nowIso(),
            status: 'OPEN',
            photoUrl: input.photoUrl,
            partsReplaced: [],
        } as unknown as EquipmentBreakdown;
        await set(breakdown);
        return id;
    }, [set, tenantId]);

    const startWork = useCallback(async (id: string) => {
        await update(id, { status: 'IN_PROGRESS' } as Partial<EquipmentBreakdown>);
    }, [update]);

    const setWaitingParts = useCallback(async (id: string, _partsMissing?: string[]) => {
        await update(id, { status: 'WAITING_PARTS' } as Partial<EquipmentBreakdown>);
    }, [update]);

    const resolve = useCallback(async (id: string, notes?: string, costInMicrounits?: number, partsReplaced?: string[]) => {
        await update(id, {
            status: 'RESOLVED',
            resolvedAt: nowIso(),
            resolutionNotes: notes,
            costInMicrounits,
            partsReplaced: partsReplaced ?? [],
        } as Partial<EquipmentBreakdown>);
    }, [update]);

    return {
        data, isLoading, isSyncing, error,
        create, startWork, setWaitingParts, resolve,
        remove: del, refresh,
    };
}
