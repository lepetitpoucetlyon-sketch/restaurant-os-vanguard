// @wip owner:finance-team échéance:2026-Q4 — composant orphelin à intégrer ou supprimer (audit orphelins 2026-08-30)
"use client";

/**
 * ExpenseClaimsList — Composant preuve d'usage de useSovereignExpenseClaims.
 *
 * ADR-009 Phase 1 — 1er composant du pilier finance à consommer la stack
 * souveraine offline-first (Dexie + Outbox + Nexus).
 *
 * Fonctionnalités :
 *   - Liste temps réel des notes de frais du tenant
 *   - Filtre par statut (pending/approved/rejected/reimbursed)
 *   - Actions inline : approve / reject / reimburse / delete
 *   - Indicateur de synchro (isSyncing)
 *   - Optimistic UI : les actions apparaissent immédiatement, sync en arrière-plan
 */

import React, { useMemo, useState } from 'react';
import { CheckCircle2, XCircle, Coins, Trash2, Loader2, ReceiptEuro, Wifi, WifiOff } from 'lucide-react';
import { useSovereignExpenseClaims } from '../../hooks/useSovereignExpenseClaims';
import type { ExpenseClaim } from '../../domain/schemas/finance';
import { Button } from "@/shared/components/ui/Button";

interface ExpenseClaimsListProps {
    tenantId: string;
    approverId: string;
    /** Filtrage initial. */
    initialFilter?: ExpenseClaim['status'] | 'all';
}

const STATUS_LABEL: Record<ExpenseClaim['status'], string> = {
    pending: 'En attente',
    approved: 'Approuvée',
    rejected: 'Rejetée',
    reimbursed: 'Remboursée',
};

const STATUS_COLOR: Record<ExpenseClaim['status'], string> = {
    pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    approved: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
    reimbursed: 'bg-green-500/10 text-green-400 border-green-500/20',
};

function formatEuros(amountMu: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })
        .format(amountMu / 1_000_000);
}

export function ExpenseClaimsList({ tenantId, approverId, initialFilter = 'all' }: ExpenseClaimsListProps) {
    const [statusFilter, setStatusFilter] = useState<ExpenseClaim['status'] | 'all'>(initialFilter);
    const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());

    const {
        data,
        isLoading,
        isSyncing,
        error,
        approve,
        reject,
        reimburse,
        remove,
        refresh,
    } = useSovereignExpenseClaims({ tenantId, statusFilter });

    const sorted = useMemo(() => {
        return [...data].sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1));
    }, [data]);

    const runAction = async (id: string, fn: () => Promise<void>) => {
        setPendingIds(p => new Set(p).add(id));
        try {
            await fn();
        } finally {
            setPendingIds(p => {
                const n = new Set(p);
                n.delete(id);
                return n;
            });
        }
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <ReceiptEuro className="w-5 h-5 text-accent" />
                    <h2 className="text-lg font-semibold text-primary">Notes de frais</h2>
                    <span className="text-xs text-secondary">({sorted.length})</span>
                </div>
                <div className="flex items-center gap-2">
                    {isSyncing ? (
                        <span className="flex items-center gap-1 text-xs text-blue-400">
                            <Wifi className="w-3 h-3 animate-pulse" /> Sync...
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 text-xs text-secondary">
                            <WifiOff className="w-3 h-3" /> Cache local
                        </span>
                    )}
                    <Button variant="ghost"
                        onClick={() => void refresh()}
                        className="text-xs text-secondary hover:text-primary px-2 py-1 rounded"
                        disabled={isLoading}
                    >
                        ↻
                    </Button>
                </div>
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2">
                {(['all', 'pending', 'approved', 'rejected', 'reimbursed'] as const).map(f => (
                    <Button variant="ghost"
                        key={f}
                        onClick={() => setStatusFilter(f)}
                        className={`px-3 py-1 text-xs rounded-full border ${
                            statusFilter === f
                                ? 'bg-accent/10 border-accent text-primary'
                                : 'bg-surface border-default text-secondary hover:text-primary'
                        }`}
                    >
                        {f === 'all' ? 'Toutes' : STATUS_LABEL[f]}
                    </Button>
                ))}
            </div>

            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400">
                    {error}
                </div>
            )}

            {/* List */}
            {isLoading ? (
                <div className="h-24 bg-surface animate-pulse rounded-lg" />
            ) : sorted.length === 0 ? (
                <div className="p-8 text-center text-sm text-secondary bg-surface border border-default rounded-lg">
                    Aucune note de frais {statusFilter === 'all' ? '' : STATUS_LABEL[statusFilter as ExpenseClaim['status']]?.toLowerCase()}
                </div>
            ) : (
                <div className="divide-y divide-default border border-default rounded-lg overflow-hidden">
                    {sorted.map(claim => {
                        const isPending = pendingIds.has(claim.id);
                        return (
                            <div key={claim.id} className="p-4 bg-surface flex items-center justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 text-nano uppercase font-bold rounded border ${STATUS_COLOR[claim.status]}`}>
                                            {STATUS_LABEL[claim.status]}
                                        </span>
                                        <span className="text-xs text-secondary">{claim.category}</span>
                                    </div>
                                    <p className="text-sm text-primary mt-1 truncate">{claim.description}</p>
                                    <p className="text-xs text-secondary mt-0.5">
                                        Par {claim.userName || claim.submittedBy} · {new Date(claim.submittedAt).toLocaleDateString('fr-FR')}
                                    </p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-lg font-mono font-bold text-primary">
                                        {formatEuros(claim.amountInMicrounits)}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    {isPending && <Loader2 className="w-4 h-4 animate-spin text-accent" />}
                                    {claim.status === 'pending' && !isPending && (
                                        <>
                                            <Button variant="ghost"
                                                title="Approuver"
                                                onClick={() => void runAction(claim.id, () => approve(claim.id, approverId))}
                                                className="p-1.5 rounded hover:bg-green-500/10 text-green-400"
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost"
                                                title="Rejeter"
                                                onClick={() => void runAction(claim.id, () => reject(claim.id, approverId))}
                                                className="p-1.5 rounded hover:bg-red-500/10 text-red-400"
                                            >
                                                <XCircle className="w-4 h-4" />
                                            </Button>
                                        </>
                                    )}
                                    {claim.status === 'approved' && !isPending && (
                                        <Button variant="ghost"
                                            title="Marquer remboursée"
                                            onClick={() => void runAction(claim.id, () => reimburse(claim.id))}
                                            className="p-1.5 rounded hover:bg-blue-500/10 text-blue-400"
                                        >
                                            <Coins className="w-4 h-4" />
                                        </Button>
                                    )}
                                    {claim.status === 'pending' && !isPending && (
                                        <Button variant="ghost"
                                            title="Supprimer"
                                            onClick={() => void runAction(claim.id, () => remove(claim.id))}
                                            className="p-1.5 rounded hover:bg-red-500/10 text-red-400"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
