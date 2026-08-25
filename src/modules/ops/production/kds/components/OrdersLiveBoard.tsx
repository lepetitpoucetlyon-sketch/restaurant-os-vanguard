"use client";

/**
 * OrdersLiveBoard — Composant preuve d'usage de useSovereignOrders.
 *
 * ADR-010 Phase 2 — 1er composant du pilier ops à consommer la stack
 * souveraine offline-first (Dexie + Outbox + Nexus).
 *
 * Kanban KDS 4 colonnes : pending → cooking → ready → served.
 * Optimistic UI : le déplacement d'une commande est visible immédiatement,
 * la synchro cloud se fait en arrière-plan.
 */

import React, { useMemo } from 'react';
import { ChefHat, Flame, CheckCircle2, Truck, Ban, Wifi, WifiOff } from 'lucide-react';
import { useSovereignOrders, type SovereignOrderStatus } from '../../../hooks/useSovereignOrders';
import type { Order } from '../../../domain/schemas/orders';

interface OrdersLiveBoardProps {
    tenantId: string;
    /** Filtre optionnel par table. */
    tableId?: string;
}

const COLUMNS: { status: SovereignOrderStatus; label: string; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
    { status: 'pending', label: 'Nouvelles', icon: ChefHat, color: 'yellow' },
    { status: 'cooking', label: 'En cuisson', icon: Flame, color: 'orange' },
    { status: 'ready', label: 'Prêtes', icon: CheckCircle2, color: 'green' },
    { status: 'served', label: 'Servies', icon: Truck, color: 'blue' },
];

const NEXT_STATUS: Partial<Record<SovereignOrderStatus, SovereignOrderStatus>> = {
    pending: 'cooking',
    cooking: 'ready',
    ready: 'served',
    served: 'paid',
};

function ageSeconds(order: Order): number {
    const created = typeof order.createdAt === 'number'
        ? order.createdAt
        : typeof order.createdAt === 'string' ? new Date(order.createdAt).getTime() : Date.now();
    return Math.floor((Date.now() - created) / 1000);
}

function formatAge(sec: number): string {
    if (sec < 60) return `${sec}s`;
    const m = Math.floor(sec / 60);
    if (m < 60) return `${m} min`;
    const h = Math.floor(m / 60);
    return `${h}h ${m - h * 60}min`;
}

export function OrdersLiveBoard({ tenantId, tableId }: OrdersLiveBoardProps) {
    const {
        data,
        isLoading,
        isSyncing,
        error,
        setStatus,
        cancel,
        refresh,
    } = useSovereignOrders({
        tenantId,
        tableId,
        statusFilter: ['pending', 'cooking', 'ready', 'served'],
    });

    const grouped = useMemo(() => {
        const map = new Map<SovereignOrderStatus, Order[]>();
        for (const col of COLUMNS) map.set(col.status, []);
        for (const order of data) {
            const bucket = map.get(order.status as SovereignOrderStatus);
            if (bucket) bucket.push(order);
        }
        for (const bucket of map.values()) {
            bucket.sort((a, b) => {
                const ta = typeof a.createdAt === 'number' ? a.createdAt : new Date(a.createdAt as string).getTime();
                const tb = typeof b.createdAt === 'number' ? b.createdAt : new Date(b.createdAt as string).getTime();
                return ta - tb;
            });
        }
        return map;
    }, [data]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <ChefHat className="w-5 h-5 text-accent" />
                    <h2 className="text-lg font-semibold text-primary">KDS Live</h2>
                    <span className="text-xs text-secondary">
                        {data.length} commande{data.length > 1 ? 's' : ''} active{data.length > 1 ? 's' : ''}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {isSyncing ? (
                        <span className="flex items-center gap-1 text-xs text-blue-400">
                            <Wifi className="w-3 h-3 animate-pulse" /> Sync
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 text-xs text-secondary">
                            <WifiOff className="w-3 h-3" /> Cache
                        </span>
                    )}
                    <button
                        onClick={() => void refresh()}
                        disabled={isLoading}
                        className="text-xs text-secondary hover:text-primary px-2 py-1 rounded"
                    >
                        ↻
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {COLUMNS.map(col => {
                    const Icon = col.icon;
                    const orders = grouped.get(col.status) ?? [];
                    return (
                        <div key={col.status} className="bg-surface rounded-lg border border-default p-3 min-h-[300px]">
                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-default">
                                <Icon className="w-4 h-4 text-accent" />
                                <span className="text-sm font-semibold text-primary">{col.label}</span>
                                <span className="ml-auto text-xs text-secondary bg-surface-elevated px-2 py-0.5 rounded-full">
                                    {orders.length}
                                </span>
                            </div>

                            {isLoading && orders.length === 0 && (
                                <div className="h-20 bg-surface-elevated animate-pulse rounded" />
                            )}

                            <div className="space-y-2">
                                {orders.map(order => {
                                    const age = ageSeconds(order);
                                    const nextStatus = NEXT_STATUS[order.status as SovereignOrderStatus];
                                    return (
                                        <div key={order.id} className="p-3 bg-surface-elevated rounded border border-default">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-mono text-secondary">
                                                    #{order.tableNumber ?? order.id.slice(-6)}
                                                </span>
                                                <span className={`text-xs ${age > 900 ? 'text-red-400' : age > 600 ? 'text-yellow-400' : 'text-secondary'}`}>
                                                    {formatAge(age)}
                                                </span>
                                            </div>
                                            <ul className="space-y-0.5 mb-2">
                                                {order.items.slice(0, 4).map((item, i) => (
                                                    <li key={item.id ?? i} className="text-xs text-primary truncate">
                                                        <span className="font-mono text-secondary">{item.quantity}×</span> {item.name}
                                                    </li>
                                                ))}
                                                {order.items.length > 4 && (
                                                    <li className="text-xs text-secondary italic">
                                                        + {order.items.length - 4} autre{order.items.length - 4 > 1 ? 's' : ''}
                                                    </li>
                                                )}
                                            </ul>
                                            <div className="flex gap-1">
                                                {nextStatus && (
                                                    <button
                                                        onClick={() => void setStatus(order.id, nextStatus)}
                                                        className="flex-1 px-2 py-1 text-xs bg-accent/10 border border-accent rounded text-primary hover:bg-accent/20"
                                                    >
                                                        → {nextStatus === 'paid' ? 'Encaisser' : nextStatus}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => void cancel(order.id)}
                                                    title="Annuler"
                                                    className="p-1 text-xs text-red-400 hover:bg-red-500/10 rounded"
                                                >
                                                    <Ban className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {!isLoading && orders.length === 0 && (
                                <p className="text-xs text-center text-secondary italic py-8">
                                    Aucune commande
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
