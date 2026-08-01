"use client";

import React from "react";
import { TrendingUp, TrendingDown, Wallet, ShieldCheck, Lock, Download, FileText } from "lucide-react";
import { TreasuryDashboard } from "@/modules/finance/components/accounting";
import { type TvaGroup, formatEur, centsToEur, muToEur } from "../financeUtils";

/**
 * Onglet « Comptabilité » de la page Finance — extrait de page.tsx (dette-4).
 * Le plus couplé des 4 onglets : KPI, santé comptable, récap TVA, clôture Z, exports.
 */
type JournalEntriesProp = React.ComponentProps<typeof TreasuryDashboard>["journalEntries"];

interface FinanceMetrics {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    margin?: number;
}

interface AccountingHealth {
    unreconciledCount: number;
    pendingClaimsCount: number;
    fiscalHealthScore: number;
}

export interface AccountingTabProps {
    journalEntries: JournalEntriesProp;
    metrics: FinanceMetrics;
    accountingMetrics: AccountingHealth;
    tvaBreakdown: TvaGroup[];
    closingZ: boolean;
    payrollMonth: string;
    pnlExporting: boolean;
    bilanExporting: boolean;
    payrollExporting: boolean;
    activeTenantId: string | null | undefined;
    closePeriodPermission: { allowed: boolean; reason?: string };
    onClotureZ: () => void;
    onPayrollMonthChange: (value: string) => void;
    onExportPnL: () => void;
    onExportBilan: () => void;
    onExportPayroll: () => void;
}

export function AccountingTab({
    journalEntries,
    metrics,
    accountingMetrics,
    tvaBreakdown,
    closingZ,
    payrollMonth,
    pnlExporting,
    bilanExporting,
    payrollExporting,
    activeTenantId,
    closePeriodPermission,
    onClotureZ,
    onPayrollMonthChange,
    onExportPnL,
    onExportBilan,
    onExportPayroll,
}: AccountingTabProps) {
    return (
        <section className="space-y-6">

            {/* Trésorerie & Prévisions — position cash réelle (PCG) */}
            <TreasuryDashboard journalEntries={journalEntries} />

            {/* KPI metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-lg border border-border p-4 bg-surface-sidebar">
                    <div className="flex items-center gap-2 text-text-muted text-xs uppercase tracking-wide">
                        <TrendingUp className="w-4 h-4 text-status-success" /> Chiffre d&apos;affaires
                    </div>
                    <p className="text-2xl font-serif font-bold mt-2 tabular-nums">
                        {formatEur(metrics.totalRevenue)}
                    </p>
                </div>
                <div className="rounded-lg border border-border p-4 bg-surface-sidebar">
                    <div className="flex items-center gap-2 text-text-muted text-xs uppercase tracking-wide">
                        <TrendingDown className="w-4 h-4 text-status-danger" /> Dépenses
                    </div>
                    <p className="text-2xl font-serif font-bold mt-2 tabular-nums">
                        {formatEur(metrics.totalExpenses)}
                    </p>
                </div>
                <div className="rounded-lg border border-border p-4 bg-surface-sidebar">
                    <div className="flex items-center gap-2 text-text-muted text-xs uppercase tracking-wide">
                        <Wallet className="w-4 h-4 text-action-primary" /> Résultat net
                    </div>
                    <p className="text-2xl font-serif font-bold mt-2 tabular-nums">
                        {formatEur(metrics.netProfit)}
                    </p>
                </div>
                <div className="rounded-lg border border-border p-4 bg-surface-sidebar">
                    <div className="flex items-center gap-2 text-text-muted text-xs uppercase tracking-wide">
                        <TrendingUp className="w-4 h-4 text-status-success" /> Marge
                    </div>
                    <p className="text-2xl font-serif font-bold mt-2 tabular-nums">
                        {(metrics.margin ?? 0).toFixed(1)}%
                    </p>
                </div>
            </div>

            {/* Accounting health metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-lg border border-border p-4">
                    <p className="text-xs text-text-muted uppercase tracking-wide">Écritures non rapprochées</p>
                    <p className="text-xl font-bold mt-1 tabular-nums">{accountingMetrics.unreconciledCount}</p>
                </div>
                <div className="rounded-lg border border-border p-4">
                    <p className="text-xs text-text-muted uppercase tracking-wide">Notes de frais en attente</p>
                    <p className="text-xl font-bold mt-1 tabular-nums">{accountingMetrics.pendingClaimsCount}</p>
                </div>
                <div className="rounded-lg border border-border p-4">
                    <p className="text-xs text-text-muted uppercase tracking-wide">Santé fiscale</p>
                    <p className="text-xl font-bold mt-1 tabular-nums">{accountingMetrics.fiscalHealthScore}%</p>
                </div>
            </div>

            {/* fin-10: TVA multi-taux recap */}
            <div className="rounded-lg border border-border p-4 bg-surface-sidebar">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted mb-3 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-status-success" />
                    Récapitulatif TVA
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-xs text-text-muted border-b border-border">
                                <th className="text-left pb-2 font-medium w-16">Taux</th>
                                <th className="text-left pb-2 font-medium">Catégorie</th>
                                <th className="text-right pb-2 font-medium">CA HT</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tvaBreakdown.map((row) => (
                                <tr
                                    key={row.rate}
                                    className="border-b border-border/40 last:border-0"
                                >
                                    <td className="py-2.5 font-bold tabular-nums text-action-primary">
                                        {row.rate}
                                    </td>
                                    <td className="py-2.5 text-text-muted">{row.label}</td>
                                    <td className="py-2.5 text-right tabular-nums font-medium">
                                        {formatEur(row.htInMicrounits != null ? muToEur(row.htInMicrounits) : centsToEur(row.htInCents))}
                                    </td>
                                </tr>
                            ))}
                            <tr className="bg-surface-base/50">
                                <td
                                    colSpan={2}
                                    className="py-2.5 text-xs font-bold uppercase tracking-wide"
                                >
                                    Total CA HT taxable
                                </td>
                                <td className="py-2.5 text-right tabular-nums font-bold">
                                    {formatEur(
                                        muToEur(
                                            tvaBreakdown.reduce((s, r) => s + (r.htInMicrounits ?? r.htInCents * 10_000), 0)
                                        )
                                    )}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Clôture Z */}
            <div className="rounded-lg border border-border p-4 flex items-center justify-between bg-surface-sidebar">
                <div>
                    <p className="text-sm font-medium">Clôture Z journalière</p>
                    <p className="text-xs text-text-muted mt-0.5">
                        Scelle le Ticket Z du jour et génère l&apos;écriture comptable agrégée (NF525).
                    </p>
                </div>
                <button
                    onClick={onClotureZ}
                    disabled={closingZ || !activeTenantId || !closePeriodPermission.allowed}
                    title={
                        !closePeriodPermission.allowed
                            ? closePeriodPermission.reason
                            : undefined
                    }
                    className="flex items-center gap-2 px-4 py-2 rounded-md bg-action-primary text-text-primary text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Lock className="w-4 h-4" />
                    {closingZ ? "Clôture en cours…" : "Clôture Z"}
                </button>
            </div>

            {/* fin-12 + fin-13: Export actions */}
            <div className="rounded-lg border border-border p-4 bg-surface-sidebar">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-text-muted mb-3 flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Exports comptables &amp; RH
                </h3>
                <div className="flex flex-wrap gap-3 items-end">
                    <div className="flex flex-col gap-1">
                        <label
                            htmlFor="payroll-month"
                            className="text-xs text-text-muted"
                        >
                            Période
                        </label>
                        <input
                            id="payroll-month"
                            type="month"
                            value={payrollMonth}
                            onChange={(e) => onPayrollMonthChange(e.target.value)}
                            className="px-3 py-1.5 rounded-md border border-border text-sm bg-surface-base text-text-primary focus:outline-none focus:ring-1 focus:ring-action-primary"
                        />
                    </div>
                    {/* fin-12: P&L */}
                    <button
                        onClick={onExportPnL}
                        disabled={pnlExporting}
                        className="flex items-center gap-2 px-4 py-2 rounded-md border border-border text-sm font-medium hover:bg-action-primary hover:text-text-primary hover:border-action-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FileText className="w-4 h-4" />
                        {pnlExporting ? "Export…" : "Exporter P&L"}
                    </button>
                    {/* fin-12: Bilan */}
                    <button
                        onClick={onExportBilan}
                        disabled={bilanExporting}
                        className="flex items-center gap-2 px-4 py-2 rounded-md border border-border text-sm font-medium hover:bg-action-primary hover:text-text-primary hover:border-action-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FileText className="w-4 h-4" />
                        {bilanExporting ? "Export…" : "Exporter Bilan"}
                    </button>
                    {/* fin-13: Payroll CSV */}
                    <button
                        onClick={onExportPayroll}
                        disabled={payrollExporting}
                        className="flex items-center gap-2 px-4 py-2 rounded-md border border-border text-sm font-medium hover:bg-action-primary hover:text-text-primary hover:border-action-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Download className="w-4 h-4" />
                        {payrollExporting ? "Export…" : "Exporter variables de paie"}
                    </button>
                </div>
            </div>
        </section>
    );
}
