"use client";

import { useState } from "react";
import { Users, Contact, PlusCircle, Tag, Mail, BarChart2, History, Upload, TrendingUp, Zap } from "lucide-react";
import type { Customer } from "@nexus/contracts";

import { useCRM } from "@/modules/commerce";
import { CRMSidebar, CRMList, CRMDetailView } from "@modules/commerce/marketing/components/crm";
import {
    CustomerCustomerView,
    CustomerDetailPanel,
    NewCustomerDialog,
} from "@modules/commerce/customers/components";
import { PromoCodeManager } from "@/modules/commerce/marketing/components/crm/PromoCodeManager";
import { EmailCampaign } from "@/modules/commerce/marketing/components/crm/EmailCampaign";
import { BasketAnalysis } from "@/modules/commerce/marketing/components/crm/BasketAnalysis";
import { VisitHistory } from "@/modules/commerce/marketing/components/crm/VisitHistory";
import { CustomerImportPanel } from "@/modules/commerce";
import { RFMSegmentation } from "@/modules/commerce/marketing/components/crm/RFMSegmentation";
import { EmailAutomations } from "@/modules/commerce/marketing/components/crm/EmailAutomations";

type CrmTab = "pipeline" | "customers" | "promos" | "emails" | "analytics" | "history" | "import" | "rfm" | "automations";

export default function CrmPage() {
    const [activeTab, setActiveTab] = useState<CrmTab>("pipeline");
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isNewOpen, setIsNewOpen] = useState(false);

    const { data: customers = [], upsertCustomer } = useCRM();

    return (
        <div className="min-h-screen bg-surface-base text-text-primary p-6">
            <header className="mb-6 flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-serif font-bold">CRM Clients</h1>
                    <p className="text-sm text-text-muted mt-1">
                        Pipeline commercial, fiches clients et historique de relation.
                    </p>
                </div>
                <button
                    onClick={() => setIsNewOpen(true)}
                    className="flex items-center gap-2 px-3 py-2 rounded-md bg-action-primary text-text-primary text-sm font-medium hover:opacity-90"
                >
                    <PlusCircle className="w-4 h-4" /> Nouveau client
                </button>
            </header>

            <nav className="flex gap-1 border-b border-border mb-6 overflow-x-auto">
                {([
                    { id: "pipeline", label: "Pipeline CRM", icon: Contact },
                    { id: "customers", label: "Clients", icon: Users },
                    { id: "history", label: "Historique", icon: History },
                    { id: "import", label: "Import CSV", icon: Upload },
                    { id: "promos", label: "Codes Promo", icon: Tag },
                    { id: "emails", label: "Campagnes Email", icon: Mail },
                    { id: "automations", label: "Automations", icon: Zap },
                    { id: "rfm", label: "Segmentation RFM", icon: TrendingUp },
                    { id: "analytics", label: "Analytiques", icon: BarChart2 },
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
                {activeTab === "pipeline" && (
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
                onSave={(customer) => {
                    upsertCustomer(customer);
                    setIsNewOpen(false);
                }}
            />
        </div>
    );
}
