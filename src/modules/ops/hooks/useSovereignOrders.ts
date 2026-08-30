"use client";

/**
 * useSovereignOrders — Adapter du kernel `useSovereignCollection`
 * pour la collection MUTABLE `orders` du pilier ops.
 *
 * ADR-010 Phase 2 — Migration ops vers useSovereignCollection.
 *
 * Cycle de vie d'une commande :
 *   pending → cooking → ready → served → paid
 *                                     ↘ cancelled
 *
 * Cette collection est MUTABLE et hors NF525_IMMUTABLE_COLLECTIONS.
 * Les fiscalSeals / journalEntries dérivés (via FinancialNexusBridge) restent
 * eux immuables — le lien fiscal se fait au moment du `paid` via un autre chemin.
 *
 * Usage :
 *   const { data, create, setStatus, cancel, setItemStatus } =
 *     useSovereignOrders({ tenantId });
 */

import { useCallback, useMemo } from 'react';
import { useSovereignCollection } from '@/kernel/hooks/useSovereignCollection';
import type { Order, OrderLine } from '../domain/schemas/orders';

export type SovereignOrderStatus = Order['status'];
export type SovereignOrderLineStatus = OrderLine['status'];

export interface UseSovereignOrdersOptions {
    tenantId: string;
    statusFilter?: SovereignOrderStatus | SovereignOrderStatus[] | 'all';
    /** Filtre par table (utile pour un pane KDS par station). */
    tableId?: string;
    autoSync?: boolean;
}

export interface CreateOrderInput {
    items: OrderLine[];
    tableId?: string | null;
    tableNumber?: string;
    consumptionMode?: 'dine_in' | 'takeaway';
    covers?: number;
    operatorId?: string;
    serverName?: string;
    totalInMicrounits?: number;
    notes?: string;
}

export interface UseSovereignOrdersResult {
    data: Order[];
    isLoading: boolean;
    isSyncing: boolean;
    error: string | null;

    /** Crée une commande (status = 'pending'). */
    create: (input: CreateOrderInput) => Promise<string>;
    /** Change le status global d'une commande. */
    setStatus: (id: string, status: SovereignOrderStatus) => Promise<void>;
    /** Annule une commande (status = 'cancelled'). */
    cancel: (id: string) => Promise<void>;
    /** Marque une commande comme payée (status = 'paid', stamp paidAt). */
    markPaid: (id: string) => Promise<void>;
    /** Change le status d'une ligne (pour KDS station-level). */
    setItemStatus: (orderId: string, itemId: string, status: SovereignOrderLineStatus) => Promise<void>;
    /** Suppression brute (draft non émis uniquement — la responsabilité relève du caller). */
    remove: (id: string) => Promise<void>;
    refresh: () => Promise<void>;
}

const now = (): number => Date.now();

export function useSovereignOrders(
    options: UseSovereignOrdersOptions,
): UseSovereignOrdersResult {
    const { tenantId, statusFilter = 'all', tableId, autoSync } = options;

    const filter = useMemo(() => {
        if (statusFilter === 'all' && !tableId) return undefined;
        const statuses = statusFilter === 'all'
            ? null
            : Array.isArray(statusFilter) ? statusFilter : [statusFilter];
        return (item: Order) => {
            if (statuses && !statuses.includes(item.status)) return false;
            if (tableId && item.tableId !== tableId) return false;
            return true;
        };
    }, [statusFilter, tableId]);

    const {
        data,
        isLoading,
        isSyncing,
        error,
        set,
        update,
        delete: del,
        refresh,
    } = useSovereignCollection<Order>('ops_flows', {
        tenantId,
        autoSync,
        filter,
    });

    const create = useCallback(async (input: CreateOrderInput): Promise<string> => {
        const id = `ord_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const nowTs = now();
        const order: Order = {
            id,
            type: 'order',
            items: input.items,
            status: 'pending',
            consumptionMode: input.consumptionMode ?? 'dine_in',
            tableId: input.tableId ?? null,
            tableNumber: input.tableNumber,
            covers: input.covers,
            operatorId: input.operatorId,
            serverName: input.serverName,
            totalInMicrounits: input.totalInMicrounits as Order['totalInMicrounits'],
            notes: input.notes,
            createdAt: nowTs,
            updatedAt: nowTs,
            schemaVersion: 2,
        } as unknown as Order;
        await set(order);
        return id;
    }, [set]);

    const setStatus = useCallback(async (id: string, status: SovereignOrderStatus) => {
        await update(id, {
            status,
            updatedAt: now(),
        } as unknown as Partial<Order>);
    }, [update]);

    const cancel = useCallback(async (id: string) => {
        await setStatus(id, 'cancelled');
    }, [setStatus]);

    const markPaid = useCallback(async (id: string) => {
        const nowTs = now();
        await update(id, {
            status: 'paid',
            paidAt: nowTs,
            updatedAt: nowTs,
        } as unknown as Partial<Order>);
    }, [update]);

    const setItemStatus = useCallback(async (
        orderId: string,
        itemId: string,
        itemStatus: SovereignOrderLineStatus,
    ) => {
        const order = data.find(o => o.id === orderId);
        if (!order) throw new Error(`[useSovereignOrders] Order "${orderId}" introuvable`);
        const nextItems = order.items.map(it =>
            it.id === itemId ? { ...it, status: itemStatus, updatedAt: now() } : it,
        );
        await update(orderId, {
            items: nextItems,
            updatedAt: now(),
        } as unknown as Partial<Order>);
    }, [data, update]);

    return {
        data,
        isLoading,
        isSyncing,
        error,
        create,
        setStatus,
        cancel,
        markPaid,
        setItemStatus,
        remove: del,
        refresh,
    };
}
