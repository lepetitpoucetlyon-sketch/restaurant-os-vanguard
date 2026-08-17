"use client";

import { Star, History, TrendingUp } from "lucide-react";
import type { Customer } from "@nexus/contracts";

export type DetailTab = "profil" | "historique" | "fidelite";

interface CustomerDetailHeaderProps {
    customer: Customer;
    activeTab: DetailTab;
    setActiveTab: (t: DetailTab) => void;
}

export function CustomerDetailHeader({
    customer,
    activeTab,
    setActiveTab,
}: CustomerDetailHeaderProps) {
    const tabs: { id: DetailTab; label: string; icon: React.ElementType }[] = [
        { id: "profil", label: "Profil", icon: Star },
        { id: "historique", label: "Historique", icon: History },
        { id: "fidelite", label: "Fidélité", icon: TrendingUp },
    ];

    return (
        <>
            {/* Header */}
            <div className="bg-surface-sidebar p-6 md:p-10 relative overflow-hidden text-text-primary border-b border-white/5">
                <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 relative z-10">
                    <div className="w-16 h-16 md:w-24 md:h-24 rounded-[2rem] bg-surface-card/5 backdrop-blur-md border border-subtle flex items-center justify-center text-2xl md:text-4xl font-serif font-light italic shadow-2xl text-accent">
                        {(customer.firstName || "").charAt(0)}
                        {(customer.lastName || "").charAt(0)}
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em] text-text-primary/40 mb-2">
                            Profil Client Executive Intelligence
                        </p>
                        <h2 className="text-2xl md:text-4xl font-serif font-light tracking-tight italic">
                            {customer.firstName} {customer.lastName}
                        </h2>
                        <div className="flex flex-wrap justify-center md:justify-start items-center gap-2 md:gap-3 mt-4 md:mt-6">
                            {customer.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 md:px-4 md:py-1.5 rounded-full bg-accent text-bg-primary shadow-lg shadow-amber-500/20"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 blur-[100px] rounded-full -mr-32 -mt-32" />
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/5 bg-surface-sidebar">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-widest transition-colors ${
                                active
                                    ? "text-accent border-b-2 border-accent"
                                    : "text-text-primary/30 hover:text-text-primary/60"
                            }`}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>
        </>
    );
}
