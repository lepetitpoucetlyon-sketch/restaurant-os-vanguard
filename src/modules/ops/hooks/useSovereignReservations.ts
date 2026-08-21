"use client";

/**
 * useSovereignReservations — Adapter du kernel `useSovereignCollection`
 * pour la collection MUTABLE `reservations` (booking client).
 *
 * ADR-010 Phase 2 — Migration ops vers useSovereignCollection.
 *
 * Cycle de vie :
 *   pending → confirmed → seated → completed
 *                     ↘ cancelled / no-show
 *
 * MUTABLE, hors NF525.
 * Utilise le type Reservation défini dans commerce/relation/reservations
 * (parité UI historique), mais la collection est logiquement rattachée au
 * pilier ops (plan de salle) — elle occupe des tables et impacte le service.
 */

import { useCallback, useMemo } from 'react';
import { useSovereignCollection } from '@/kernel/hooks/useSovereignCollection';
import type { Reservation, ReservationStatus } from '@/modules/commerce/relation/reservations/types';

export interface UseSovereignReservationsOptions {
    tenantId: string;
    dateFilter?: string; // 'YYYY-MM-DD'
    statusFilter?: ReservationStatus | ReservationStatus[] | 'all';
    autoSync?: boolean;
}

export interface CreateReservationInput {
    customerName: string;
    phone: string;
    email?: string;
    date: string;   // 'YYYY-MM-DD'
    time: string;   // 'HH:mm'
    covers: number;
    tableId?: string;
    duration?: number; // minutes
    notes?: string;
    tags?: string[];
    source?: Reservation['source'];
    isVip?: boolean;
}

export interface UseSovereignReservationsResult {
    data: Reservation[];
    isLoading: boolean;
    isSyncing: boolean;
    error: string | null;

    create: (input: CreateReservationInput) => Promise<string>;
    confirm: (id: string) => Promise<void>;
    seat: (id: string, tableId?: string) => Promise<void>;
    complete: (id: string) => Promise<void>;
    cancel: (id: string) => Promise<void>;
    noShow: (id: string) => Promise<void>;
    assignTable: (id: string, tableId: string) => Promise<void>;
    remove: (id: string) => Promise<void>;
    refresh: () => Promise<void>;
}

const nowIso = (): string => new Date().toISOString();

export function useSovereignReservations(
    options: UseSovereignReservationsOptions,
): UseSovereignReservationsResult {
    const { tenantId, dateFilter, statusFilter = 'all', autoSync } = options;

    const filter = useMemo(() => {
        if (statusFilter === 'all' && !dateFilter) return undefined;
        const statuses = statusFilter === 'all'
            ? null
            : Array.isArray(statusFilter) ? statusFilter : [statusFilter];
        return (item: Reservation) => {
            if (statuses && !statuses.includes(item.status)) return false;
            if (dateFilter && item.date !== dateFilter) return false;
            return true;
        };
    }, [statusFilter, dateFilter]);

    const {
        data,
        isLoading,
        isSyncing,
        error,
        set,
        update,
        delete: del,
        refresh,
    } = useSovereignCollection<Reservation>('reservations', {
        tenantId,
        autoSync,
        filter,
    });

    const create = useCallback(async (input: CreateReservationInput): Promise<string> => {
        const id = `rsv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const nowStr = nowIso();
        const reservation: Reservation = {
            id,
            crmName: input.customerName,
            customerName: input.customerName,
            email: input.email,
            phone: input.phone,
            date: input.date,
            time: input.time,
            covers: input.covers,
            tableId: input.tableId ?? '',
            status: 'pending',
            tags: input.tags ?? [],
            notes: input.notes,
            isVip: input.isVip ?? false,
            duration: input.duration ?? 90,
            source: input.source,
            createdAt: nowStr,
            updatedAt: nowStr,
        };
        await set(reservation);
        return id;
    }, [set]);

    const patchStatus = useCallback(async (id: string, status: ReservationStatus, extra?: Partial<Reservation>) => {
        await update(id, {
            status,
            updatedAt: nowIso(),
            ...(extra ?? {}),
        } as Partial<Reservation>);
    }, [update]);

    const confirm = useCallback((id: string) => patchStatus(id, 'confirmed'), [patchStatus]);
    const complete = useCallback((id: string) => patchStatus(id, 'completed'), [patchStatus]);
    const cancel = useCallback((id: string) => patchStatus(id, 'cancelled'), [patchStatus]);
    const noShow = useCallback((id: string) => patchStatus(id, 'no-show'), [patchStatus]);

    const seat = useCallback(async (id: string, tableId?: string) => {
        await patchStatus(id, 'seated', tableId ? { tableId } : undefined);
    }, [patchStatus]);

    const assignTable = useCallback(async (id: string, tableId: string) => {
        await update(id, {
            tableId,
            updatedAt: nowIso(),
        } as Partial<Reservation>);
    }, [update]);

    return {
        data,
        isLoading,
        isSyncing,
        error,
        create,
        confirm,
        seat,
        complete,
        cancel,
        noShow,
        assignTable,
        remove: del,
        refresh,
    };
}
