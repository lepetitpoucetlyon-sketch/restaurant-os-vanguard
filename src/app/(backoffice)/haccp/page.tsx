// @ts-nocheck
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ShieldCheck,
    ClipboardCheck,
    Thermometer,
    Tags,
    AlertTriangle,
    Zap,
    LucideIcon,
    Droplets,
    Truck,
    Trash2,
} from "lucide-react";
import { cn } from "@/lib/ui.foundations";;
import { useHACCP } from "@/engines/guard/NexusGuardProvider";
import { PlanNettoyage } from "@/components/haccp/PlanNettoyage";
import { ReleveTemperatures } from "@/components/haccp/ReleveTemperatures";
import { TracabiliteEtiquettes } from "@/components/haccp/TracabiliteEtiquettes";
import { GestionAnomalies } from "@/components/haccp/GestionAnomalies";
import { ReceptionMarchandises } from "@/components/haccp/ReceptionMarchandises";
import { WasteManagementHACCP } from "@/components/haccp/WasteManagementHACCP";
import { GestionHuiles } from "@/components/haccp/GestionHuiles";
import { ExpertHub } from "@/components/agency/ExpertHub";

type MainTabType = 'vigilance' | 'tracabilite' | 'conformite';
type SubTabType = 'nettoyage' | 'temperatures' | 'etiquettes' | 'reception' | 'huiles' | 'anomalies' | 'dechets';

interface MainTab {
    id: MainTabType;
    label: string;
    icon: LucideIcon;
    subTabs: SubTabType[];
}

interface SubTab {
    id: SubTabType;
    label: string;
    icon: LucideIcon;
}

const MAIN_TABS: MainTab[] = [
    { id: 'vigilance', label: 'Vigilance Active', icon: ShieldCheck, subTabs: ['nettoyage', 'temperatures', 'huiles'] },
    { id: 'tracabilite', label: 'Traçabilité', icon: Tags, subTabs: ['reception', 'etiquettes'] },
    { id: 'conformite', label: 'Conformité & Maintenance', icon: ClipboardCheck, subTabs: ['anomalies', 'dechets'] }
];

const SUB_TABS: Record<SubTabType, SubTab> = {
    nettoyage: { id: 'nettoyage', label: 'Plan de Nettoyage', icon: ClipboardCheck },
    temperatures: { id: 'temperatures', label: 'Relevés Thermiques', icon: Thermometer },
    huiles: { id: 'huiles', label: 'Gestion des Huiles', icon: Droplets },
    reception: { id: 'reception', label: 'Réception Marchandises', icon: Truck },
    etiquettes: { id: 'etiquettes', label: 'Suivi des Étiquettes', icon: Tags },
    anomalies: { id: 'anomalies', label: 'Registre des Anomalies', icon: AlertTriangle },
    dechets: { id: 'dechets', label: 'Déchets & Maintenance', icon: Trash2 }
};

export default function HACCPPage() {
    const { getComplianceScore, criticalAlerts, checklists, sensors, temperatureHistory } = useHACCP();
    const complianceScore = getComplianceScore();

    const [activeMainTab, setActiveMainTab] = useState<MainTabType>('vigilance');
    const [activeSubTab, setActiveSubTab] = useState<SubTabType>('nettoyage');

    const handleMainTabChange = (tabId: MainTabType) => {
        setActiveMainTab(tabId);
        // Default to first sub tab of the new main tab
        const tabData = MAIN_TABS.find(t => t.id === tabId);
        if (tabData && tabData.subTabs.length > 0) {
            setActiveSubTab(tabData.subTabs[0]);
        }
    };

    return (
        <div className="flex flex-1 flex-col h-[calc(100vh-80px)] lg:h-[calc(100vh-100px)] -m-4 lg:-m-8 bg-bg-secondary relative overflow-hidden">
            {/* Immersive Header Effects */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-gold/10 rounded-full blur-[120px] -mr-64 -mt-64 pointer-events-none z-0" />
            <div className="absolute top-1/4 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] -ml-32 pointer-events-none z-0" />

            <div className="bg-bg-primary/80 backdrop-blur-3xl px-6 lg:px-12 pt-8 pb-4 border-b border-border/50 z-40 relative shadow-2xl shadow-black/5">
                <div className="flex items-center justify-between w-full gap-8">
                    {/* Level 1 Navigation (Main Tabs) */}
                    <div className="flex gap-4 overflow-x-auto no-scrollbar py-2 flex-1">
                        {MAIN_TABS.map(tab => {
                            const isActive = activeMainTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => handleMainTabChange(tab.id as MainTabType)}
                                    className={cn(
                                        "flex items-center gap-4 h-14 px-8 rounded-full text-[11px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap border relative group",
                                        isActive
                                            ? "bg-text-primary text-bg-primary border-transparent shadow-[0_15px_40px_rgba(0,0,0,0.2)] dark:shadow-none scale-105 z-10 font-serif italic"
                                            : "bg-bg-tertiary/50 text-text-muted border-border/50 hover:bg-bg-primary hover:border-accent-gold/30 hover:text-text-primary"
                                    )}
                                >
                                    <tab.icon className={cn("w-5 h-5 transition-colors", isActive ? "text-accent-gold" : "text-text-muted group-hover:text-accent-gold")} />
                                    {tab.label}
                                    {isActive && (
                                        <motion.div
                                            layoutId="mainTabIndicator"
                                            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-10 h-1.5 bg-accent-gold rounded-full blur-[1px] shadow-[0_4px_12px_rgba(212,175,55,0.6)]"
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-6 shrink-0">
                        {criticalAlerts.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 px-5 py-3 rounded-[20px]"
                            >
                                <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                                <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{criticalAlerts.length} Points Critiques</span>
                            </motion.div>
                        )}
                        
                        <div className="flex items-center gap-4 bg-bg-primary/50 backdrop-blur-md px-8 py-5 rounded-[32px] border border-border shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-accent-gold/5 translate-y-full group-hover:translate-y-0 transition-transform duration-700" />
                            <Zap className={cn("w-6 h-6 relative z-10", complianceScore >= 95 ? "text-emerald-500" : complianceScore >= 80 ? "text-amber-500" : "text-rose-500")} />
                            <div className="relative z-10">
                                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-text-muted mb-0.5 opacity-60">Global Compliance</div>
                                <div className="text-3xl font-serif font-black italic text-text-primary leading-none tracking-tight">{complianceScore}%</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area with Level 2 Navigation enclosed */}
            <div className="flex-1 overflow-auto bg-bg-secondary flex flex-col items-center">
                <div className="w-full max-w-7xl p-6 lg:p-12 space-y-10">

                    {/* Level 2 Navigation (Sub Tabs) */}
                    <div className="flex border-b border-border/50 gap-10 pb-1 px-4">
                        {MAIN_TABS.find(t => t.id === activeMainTab)?.subTabs.map(subTabId => {
                            const subTab = SUB_TABS[subTabId];
                            const isActive = activeSubTab === subTabId;

                            return (
                                <button
                                    key={subTabId}
                                    onClick={() => setActiveSubTab(subTabId)}
                                    className={cn(
                                        "pb-5 flex items-center gap-3 text-[12px] font-black uppercase tracking-[0.25em] transition-all relative group",
                                        isActive ? "text-accent-gold font-serif italic" : "text-text-muted hover:text-text-primary"
                                    )}
                                >
                                    <subTab.icon className={cn("w-4 h-4 transition-transform", isActive ? "scale-110" : "group-hover:scale-110")} />
                                    {subTab.label}
                                    {isActive && (
                                        <motion.div
                                            layoutId="subTabIndicator"
                                            className="absolute bottom-[-1.5px] left-0 w-full h-[3px] bg-accent-gold rounded-t-full shadow-[0_-4px_15px_rgba(212,175,55,0.8)]"
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Active Component Rendering */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeSubTab}
                            initial={{ opacity: 0, x: -10, filter: "blur(10px)" }}
                            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                            exit={{ opacity: 0, x: 10, filter: "blur(10px)" }}
                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                            className="bg-transparent pb-20"
                        >
                            {activeSubTab === 'nettoyage' && <PlanNettoyage />}
                            {activeSubTab === 'temperatures' && <ReleveTemperatures />}
                            {activeSubTab === 'huiles' && <GestionHuiles />}
                            {activeSubTab === 'reception' && <ReceptionMarchandises />}
                            {activeSubTab === 'etiquettes' && <TracabiliteEtiquettes />}
                            {activeSubTab === 'anomalies' && <GestionAnomalies />}
                            {activeSubTab === 'dechets' && <WasteManagementHACCP />}
                        </motion.div>
                    </AnimatePresence>

                </div>
            </div>

            {/* Diagnostic & Expertise Center */}
            <ExpertHub 
                domain="haccp" 
            />

        </div>
    );
}
