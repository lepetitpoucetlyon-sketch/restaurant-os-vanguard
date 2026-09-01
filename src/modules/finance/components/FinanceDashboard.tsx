"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { useFinance } from "../hooks/useFinance";
import { TabGuard } from "@/shared/components/rbac/TabGuard";
import { ActionGuard } from "@/shared/components/rbac/ActionGuard";
import { PageShell } from "@/shared/components/ui/PageShell";
import { ResponsiveShell } from "@/shared/components/ui/ResponsiveShell";
import { FinanceKPIBanner } from "./FinanceKPIBanner";
import { ExpenseClaimDialog } from './accounting';
import { useTenant } from "@/shared/hooks/useTenant";
import { useActionPermission } from "@/shared/hooks/useActionPermission";
import { useTabAccess } from "@/shared/hooks/useTabAccess";
import { useSovereignCollection } from "@/kernel/hooks/useSovereignCollection";
import type { Order, JournalEntry } from "@nexus/contracts";
import { type FinanceTab, type BankTransaction, computeTVABreakdown } from "./financeUtils";
import {
    BankModal,
    filterPaidOrders,
    useBankConnection,
    useFinancialExports,
    useZClosure,
} from "./dashboard";
import {
    AccountingTab,
    BillingTab,
    EInvoicingTab,
    AuditTab,
    TreasuryTab,
    BankTab,
    BookOpen,
    Receipt,
    Landmark,
    Wallet,
    ShieldCheck,
    PlusCircle,
    Globe,
} from "./FinanceTabRegistry";

const VALID_FINANCE_TABS: FinanceTab[] = ["accounting", "billing", "einvoicing", "bank", "treasury", "audit"];

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
    const closePeriodPermission = useActionPermission("finance", "seal_zday");
    const { data: orders, isLoading: ordersLoading } = useSovereignCollection<Order>('orders', { tenantId: activeTenantId ?? undefined, autoSync: true });

    const paidOrders = filterPaidOrders(orders as Order[]);

    const bank = useBankConnection();
    const exports = useFinancialExports();
    const zClosure = useZClosure(activeTenantId);

    const tvaBreakdown = useMemo(
        () => computeTVABreakdown(journalEntries as unknown as JournalEntry[]),
        [journalEntries]
    );

    const totalCA = (((metrics?.totalRevenueInMicrounits ?? (metrics?.totalRevenueInCents ?? 0) * 10_000)) / 1_000_000).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
    const totalTVA = ((tvaBreakdown?.reduce((acc, t) => acc + (t.htInCents * 0.1), 0) ?? 0)).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
    const totalEcritures = journalEntries.length;

    const financeTabs = ([
        { id: "accounting" as const, label: "Comptabilité", icon: BookOpen, visible: true },
        { id: "billing" as const, label: "Facturation", icon: Receipt, visible: true },
        { id: "einvoicing" as const, label: "Facturation Électronique (PDP)", icon: Globe, visible: true },
        { id: "bank" as const, label: "Connexion Bancaire", icon: Landmark, visible: true },
        { id: "treasury" as const, label: "Trésorerie", icon: Wallet, visible: canSeeTreasury },
        { id: "audit" as const, label: "Audit fiscal", icon: ShieldCheck, visible: canSeeAudit },
    ]).filter((t) => t.visible);

    return (
        <PageShell
            kicker="Trésorerie"
            title="Finance & Comptabilité"
            subtitle="Pilotage financier, facturation, trésorerie et conformité fiscale NF525."
            icon={Landmark}
            breadcrumbs={[{ label: "Opérations" }, { label: "Finance & Comptabilité" }]}
            actions={
                <ActionGuard page="finance" action="create_expense_claim">
                    <PageShell.CTA onClick={() => setClaimOpen(true)}>
                        <PlusCircle className="w-[15px] h-[15px]" />
                        <span>Note de frais</span>
                    </PageShell.CTA>
                </ActionGuard>
            }
            tabs={financeTabs.map((tab) => (
                <PageShell.Tab
                    key={tab.id}
                    active={activeTab === tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    icon={tab.icon}
                >
                    {tab.label}
                </PageShell.Tab>
            ))}
        >
            <BankModal open={bank.bankModalOpen} url={bank.bankWebviewUrl} onClose={() => bank.setBankModalOpen(false)} />

            <div className="p-6 space-y-6">
                {/* Financial KPI Summary */}
                <FinanceKPIBanner totalCA={totalCA} totalTVA={totalTVA} totalEcritures={totalEcritures} />

                <ResponsiveShell
                    mobile={
                        <div className="space-y-4">
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

                            {activeTab === "einvoicing" && (
                                <EInvoicingTab
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
                        </div>
                    }
                    desktop={
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

                            {activeTab === "einvoicing" && (
                                <EInvoicingTab
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
                    }
                />
            </div>

            <ExpenseClaimDialog isOpen={claimOpen} onClose={() => setClaimOpen(false)} />
        </PageShell>
    );
}
