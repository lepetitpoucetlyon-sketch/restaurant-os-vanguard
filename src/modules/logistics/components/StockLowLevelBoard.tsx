"use client";

/**
 * StockLowLevelBoard — Composant preuve de useSovereignStocks (ADR-011).
 * Affiche les articles sous le seuil d'alerte avec ajustement inline.
 * Optimistic UI + offline-first.
 */

import React, { useMemo } from 'react';
import { AlertTriangle, PackageCheck, Minus, Plus, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { useSovereignStocks } from '../hooks/useSovereignStocks';
import type { StockItem } from '../domain/schemas/inventory';

interface StockLowLevelBoardProps {
    tenantId: string;
    supplierId?: string;
}

function levelColor(item: StockItem): 'critical' | 'warning' | 'ok' {
    const crit = item.criticalThreshold ?? 0;
    const th = item.threshold ?? 0;
    if (item.quantityInStock <= crit) return 'critical';
    if (item.quantityInStock <= th) return 'warning';
    return 'ok';
}

export function StockLowLevelBoard({ tenantId, supplierId }: StockLowLevelBoardProps) {
    const {
        data, isLoading, isSyncing, error,
        adjustQuantity, stampAudit, refresh,
    } = useSovereignStocks({ tenantId, supplierId, onlyBelowThreshold: true });

    const sorted = useMemo(() => {
        return [...data].sort((a, b) => a.quantityInStock - b.quantityInStock);
    }, [data]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    <h2 className="text-lg font-semibold text-primary">Stocks bas</h2>
                    <span className="text-xs text-secondary">
                        {sorted.length} article{sorted.length > 1 ? 's' : ''} sous le seuil
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
                        className="text-xs text-secondary hover:text-primary px-2 py-1"
                    >↻</button>
                </div>
            </div>

            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400">
                    {error}
                </div>
            )}

            {isLoading ? (
                <div className="h-24 bg-surface animate-pulse rounded" />
            ) : sorted.length === 0 ? (
                <div className="p-8 text-center text-sm text-secondary bg-surface border border-default rounded flex flex-col items-center gap-2">
                    <PackageCheck className="w-6 h-6 text-green-400" />
                    Tous les stocks sont au-dessus des seuils
                </div>
            ) : (
                <div className="divide-y divide-default border border-default rounded overflow-hidden">
                    {sorted.map(item => {
                        const level = levelColor(item);
                        return (
                            <div key={item.id} className="p-3 bg-surface flex items-center gap-3">
                                <div className={`w-2 h-10 rounded ${
                                    level === 'critical' ? 'bg-red-400' :
                                    level === 'warning' ? 'bg-yellow-400' : 'bg-green-400'
                                }`} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-primary truncate">{item.name}</p>
                                    <p className="text-xs text-secondary">
                                        {item.quantityInStock} {item.unit}
                                        {item.threshold !== undefined && <> · seuil {item.threshold}</>}
                                        {item.criticalThreshold !== undefined && <> · critique {item.criticalThreshold}</>}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => void adjustQuantity(item.id, -1, 'manual-decrement')}
                                        disabled={item.quantityInStock <= 0}
                                        className="p-1 hover:bg-red-500/10 rounded text-red-400 disabled:opacity-30"
                                        title="Retirer 1"
                                    ><Minus className="w-4 h-4" /></button>
                                    <span className="text-sm font-mono text-primary w-10 text-center">
                                        {item.quantityInStock}
                                    </span>
                                    <button
                                        onClick={() => void adjustQuantity(item.id, 1, 'manual-increment')}
                                        className="p-1 hover:bg-green-500/10 rounded text-green-400"
                                        title="Ajouter 1"
                                    ><Plus className="w-4 h-4" /></button>
                                    <button
                                        onClick={() => void stampAudit(item.id)}
                                        className="ml-2 text-xs px-2 py-1 bg-accent/10 border border-accent rounded text-primary"
                                        title="Marquer audité"
                                    >
                                        <Loader2 className="w-3 h-3 hidden" /> ✓ Audit
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
