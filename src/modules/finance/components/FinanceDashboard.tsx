"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
    BookOpen,
    Receipt,
    ShieldCheck,
    PlusCircle,
    Landmark,
    X,
} from "lucide-react";
import { toast } from "sonner";

import { useFinance } from "../hooks/useFinance";
import { ExpenseClaimDialog } from "@modules/finance/components/accounting";
import { useBilling } from "@modules/finance/billing/hooks/useBilling";
import { FECExporter } from "@modules/finance/accounting/domain/FECExporter";
import { useTenant, useActionPermission } from "@/shared/hooks";
import { closeTicketZForDay } from "@/shared/eventBus/handlers/TicketZHandler";
import { useOrders } from "@/modules/ops/providers";
import type { Order } from "@modules/ops/engine/types";
import type { JournalEntry } from "@nexus/contracts";
import dynamic from "next/dynamic";

// dette-4 — onglets chargés dynamiquement (code-splitting & réduction fan-out)
const AccountingTab = dynamic(() => import("./_tabs/AccountingTab").then(m => m.AccountingTab));
const BillingTab    = dynamic(() => import("./_tabs/BillingTab").then(m => m.BillingTab));
const AuditTab      = dynamic(() => import("./_tabs/AuditTab").then(m => m.AuditTab));
const BankTab       = dynamic(() => import("./_tabs/BankTab").then(m => m.BankTab));
import {
    type FinanceTab,
    type BankAccount,
    type BankTransaction,
    computeTVABreakdown,
} from "./financeUtils";

// ── Page component ────────────────────────────────────────────────────────────

export function FinanceDashboard() {
    const searchParams = useSearchParams();
const _tabParam = searchParams.get("tab") as FinanceTab | null;
const _VALID_FINANCE_TABS: FinanceTab[] = ["accounting", "billing", "bank", "audit"];
const [activeTab, setActiveTab] = useState<FinanceTab>(
    _tabParam && _VALID_FINANCE_TABS.includes(_tabParam) ? _tabParam : "accounting"
);
    const [claimOpen, setClaimOpen] = useState(false);
    const [closingZ, setClosingZ] = useState(false);
    const [billingOrder, setBillingOrder] = useState<string | null>(null);

    // fin-8: bank connection
    const [bankModalOpen, setBankModalOpen] = useState(false);
    const [bankWebviewUrl, setBankWebviewUrl] = useState<string | null>(null);
    const [connectingBank, setConnectingBank] = useState(false);
    const [syncingBank, setSyncingBank] = useState(false);
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
    const [loadingBankAccounts, setLoadingBankAccounts] = useState(false);

    // fin-12 / fin-13: export controls
    const [pnlExporting, setPnlExporting] = useState(false);
    const [bilanExporting, setBilanExporting] = useState(false);
    const [payrollExporting, setPayrollExporting] = useState(false);
    const [payrollMonth, setPayrollMonth] = useState<string>(
        new Date().toISOString().slice(0, 7)
    );

    const {
        metrics,
        accountingMetrics,
        journalEntries = [],
        bankTransactions = [],
    } = useFinance();

    const { activeTenantId } = useTenant();
    const closePeriodPermission = useActionPermission("finance", "close_period");
    const { billOrder } = useBilling();
    const { data: orders, isLoading: ordersLoading } = useOrders();

    const paidOrders = (orders as Order[]).filter(
        (o) => o.status === "paid" || (o as { status?: string }).status === "served"
    );

    // Load bank accounts from Nexus on mount
    useEffect(() => {
        let cancelled = false;
        async function loadAccounts() {
            setLoadingBankAccounts(true);
            try {
                const { Nexus } = await import("@/lib/nexus/NexusAdapter");
                const accounts = await Nexus.adapter.query<BankAccount>("bankAccounts");
                if (!cancelled) setBankAccounts(accounts);
            } catch {
                // Collection may be empty — no-op
            } finally {
                if (!cancelled) setLoadingBankAccounts(false);
            }
        }
        loadAccounts();
        return () => { cancelled = true; };
    }, []);

    // fin-10: TVA breakdown derived from live journal entries
    const tvaBreakdown = useMemo(
        () => computeTVABreakdown(journalEntries as unknown as JournalEntry[]),
        [journalEntries]
    );

    // ── Handlers ───────────────────────────────────────────────────────────────

    const handleClotureZ = useCallback(async () => {
        if (!activeTenantId) return;
        setClosingZ(true);
        try {
            const today = new Date().toISOString().split("T")[0];
            await closeTicketZForDay(activeTenantId, today);
            toast.success("Clôture Z effectuée avec succès.");
        } catch {
            toast.error("Erreur lors de la clôture Z.");
        } finally {
            setClosingZ(false);
        }
    }, [activeTenantId]);

    const handleBillOrder = useCallback(async (order: Order) => {
        setBillingOrder(order.id);
        try {
            await billOrder(order);
        } finally {
            setBillingOrder(null);
        }
    }, [billOrder]);

    const handleFECExport = useCallback(() => {
        FECExporter.downloadFEC(journalEntries as unknown as JournalEntry[]);
    }, [journalEntries]);

    // fin-8: open Powens webview in modal iframe
    const handleConnectBank = useCallback(async () => {
        setConnectingBank(true);
        try {
            const origin =
                typeof window !== "undefined" ? window.location.origin : "";
            const res = await fetch(
                `/api/finance/bank/webview?origin=${encodeURIComponent(origin)}`
            );
            if (!res.ok) throw new Error("Erreur serveur");
            const { url } = (await res.json()) as { url: string; isDemoMode?: boolean };
            setBankWebviewUrl(url);
            setBankModalOpen(true);
        } catch {
            toast.error("Impossible d'ouvrir la connexion bancaire.");
        } finally {
            setConnectingBank(false);
        }
    }, []);

    // fin-8: trigger sync
    const handleBankSync = useCallback(async () => {
        setSyncingBank(true);
        try {
            const res = await fetch("/api/finance/bank/sync", { method: "POST" });
            const data = (await res.json()) as {
                success?: boolean;
                isDemoMode?: boolean;
                message?: string;
                error?: string;
            };
            if (data.success) {
                toast.success(
                    data.isDemoMode
                        ? "Synchronisation simulée (mode démo)."
                        : "Synchronisation bancaire lancée."
                );
                // Refresh bank accounts
                const { Nexus } = await import("@/lib/nexus/NexusAdapter");
                const accounts = await Nexus.adapter.query<BankAccount>("bankAccounts");
                setBankAccounts(accounts);
            } else {
                toast.error(data.error ?? "Erreur lors de la synchronisation.");
            }
        } catch {
            toast.error("Erreur réseau lors de la synchronisation.");
        } finally {
            setSyncingBank(false);
        }
    }, []);

    // fin-12: P&L PDF export
    const handleExportPnL = useCallback(async () => {
        setPnlExporting(true);
        try {
            const { AccountingReportService } = await import("@/modules/finance/services/AccountingReportService");
            const start = new Date(`${payrollMonth}-01T00:00:00Z`).getTime();
            const end = Date.now();
            const data = await AccountingReportService.buildPnL(start, end);
            await AccountingReportService.exportPnLPDF(data);
            toast.success("P&L exporté en PDF.");
        } catch {
            toast.error("Erreur lors de l'export P&L.");
        } finally {
            setPnlExporting(false);
        }
    }, [payrollMonth]);

    // fin-12: Balance sheet PDF export
    const handleExportBilan = useCallback(async () => {
        setBilanExporting(true);
        try {
            const { AccountingReportService } = await import("@/modules/finance/services/AccountingReportService");
            const data = await AccountingReportService.buildBalanceSheet(Date.now());
            await AccountingReportService.exportBalanceSheetPDF(data);
            toast.success("Bilan exporté en PDF.");
        } catch {
            toast.error("Erreur lors de l'export Bilan.");
        } finally {
            setBilanExporting(false);
        }
    }, []);

    // fin-13: Payroll CSV export
    const handleExportPayroll = useCallback(async () => {
        setPayrollExporting(true);
        try {
            const { AccountingReportService } = await import("@/modules/finance/services/AccountingReportService");
            await AccountingReportService.exportPayrollCSV(payrollMonth);
            toast.success(`Variables de paie ${payrollMonth} exportées.`);
        } catch {
            toast.error("Erreur lors de l'export variables de paie.");
        } finally {
            setPayrollExporting(false);
        }
    }, [payrollMonth]);

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-surface-base text-text-primary p-6">

            {/* fin-8: Bank connection modal iframe */}
            {bankModalOpen && bankWebviewUrl && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="relative w-full max-w-2xl h-[600px] bg-surface-base rounded-xl shadow-2xl overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface-sidebar shrink-0">
                            <div className="flex items-center gap-2">
                                <Landmark className="w-4 h-4 text-action-primary" />
                                <span className="text-sm font-medium">
                                    Connexion bancaire sécurisée (PSD2)
                                </span>
                            </div>
                            <button
                                onClick={() => setBankModalOpen(false)}
                                className="p-1.5 rounded-md hover:bg-surface-base transition-colors"
                                aria-label="Fermer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <iframe
                            src={bankWebviewUrl}
                            className="flex-1 w-full border-0"
                            title="Connexion bancaire sécurisée Powens"
                            sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                        />
                    </div>
                </div>
            )}

            <header className="mb-6 flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-serif font-bold">Finance &amp; Comptabilité</h1>
                    <p className="text-sm text-text-muted mt-1">
                        Pilotage financier, facturation et audit fiscal NF525.
                    </p>
                </div>
                <button
                    onClick={() => setClaimOpen(true)}
                    className="flex items-center gap-2 px-3 py-2 rounded-md bg-action-primary text-text-primary text-sm font-medium hover:opacity-90"
                >
                    <PlusCircle className="w-4 h-4" /> Note de frais
                </button>
            </header>

            <nav className="flex gap-1 border-b border-border mb-6 overflow-x-auto">
                {([
                    { id: "accounting", label: "Comptabilité", icon: BookOpen },
                    { id: "billing", label: "Facturation", icon: Receipt },
                    { id: "bank", label: "Connexion Bancaire", icon: Landmark },
                    { id: "audit", label: "Audit fiscal", icon: ShieldCheck },
                ] as const).map((tab) => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                                active
                                    ? "border-action-primary text-action-primary"
                                    : "border-transparent text-text-muted hover:text-text-primary"
                            }`}
                        >
                            <Icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    );
                })}
            </nav>

            <main>
                {/* ── Comptabilité ───────────────────────────────────────────── */}
                {activeTab === "accounting" && (
                    <AccountingTab
                        journalEntries={journalEntries}
                        metrics={metrics}
                        accountingMetrics={accountingMetrics}
                        tvaBreakdown={tvaBreakdown}
                        closingZ={closingZ}
                        payrollMonth={payrollMonth}
                        pnlExporting={pnlExporting}
                        bilanExporting={bilanExporting}
                        payrollExporting={payrollExporting}
                        activeTenantId={activeTenantId}
                        closePeriodPermission={closePeriodPermission}
                        onClotureZ={handleClotureZ}
                        onPayrollMonthChange={setPayrollMonth}
                        onExportPnL={handleExportPnL}
                        onExportBilan={handleExportBilan}
                        onExportPayroll={handleExportPayroll}
                    />
                )}

                {/* ── Facturation ────────────────────────────────────────────── */}
                {activeTab === "billing" && (
                    <BillingTab
                        paidOrders={paidOrders}
                        ordersLoading={ordersLoading}
                        billingOrder={billingOrder}
                        onBillOrder={handleBillOrder}
                    />
                )}

                {/* ── Connexion Bancaire (fin-8) ─────────────────────────────── */}
                {activeTab === "bank" && (
                    <BankTab
                        connectingBank={connectingBank}
                        syncingBank={syncingBank}
                        loadingBankAccounts={loadingBankAccounts}
                        bankAccounts={bankAccounts}
                        bankTransactions={bankTransactions as BankTransaction[]}
                        onConnectBank={handleConnectBank}
                        onSync={handleBankSync}
                    />
                )}

                {/* ── Audit fiscal ───────────────────────────────────────────── */}
                {activeTab === "audit" && (
                    <AuditTab entriesCount={journalEntries.length} onExportFEC={handleFECExport} />
                )}
            </main>

            <ExpenseClaimDialog isOpen={claimOpen} onClose={() => setClaimOpen(false)} />
        </div>
    );
}
