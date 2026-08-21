"use client";

/**
 * useSovereignEquipment — Adapter souverain pour `equipmentAssets` (facility).
 * ADR-013 Phase 5.
 * Cas d'usage : responsable maintenance qui inventorie/audite les frigos en cave.
 */

import { useCallback, useMemo } from 'react';
import { useSovereignCollection } from '@/kernel/hooks/useSovereignCollection';
import type { EquipmentAsset } from '@/modules/facility/assets/domain/schemas/equipment';

export type SovereignEquipmentStatus = 'OPERATIONAL' | 'MAINTENANCE' | 'BROKEN' | 'RETIRED';

export interface UseSovereignEquipmentOptions {
    tenantId: string;
    statusFilter?: SovereignEquipmentStatus | SovereignEquipmentStatus[] | 'all';
    location?: string;
    autoSync?: boolean;
}

export interface CreateEquipmentInput {
    name: string;
    category: EquipmentAsset['category'];
    brand: string;
    model: string;
    serialNumber: string;
    location?: string;
    nextMaintenanceDueAt?: string;
    maintenanceFrequencyDays?: number;
}

export interface UseSovereignEquipmentResult {
    data: EquipmentAsset[];
    isLoading: boolean;
    isSyncing: boolean;
    error: string | null;

    create: (input: CreateEquipmentInput) => Promise<string>;
    setStatus: (id: string, status: SovereignEquipmentStatus) => Promise<void>;
    stampMaintenance: (id: string, nextDueDaysFromNow?: number) => Promise<void>;
    retire: (id: string) => Promise<void>;
    remove: (id: string) => Promise<void>;
    refresh: () => Promise<void>;
}

const nowIso = () => new Date().toISOString();

export function useSovereignEquipment(options: UseSovereignEquipmentOptions): UseSovereignEquipmentResult {
    const { tenantId, statusFilter = 'all', location, autoSync } = options;

    const filter = useMemo(() => {
        if (statusFilter === 'all' && !location) return undefined;
        const statuses = statusFilter === 'all'
            ? null
            : Array.isArray(statusFilter) ? statusFilter : [statusFilter];
        return (e: EquipmentAsset) => {
            if (statuses && !statuses.includes(e.status as SovereignEquipmentStatus)) return false;
            if (location && e.location !== location) return false;
            return true;
        };
    }, [statusFilter, location]);

    const {
        data, isLoading, isSyncing, error,
        set, update, delete: del, refresh,
    } = useSovereignCollection<EquipmentAsset>('equipmentAssets', { tenantId, autoSync, filter });

    const create = useCallback(async (input: CreateEquipmentInput): Promise<string> => {
        const id = `eq_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const now = nowIso();
        const days = input.maintenanceFrequencyDays ?? 90;
        const nextDue = input.nextMaintenanceDueAt
            ?? new Date(Date.now() + days * 86400_000).toISOString();
        const asset: EquipmentAsset = {
            id,
            tenantId,
            name: input.name,
            category: input.category,
            brand: input.brand,
            model: input.model,
            serialNumber: input.serialNumber,
            location: input.location ?? 'Cuisine Principale',
            status: 'OPERATIONAL',
            maintenanceFrequencyDays: days,
            nextMaintenanceDueAt: nextDue,
            createdAt: now,
            updatedAt: now,
        } as unknown as EquipmentAsset;
        await set(asset);
        return id;
    }, [set, tenantId]);

    const setStatus = useCallback(async (id: string, status: SovereignEquipmentStatus) => {
        await update(id, { status, updatedAt: nowIso() } as Partial<EquipmentAsset>);
    }, [update]);

    const stampMaintenance = useCallback(async (id: string, nextDueDaysFromNow?: number) => {
        const now = nowIso();
        const nextDue = new Date(Date.now() + (nextDueDaysFromNow ?? 90) * 86400_000).toISOString();
        await update(id, {
            lastMaintenanceAt: now,
            nextMaintenanceDueAt: nextDue,
            status: 'OPERATIONAL',
            updatedAt: now,
        } as Partial<EquipmentAsset>);
    }, [update]);

    const retire = useCallback((id: string) => setStatus(id, 'RETIRED'), [setStatus]);

    return {
        data, isLoading, isSyncing, error,
        create, setStatus, stampMaintenance, retire,
        remove: del, refresh,
    };
}
