"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";

import { useFinance } from "../hooks/useFinance";
import { TabGuard } from "@/shared/components/rbac/TabGuard";
import { ExpenseClaimDialog } from './accounting';
import { useTenant } from "@/shared/hooks/useTenant";
import { useActionPermission } from "@/shared/hooks/useActionPermission";
import { useTabAccess } from "@/shared/hooks/useTabAccess";
import { useOrders } from '@/modules/ops/providers/hooks';
import type { Order, JournalEntry } from "@nexus/contracts";

import {
    type FinanceTab,
    type BankTransaction,
    computeTVABreakdown,
} from "./financeUtils";

import {
    BankModal,
    FinanceHeaderNav,
    filterPaidOrders,
    useBankConnection,
    useFinancialExports,
    useZClosure,
} from "./dashboard";

const AccountingTab = dynamic(() => import("./_tabs/AccountingTab").then(m => m.AccountingTab));
const BillingTab = dynamic(() => import("./_tabs/BillingTab").then(m => m.BillingTab));
const AuditTab = dynamic(() => import("./_tabs/AuditTab").then(m => m.AuditTab));
const TreasuryTab = dynamic(() => import("./_tabs/TreasuryTab").then(m => m.TreasuryTab));
const BankTab = dynamic(() => import("./_tabs/BankTab").then(m => m.BankTab));

const VALID_FINANCE_TABS: FinanceTab[] = ["accounting", "billing", "bank", "treasury", "audit"];

function computeInitialTab(tabParam: string | null): FinanceTab {
    return tabParam && VALID_FINANCE_TABS.includes(tabParam as FinanceTab) ? (tabParam as FinanceTab) : "accounting";
}

/**
 * FinanceDashboard — shell d'assemblage du tableau de bord financier.
 * Fragmenté anti god-file : 3 hooks personnalisés extraient la logique domaine.
 *
 *   - useBankConnection    → cycle connexion bancaire (state + handlers + preload accounts)
 *   - useFinancialExports  → 3 handlers export (P&L, Bilan, variables de paie)
 *   - useZClosure          → clôture Z fiscale
 *
 * Le dashboard ne fait plus que : lire params URL, orchestrer tabs, câbler hooks aux enfants.
 */
export function FinanceDashboard() {
    const searchParams = useSearchParams();
    const tabParam = searchParams.get("tab");
    const [activeTab, setActiveTab] = useState<FinanceTab>(computeInitialTab(tabParam));
    const [claimOpen, setClaimOpen] = useState(false);

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

    const bank = useBankConnection();
    const exports = useFinancialExports();
    const zClosure = useZClosure(activeTenantId);

    const tvaBreakdown = useMemo(
        () => computeTVABreakdown(journalEntries as unknown as JournalEntry[]),
        [journalEntries]
    );

    return (
        <div className="min-h-screen bg-surface-base text-text-primary p-6">
            <BankModal open={bank.bankModalOpen} url={bank.bankWebviewUrl} onClose={() => bank.setBankModalOpen(false)} />

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
                        closingZ={zClosure.closingZ}
                        payrollMonth={exports.payrollMonth}
                        pnlExporting={exports.pnlExporting}
                        bilanExporting={exports.bilanExporting}
                        payrollExporting={exports.payrollExporting}
                        activeTenantId={activeTenantId}
                        closePeriodPermission={closePeriodPermission}
                        onClotureZ={zClosure.handleClotureZ}
                        onPayrollMonthChange={exports.setPayrollMonth}
                        onExportPnL={exports.handleExportPnL}
                        onExportBilan={exports.handleExportBilan}
                        onExportPayroll={exports.handleExportPayroll}
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
                        connectingBank={bank.connectingBank}
                        syncingBank={bank.syncingBank}
                        loadingBankAccounts={bank.loadingBankAccounts}
                        bankAccounts={bank.bankAccounts}
                        bankTransactions={bankTransactions as BankTransaction[]}
                        onConnectBank={bank.handleConnectBank}
                        onSync={bank.handleBankSync}
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
