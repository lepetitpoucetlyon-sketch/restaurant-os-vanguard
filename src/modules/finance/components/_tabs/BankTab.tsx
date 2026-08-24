"use client";

import {
    Landmark,
    Link2,
    RefreshCw,
    Building2,
    FileText,
    ArrowDownLeft,
    ArrowUpRight,
} from "lucide-react";
import { ActionGuard } from '@/shared/components/rbac/ActionGuard';
import type { BankTransaction } from '../../types';
import { type BankAccount, formatEur, centsToEur, muToEur } from "../financeUtils";

/**
 * Onglet « Connexion bancaire » (PSD2 / Powens) de la page Finance — extrait de page.tsx (dette-4).
 */
export interface BankTabProps {
    connectingBank: boolean;
    syncingBank: boolean;
    loadingBankAccounts: boolean;
    bankAccounts: BankAccount[];
    bankTransactions: BankTransaction[];
    onConnectBank: () => void;
    onSync: () => void;
}

export function BankTab({
    connectingBank,
    syncingBank,
    loadingBankAccounts,
    bankAccounts,
    bankTransactions,
    onConnectBank,
    onSync,
}: BankTabProps) {
    return (
        <section className="space-y-6">
            {/* Connect / sync actions */}
            <div className="rounded-lg border border-border p-6 bg-surface-sidebar">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h2 className="text-lg font-serif font-semibold flex items-center gap-2">
                            <Landmark className="w-5 h-5 text-text-muted" />
                            Synchronisation bancaire PSD2
                        </h2>
                        <p className="text-sm text-text-muted mt-1 max-w-md">
                            Connectez vos comptes via Powens (Budget Insight) pour le rapprochement automatique et la trésorerie en temps réel.
                        </p>
                    </div>
                    <ActionGuard page="finance" action="reconcile_bank">
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={onConnectBank}
                                disabled={connectingBank}
                                className="flex items-center gap-2 px-4 py-2 rounded-md bg-action-primary text-text-primary text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Link2 className="w-4 h-4" />
                                {connectingBank ? "Connexion…" : "Connecter ma banque"}
                            </button>
                            <button
                                onClick={onSync}
                                disabled={syncingBank}
                                className="flex items-center gap-2 px-4 py-2 rounded-md border border-border text-sm font-medium hover:bg-surface-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <RefreshCw
                                    className={`w-4 h-4 ${syncingBank ? "animate-spin" : ""}`}
                                />
                                {syncingBank ? "Synchro…" : "Synchroniser"}
                            </button>
                        </div>
                    </ActionGuard>
                </div>
            </div>

            {/* Connected bank accounts */}
            <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Comptes connectés
                </h3>
                {loadingBankAccounts ? (
                    <p className="text-sm text-text-muted italic py-6 text-center">Chargement…</p>
                ) : bankAccounts.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border p-8 text-center">
                        <Building2 className="w-8 h-8 text-text-muted mx-auto mb-2" />
                        <p className="text-sm text-text-muted">
                            Aucun compte bancaire connecté. Cliquez sur{" "}
                            <span className="font-medium">Connecter ma banque</span>{" "}
                            pour commencer.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {bankAccounts.map((account) => (
                            <div
                                key={account.id}
                                className="rounded-lg border border-border p-4 bg-surface-sidebar"
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <Building2 className="w-4 h-4 text-text-muted shrink-0" />
                                    <p className="text-sm font-medium truncate">{account.label}</p>
                                </div>
                                {account.bankName && (
                                    <p className="text-xs text-text-muted mb-2">{account.bankName}</p>
                                )}
                                <p className="text-lg font-serif font-bold tabular-nums">
                                    {formatEur(centsToEur(account.balance ?? 0))}
                                </p>
                                {account.lastUpdate && (
                                    <p className="text-xs text-text-muted mt-1">
                                        Màj {new Date(account.lastUpdate).toLocaleDateString("fr-FR")}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Recent bank transactions */}
            <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Transactions récentes
                </h3>
                {bankTransactions.length === 0 ? (
                    <p className="text-sm text-text-muted italic py-6 text-center">
                        Aucune transaction bancaire importée.
                    </p>
                ) : (
                    <div className="overflow-x-auto rounded-lg border border-border">
                        <table className="w-full text-sm min-w-[560px]">
                            <thead>
                                <tr className="bg-surface-sidebar border-b border-border text-xs text-text-muted">
                                    <th className="text-left px-4 py-2.5 font-medium">Date</th>
                                    <th className="text-left px-4 py-2.5 font-medium">Libellé</th>
                                    <th className="text-right px-4 py-2.5 font-medium">Montant</th>
                                    <th className="text-center px-4 py-2.5 font-medium">Rapproché</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bankTransactions
                                    .slice(0, 50)
                                    .map((tx) => {
                                        const isCredit = tx.direction === "credit";
                                        const dateMs =
                                            typeof tx.executedAt === "number"
                                                ? tx.executedAt
                                                : typeof tx.date === "number"
                                                ? tx.date
                                                : Date.now();
                                        const dateStr =
                                            new Date(dateMs).toLocaleDateString("fr-FR");
                                        const labelStr = tx.label || tx.description || "—";
                                        const amountEur = muToEur(
                                            Math.abs(tx.amountInMicrounits)
                                        );
                                        const reconciled = !!tx.reconciledAt;

                                        return (
                                            <tr
                                                key={tx.id}
                                                className="border-b border-border/40 last:border-0 hover:bg-surface-sidebar/50 transition-colors"
                                            >
                                                <td className="px-4 py-2.5 text-text-muted tabular-nums whitespace-nowrap">
                                                    {dateStr}
                                                </td>
                                                <td className="px-4 py-2.5 max-w-xs truncate">
                                                    {labelStr}
                                                </td>
                                                <td
                                                    className={`px-4 py-2.5 text-right tabular-nums font-medium ${
                                                        isCredit
                                                            ? "text-emerald-600"
                                                            : "text-status-danger"
                                                    }`}
                                                >
                                                    <span className="flex items-center justify-end gap-1">
                                                        {isCredit ? (
                                                            <ArrowDownLeft className="w-3 h-3" />
                                                        ) : (
                                                            <ArrowUpRight className="w-3 h-3" />
                                                        )}
                                                        {formatEur(amountEur)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 text-center">
                                                    <span
                                                        className={`inline-block w-2 h-2 rounded-full ${
                                                            reconciled
                                                                ? "bg-status-success"
                                                                : "bg-action-primary"
                                                        }`}
                                                        title={reconciled ? "Rapprochée" : "Non rapprochée"}
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </section>
    );
}
