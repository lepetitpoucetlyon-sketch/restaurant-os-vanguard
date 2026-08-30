// @wip owner:facility-team échéance:2026-Q4 — composant orphelin à intégrer ou supprimer (audit orphelins 2026-08-30)
"use client";

/**
 * BreakdownsBoard — Composant preuve de useSovereignBreakdowns (ADR-013).
 * Kanban 4 colonnes OPEN → IN_PROGRESS → WAITING_PARTS → RESOLVED.
 * Optimistic UI, offline-first : incident capté en cave sans wifi.
 */

import React, { useMemo } from 'react';
import { AlertOctagon, Wrench, PackageOpen, CheckCircle2, Wifi, WifiOff } from 'lucide-react';
import { useSovereignBreakdowns, type BreakdownStatus } from '../../hooks/useSovereignBreakdowns';

const COLUMNS: { status: BreakdownStatus; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { status: 'OPEN', label: 'Ouvert', icon: AlertOctagon },
    { status: 'IN_PROGRESS', label: 'En cours', icon: Wrench },
    { status: 'WAITING_PARTS', label: 'Pièces', icon: PackageOpen },
    { status: 'RESOLVED', label: 'Résolu', icon: CheckCircle2 },
];

interface BreakdownsBoardProps {
    tenantId: string;
    equipmentId?: string;
}

export function BreakdownsBoard({ tenantId, equipmentId }: BreakdownsBoardProps) {
    const {
        data, isLoading, isSyncing, error,
        startWork, setWaitingParts, resolve, refresh,
    } = useSovereignBreakdowns({ tenantId, equipmentId });

    const grouped = useMemo(() => {
        const map = new Map<BreakdownStatus, typeof data>();
        for (const col of COLUMNS) map.set(col.status, []);
        for (const b of data) {
            const bucket = map.get(b.status as BreakdownStatus);
            if (bucket) bucket.push(b);
        }
        return map;
    }, [data]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <AlertOctagon className="w-5 h-5 text-red-400" />
                    <h2 className="text-lg font-semibold text-primary">Incidents équipements</h2>
                    <span className="text-xs text-secondary">{data.length}</span>
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

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {COLUMNS.map(col => {
                    const Icon = col.icon;
                    const items = grouped.get(col.status) ?? [];
                    return (
                        <div key={col.status} className="bg-surface rounded border border-default p-3 min-h-[240px]">
                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-default">
                                <Icon className="w-4 h-4 text-accent" />
                                <span className="text-sm font-medium text-primary">{col.label}</span>
                                <span className="ml-auto text-xs text-secondary">{items.length}</span>
                            </div>
                            <div className="space-y-2">
                                {items.map(b => (
                                    <div key={b.id} className="p-2 bg-surface-elevated rounded border border-default">
                                        <p className="text-sm text-primary font-medium truncate">{b.equipmentName}</p>
                                        <p className="text-xs text-secondary truncate">{b.symptom}</p>
                                        <div className="flex items-center justify-between mt-2 text-xs">
                                            <span className={`px-1.5 py-0.5 rounded text-nano uppercase font-bold ${
                                                b.severity === 'critical' ? 'bg-red-500/10 text-red-400' :
                                                b.severity === 'degraded' ? 'bg-orange-500/10 text-orange-400' :
                                                'bg-yellow-500/10 text-yellow-400'
                                            }`}>{b.severity}</span>
                                            <div className="flex gap-1">
                                                {b.status === 'OPEN' && (
                                                    <button
                                                        onClick={() => void startWork(b.id)}
                                                        className="text-blue-400 hover:underline"
                                                    >→ Démarrer</button>
                                                )}
                                                {b.status === 'IN_PROGRESS' && (
                                                    <>
                                                        <button
                                                            onClick={() => void setWaitingParts(b.id)}
                                                            className="text-yellow-400 hover:underline"
                                                        >Pièces</button>
                                                        <button
                                                            onClick={() => void resolve(b.id)}
                                                            className="ml-2 text-green-400 hover:underline"
                                                        >Résoudre</button>
                                                    </>
                                                )}
                                                {b.status === 'WAITING_PARTS' && (
                                                    <button
                                                        onClick={() => void resolve(b.id)}
                                                        className="text-green-400 hover:underline"
                                                    >Résoudre</button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {items.length === 0 && (
                                    <p className="text-xs text-center text-secondary italic py-4">Vide</p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
