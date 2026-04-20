// @ts-nocheck
"use client";

import React, { useState } from 'react';
import { 
    MessageSquare, 
    ShieldCheck, 
    Wrench, 
    TrendingUp, 
    AreaChart, 
    Cpu 
} from "lucide-react";
import { cn } from '@/lib/ui.foundations';
import { AnimatePresence } from "framer-motion";
import { ReputationView } from "@/components/intelligence/ReputationView";
import { ComplianceView, IoTView } from "@/components/intelligence/ComplianceView";
import { ProfitabilityView, SimulatorView } from "@/components/intelligence/ProfitabilityView";

type TabId = 'reputation' | 'hr' | 'iot' | 'profitability' | 'simulator';

interface IntelligenceControllerProps {
    data: {
        reviews: any[];
        complianceAlerts: any[];
        equipmentMetrics: any[];
        profitabilityAlerts: any[];
    }
}

export const IntelligenceController: React.FC<IntelligenceControllerProps> = ({ data }) => {
    const [activeTab, setActiveTab] = useState<TabId>('reputation');

    const tabs = [
        { id: 'reputation', label: 'Sentiment', icon: MessageSquare },
        { id: 'hr', label: 'Légalité', icon: ShieldCheck },
        { id: 'iot', label: 'Maintenance', icon: Wrench },
        { id: 'profitability', label: 'Marge', icon: TrendingUp },
        { id: 'simulator', label: 'Simulateur', icon: AreaChart },
    ];

    return (
        <div className="flex flex-1 flex-col overflow-hidden">
            {/* Header & Categories Swiper */}
            <div className="bg-white/80 dark:bg-bg-primary/80 backdrop-blur-xl px-6 py-6 border-b border-border/50 sticky top-0 z-40">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-4xl font-serif font-black italic text-text-primary tracking-tight">Oracle<span className="text-accent-gold">.</span></h1>
                        <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.3em] mt-1">Intelligence Nerveuse Centralisée</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-bg-tertiary flex items-center justify-center border border-border">
                        <Cpu className="w-5 h-5 text-accent-gold" />
                    </div>
                </div>

                {/* Navigation Swiper */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabId)}
                            className={cn(
                                "flex items-center gap-2 h-11 px-6 rounded-full text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                                activeTab === tab.id ? "bg-text-primary text-white shadow-xl scale-105" : "bg-bg-tertiary text-text-muted"
                            )}
                        >
                            <tab.icon className="w-3.5 h-3.5" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto p-4 space-y-6 elegant-scrollbar">
                <AnimatePresence mode="wait">
                    {activeTab === 'reputation' && <ReputationView key="reputation" reviews={data.reviews} />}
                    {activeTab === 'hr' && <ComplianceView key="hr" alerts={data.complianceAlerts} />}
                    {activeTab === 'iot' && <IoTView key="iot" metrics={data.equipmentMetrics} />}
                    {activeTab === 'profitability' && <ProfitabilityView key="profitability" alerts={data.profitabilityAlerts} />}
                    {activeTab === 'simulator' && <SimulatorView key="simulator" />}
                </AnimatePresence>
            </div>
        </div>
    );
};
