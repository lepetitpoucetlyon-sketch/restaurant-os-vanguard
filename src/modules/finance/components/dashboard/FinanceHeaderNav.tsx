"use client";

import {
    BookOpen,
    Receipt,
    ShieldCheck,
    PlusCircle,
    Landmark,
    Wallet,
} from "lucide-react";
import type { FinanceTab } from "../financeUtils";

interface FinanceHeaderNavProps {
    activeTab: FinanceTab;
    setActiveTab: (t: FinanceTab) => void;
    setClaimOpen: (open: boolean) => void;
    canSeeTreasury: boolean;
    canSeeAudit: boolean;
}

export function FinanceHeaderNav({
    activeTab,
    setActiveTab,
    setClaimOpen,
    canSeeTreasury,
    canSeeAudit,
}: FinanceHeaderNavProps) {
    return (
        <>
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
                    { id: "treasury", label: "Trésorerie", icon: Wallet },
                    { id: "audit", label: "Audit fiscal", icon: ShieldCheck },
                ] as const).filter(tab => {
                    if (tab.id === "treasury") return canSeeTreasury;
                    if (tab.id === "audit") return canSeeAudit;
                    return true;
                }).map((tab) => {
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
        </>
    );
}
