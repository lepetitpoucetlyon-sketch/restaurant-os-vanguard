"use client";

import { useState } from "react";
import { Users, Contact, PlusCircle, Tag, Mail, BarChart2, History, Upload, TrendingUp, Zap } from "lucide-react";
import type { Customer } from "@nexus/contracts";

import { useCRM } from '@/modules/ops';
import {
    CRMSidebar,
    CRMList,
    CRMDetailView,
    CustomerCustomerView,
    CustomerDetailPanel,
    NewCustomerDialog,
    PromoCodeManager,
    EmailCampaign,
    BasketAnalysis,
    VisitHistory,
    CustomerImportPanel,
    RFMSegmentation,
    EmailAutomations,
} from '@/modules/commerce';
import { withPageGuard } from "@/shared/components/rbac/PageGuard";
import { PageShell } from "@/shared/components/ui/PageShell";
import { BentoGrid, BentoCell, StatCard } from "@/shared/components/ui";

type CrmTab = "pipeline" | "customers" | "promos" | "emails" | "analytics" | "history" | "import" | "rfm" | "automations";

const CRM_TABS = [
    { id: "pipeline", label: "Pipeline CRM", icon: Contact },
    { id: "customers", label: "Clients", icon: Users },
    { id: "history", label: "Historique", icon: History },
    { id: "import", label: "Import CSV", icon: Upload },
    { id: "promos", label: "Codes Promo", icon: Tag },
    { id: "emails", label: "Campagnes Email", icon: Mail },
    { id: "automations", label: "Automations", icon: Zap },
    { id: "rfm", label: "Segmentation RFM", icon: TrendingUp },
    { id: "analytics", label: "Analytiques", icon: BarChart2 },
] as const;

function CrmPage() {
    const [activeTab, setActiveTab] = useState<CrmTab>("pipeline");
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isNewOpen, setIsNewOpen] = useState(false);

    const { data: customers = [], upsertCustomer } = useCRM();

    return (
        <PageShell
            kicker="Commerce"
            title="CRM Clients"
            subtitle="Pipeline commercial, fiches clients et historique de relation."
            icon={Users}
            breadcrumbs={[{ label: "Opérations" }, { label: "CRM" }]}
            actions={
                <PageShell.CTA onClick={() => setIsNewOpen(true)}>
                    <PlusCircle className="w-[15px] h-[15px]" /> <span>Nouveau client</span>
                </PageShell.CTA>
            }
            tabs={
                <>
                    {CRM_TABS.map((tab) => (
                        <PageShell.Tab
                            key={tab.id}
                            active={activeTab === tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            icon={tab.icon}
                        >
                            {tab.label}
                        </PageShell.Tab>
                    ))}
                </>
            }
        >
            <main className="space-y-6">
                {activeTab === "pipeline" && (
                    <>
                        <BentoGrid layout="hero-2col">
                            <BentoCell span={2}>
                                <StatCard
                                    label="Portefeuille Clients"
                                    value={String(customers.length)}
                                    icon={<Users className="w-5 h-5" />}
                                    intent="brand"
                                />
                            </BentoCell>
                            <BentoCell span={1}>
                                <StatCard
                                    label="Clients VIP / Fidèles"
                                    value={String(customers.filter(c => ((c as Record<string, unknown>).ordersCount as number || 0) >= 3).length)}
                                    icon={<TrendingUp className="w-5 h-5" />}
                                    intent="success"
                                />
                            </BentoCell>
                        </BentoGrid>
                        <section className="flex gap-4 min-h-[60vh]">
                        <div className="w-56 shrink-0">
                            <CRMSidebar />
                        </div>
                        <div className="flex-1">
                            <CRMList />
                        </div>
                        <div className="w-80 shrink-0">
                            <CRMDetailView />
                        </div>
                    </section>
                    </>
                )}

                {activeTab === "customers" && (
                    <section className="flex gap-4">
                        <div className="flex-1">
                            <CustomerCustomerView
                                customers={customers}
                                onCustomerClick={setSelectedCustomer}
                            />
                        </div>
                        {selectedCustomer && (
                            <div className="w-80 shrink-0">
                                <CustomerDetailPanel
                                    customer={selectedCustomer}
                                    onClose={() => setSelectedCustomer(null)}
                                    onNewReservation={() => setSelectedCustomer(null)}
                                />
                            </div>
                        )}
                    </section>
                )}

                {/* com-2: Onglet Historique des visites */}
                {activeTab === "history" && (
                    <section className="flex gap-4">
                        <div className="flex-1">
                            <CustomerCustomerView
                                customers={customers}
                                onCustomerClick={setSelectedCustomer}
                            />
                        </div>
                        {selectedCustomer ? (
                            <div className="w-96 shrink-0 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-base font-bold flex items-center gap-2">
                                        <History className="w-4 h-4 text-action-primary" />
                                        Historique — {selectedCustomer.firstName} {selectedCustomer.lastName}
                                    </h2>
                                    <button
                                        onClick={() => setSelectedCustomer(null)}
                                        className="text-xs text-text-muted hover:text-text-primary"
                                    >
                                        Fermer
                                    </button>
                                </div>
                                <VisitHistory
                                    customerId={selectedCustomer.id}
                                    email={selectedCustomer.email ?? ""}
                                    phone={selectedCustomer.phone}
                                />
                            </div>
                        ) : (
                            <div className="w-96 shrink-0 flex items-center justify-center text-sm text-text-muted">
                                Sélectionnez un client pour voir son historique
                            </div>
                        )}
                    </section>
                )}

                {activeTab === "import" && (
                    <section className="max-w-2xl">
                        <CustomerImportPanel />
                    </section>
                )}

                {activeTab === "promos" && (
                    <section className="max-w-2xl">
                        <PromoCodeManager />
                    </section>
                )}

                {activeTab === "emails" && (
                    <section className="max-w-2xl">
                        <EmailCampaign />
                    </section>
                )}

                {activeTab === "automations" && (
                    <section className="max-w-2xl">
                        <EmailAutomations />
                    </section>
                )}

                {activeTab === "rfm" && (
                    <section className="max-w-4xl">
                        <RFMSegmentation customers={customers} />
                    </section>
                )}

                {activeTab === "analytics" && (
                    <section className="max-w-3xl">
                        <BasketAnalysis />
                    </section>
                )}
            </main>

            <NewCustomerDialog
                isOpen={isNewOpen}
                onClose={() => setIsNewOpen(false)}
                onSave={(customer: Customer) => {
                    upsertCustomer(customer);
                    setIsNewOpen(false);
                }}
            />
        </PageShell>
    );
}

export default withPageGuard(CrmPage, "crm");
