"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import dynamic from "next/dynamic";

import { useFinance } from "../hooks/useFinance";
import { TabGuard } from "@/shared/components/rbac/TabGuard";
import { ExpenseClaimDialog } from './accounting';
import { useTenant, useActionPermission, useTabAccess } from "@/shared/hooks";
import { closeTicketZForDay } from "@/shared/eventBus/handlers/TicketZHandler";
import { useOrders } from '@/modules/ops';
import type { Order, JournalEntry } from "@nexus/contracts";

import {
    type FinanceTab,
    type BankAccount,
    type BankTransaction,
    computeTVABreakdown,
} from "./financeUtils";

import { BankModal } from "./dashboard/BankModal";
import { FinanceHeaderNav } from "./dashboard/FinanceHeaderNav";
import { filterPaidOrders, applyBankSyncResult, performConnectBank } from "./dashboard/bankConnectionHelpers";

// dette-4 — onglets chargés dynamiquement (code-splitting & réduction fan-out)
const AccountingTab = dynamic(() => import("./_tabs/AccountingTab").then(m => m.AccountingTab));
const BillingTab = dynamic(() => import("./_tabs/BillingTab").then(m => m.BillingTab));
const AuditTab = dynamic(() => import("./_tabs/AuditTab").then(m => m.AuditTab));
const TreasuryTab = dynamic(() => import("./_tabs/TreasuryTab").then(m => m.TreasuryTab));
const BankTab = dynamic(() => import("./_tabs/BankTab").then(m => m.BankTab));

const VALID_FINANCE_TABS: FinanceTab[] = ["accounting", "billing", "bank", "treasury", "audit"];

function computeInitialTab(tabParam: string | null): FinanceTab {
    return tabParam && VALID_FINANCE_TABS.includes(tabParam as FinanceTab) ? (tabParam as FinanceTab) : "accounting";
}

export function FinanceDashboard() {
    const searchParams = useSearchParams();
    const tabParam = searchParams.get("tab");
    const [activeTab, setActiveTab] = useState<FinanceTab>(computeInitialTab(tabParam));
    const [claimOpen, setClaimOpen] = useState(false);
    const [closingZ, setClosingZ] = useState(false);

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

    const canSeeTreasury = useTabAccess("finance", "treasury");
    const canSeeAudit = useTabAccess("finance", "audit");

    const {
        metrics,
        accountingMetrics,
        journalEntries = [],
        bankTransactions = [],
    } = useFinance();

    const { activeTenantId } = useTenant();
    const closePeriodPermission = useActionPermission("finance", "close_period");
    const { data: orders, isLoading: ordersLoading } = useOrders();

    const paidOrders = filterPaidOrders(orders as Order[]);

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

    const handleConnectBank = useCallback(async () => {
        await performConnectBank(setBankWebviewUrl, setBankModalOpen, setConnectingBank);
    }, []);

    const handleBankSync = useCallback(async () => {
        setSyncingBank(true);
        try {
            const res = await fetch("/api/finance/bank/sync", { method: "POST" });
            const data = (await res.json()) as { success?: boolean; isDemoMode?: boolean; error?: string };
            await applyBankSyncResult(data, setBankAccounts);
        } catch {
            toast.error("Erreur réseau lors de la synchronisation.");
        } finally {
            setSyncingBank(false);
        }
    }, []);

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

    return (
        <div className="min-h-screen bg-surface-base text-text-primary p-6">
            <BankModal open={bankModalOpen} url={bankWebviewUrl} onClose={() => setBankModalOpen(false)} />

            <FinanceHeaderNav
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                setClaimOpen={setClaimOpen}
                canSeeTreasury={canSeeTreasury}
                canSeeAudit={canSeeAudit}
            />

            <main>
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

                {activeTab === "billing" && (
                    <BillingTab
                        paidOrders={paidOrders}
                        ordersLoading={ordersLoading}
                    />
                )}

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

                {activeTab === "treasury" && (
                    <TabGuard pageKey="finance" tabKey="treasury">
                        <TreasuryTab />
                    </TabGuard>
                )}

                {activeTab === "audit" && (
                    <TabGuard pageKey="finance" tabKey="audit">
                        <AuditTab entriesCount={journalEntries.length} journalEntries={journalEntries} />
                    </TabGuard>
                )}
            </main>

            <ExpenseClaimDialog isOpen={claimOpen} onClose={() => setClaimOpen(false)} />
        </div>
    );
}
