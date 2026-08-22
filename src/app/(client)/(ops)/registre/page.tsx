"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ScrollText,
    FileText,
    Flame,
    ShieldCheck,
    Accessibility,
    BadgeCheck,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Calendar,
    Clock,
    LucideIcon,
    Beef,
} from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { useRegistre } from "@/modules/ops";
import {
    DUERPSection,
    IncendieSection,
    Cerfa13984Section,
    PrestatairesSection,
    PMRSection,
    SanitaryComplianceSection,
    InterventionLogSection,
} from "@/modules/facility";
import { Modal } from "@ui/Modal";
import { withPageGuard } from "@/shared/components/rbac/PageGuard";
import { TabGuard } from "@/shared/components/rbac/TabGuard";
import { useTabAccess } from "@/shared/hooks/useTabAccess";

type TabType = 'overview' | 'duerp' | 'incendie' | 'prestataires' | 'pmr' | 'conformite' | 'interventions';

interface Tab {
    id: TabType;
    label: string;
    icon: LucideIcon;
}

const TABS: Tab[] = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: ScrollText },
    { id: 'duerp', label: 'Document Unique', icon: FileText },
    { id: 'incendie', label: 'Sécurité Incendie', icon: Flame },
    { id: 'prestataires', label: 'Prestataires', icon: BadgeCheck },
    { id: 'interventions', label: 'Passages Techniques', icon: Clock },
    { id: 'pmr', label: 'Accessibilité PMR', icon: Accessibility },
    { id: 'conformite', label: 'Conformité Sanitaire', icon: Beef },
];

function StatusBadge({ status }: { status: 'conforme' | 'attention' | 'non_conforme' | string }) {
    const config = {
        conforme: { label: 'Conforme', icon: CheckCircle2, color: 'bg-success/10 text-success border-success/20' },
        attention: { label: 'Attention', icon: AlertTriangle, color: 'bg-warning/10 text-warning border-warning/20' },
        non_conforme: { label: 'Non conforme', icon: XCircle, color: 'bg-error/10 text-error border-error/20' },
    };
    const c = config[status as keyof typeof config] || config.attention;
    return (
        <span className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border", c.color)}>
            <c.icon className="w-3 h-3" />
            {c.label}
        </span>
    );
}

function RegistrePage() {
    const canSeeDuerp = useTabAccess("registre", "duerp");
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [isCerfaOpen, setIsCerfaOpen] = useState(false);
    const { duerp, cerfa, pmrDoc, incendieDoc, hottesDoc, certHalal, agrementBoucher: _agrementBoucher, prestataires, getOverallStatus } = useRegistre();

    const overall = getOverallStatus() as { conforme: number; attention: number; non_conforme: number };
    const allDocs = [
        { doc: duerp, tab: 'duerp' as TabType, icon: FileText, color: '#3B82F6' },
        { doc: incendieDoc, tab: 'incendie' as TabType, icon: Flame, color: '#EF4444' },
        { doc: hottesDoc, tab: 'conformite' as TabType, icon: ShieldCheck, color: '#f97316' },
        { doc: certHalal, tab: 'conformite' as TabType, icon: Beef, color: '#10b981' },
        { doc: cerfa, tab: 'overview' as TabType, icon: ShieldCheck, color: '#8B5CF6', isModal: true },
        { doc: pmrDoc, tab: 'pmr' as TabType, icon: Accessibility, color: '#0EA5E9' },
    ];

    return (
        <div className="flex flex-1 h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] -m-4 md:-m-8 flex-col bg-bg-primary overflow-hidden pb-20 md:pb-0">
            {/* Tab Navigation */}
            <div className="bg-bg-secondary border-b border-border px-4 md:px-10 py-3 flex items-center gap-2 overflow-x-auto scrollbar-hide">
                {TABS.filter(tab => {
                    if (tab.id === 'duerp') return canSeeDuerp;
                    return true;
                }).map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-[10px] uppercase tracking-widest transition-all duration-300 whitespace-nowrap",
                            activeTab === tab.id
                                ? "bg-bg-tertiary text-accent border border-accent/20 shadow-sm"
                                : "text-text-muted hover:text-text-primary hover:bg-bg-tertiary/10"
                        )}
                    >
                        <tab.icon strokeWidth={1.5} className="w-3.5 h-3.5" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6 md:p-10 lg:p-12 elegant-scrollbar">
                <AnimatePresence mode="wait">
                    {activeTab === 'overview' && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="max-w-6xl mx-auto space-y-10"
                        >
                            {/* Conformity Dashboard */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                    { label: 'Conforme', count: overall.conforme, icon: CheckCircle2, color: 'text-success', bg: 'bg-success/5 border-success/10' },
                                    { label: 'Attention', count: overall.attention, icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/5 border-warning/10' },
                                    { label: 'Non conforme', count: overall.non_conforme, icon: XCircle, color: 'text-error', bg: 'bg-error/5 border-error/10' },
                                ].map((stat) => (
                                    <div key={stat.label} className={cn("p-8 rounded-2xl border shadow-sm", stat.bg)}>
                                        <div className="flex items-center justify-between mb-4">
                                            <stat.icon className={cn("w-8 h-8", stat.color)} strokeWidth={1.5} />
                                            <span className={cn("text-4xl font-serif font-black", stat.color)}>{stat.count}</span>
                                        </div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted">{stat.label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Documents Cards */}
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] px-1">Registres Obligatoires</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {allDocs.map(({ doc, tab, icon: Icon, color, isModal }) => (
                                        <button
                                            key={doc.id}
                                            onClick={() => isModal ? setIsCerfaOpen(true) : setActiveTab(tab)}
                                            className="group bg-surface-card dark:bg-bg-secondary rounded-2xl border border-border p-8 text-left hover:shadow-2xl hover:border-accent/30 transition-all duration-500 relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full opacity-5 group-hover:opacity-10 transition-opacity" style={{ backgroundColor: color }} />

                                            <div className="flex items-start justify-between mb-6">
                                                <div className="w-12 h-12 rounded-xl flex items-center justify-center border border-border shadow-sm" style={{ backgroundColor: `${color}10`, color }}>
                                                    <Icon strokeWidth={1.5} className="w-6 h-6" />
                                                </div>
                                                <StatusBadge status={doc.status} />
                                            </div>

                                            <h4 className="text-lg font-serif font-bold text-text-primary group-hover:text-accent transition-colors leading-tight">{doc.title}</h4>
                                            <p className="text-[12px] text-text-muted mt-2 leading-relaxed line-clamp-2">{doc.description}</p>

                                            <div className="flex items-center gap-6 mt-6 pt-6 border-t border-border/50">
                                                <div className="flex items-center gap-2 text-text-muted">
                                                    <Calendar strokeWidth={1.5} className="w-3.5 h-3.5" />
                                                    <span className="text-[10px] font-mono">MAJ : {doc.lastUpdated}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-text-muted">
                                                    <Clock strokeWidth={1.5} className="w-3.5 h-3.5" />
                                                    <span className="text-[10px] font-mono">Révision : {doc.nextReview}</span>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Prestataires summary */}
                            <button
                                onClick={() => setActiveTab('prestataires')}
                                className="w-full group bg-surface-card dark:bg-bg-secondary rounded-2xl border border-border p-8 text-left hover:shadow-2xl hover:border-accent/30 transition-all duration-500"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-status-warning/10 text-status-warning flex items-center justify-center border border-action-primary/10">
                                            <BadgeCheck strokeWidth={1.5} className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-serif font-bold text-text-primary group-hover:text-accent transition-colors">Certifications Prestataires</h4>
                                            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mt-0.5">{prestataires.length} prestataires enregistrés</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {prestataires.map(p => (
                                            <div key={p.id} className={cn(
                                                "w-3 h-3 rounded-full",
                                                p.status === 'valide' ? 'bg-success' : p.status === 'expire' ? 'bg-error' : 'bg-warning'
                                            )} />
                                        ))}
                                    </div>
                                </div>
                            </button>
                        </motion.div>
                    )}

                    {activeTab === 'duerp' && (
                        <TabGuard pageKey="registre" tabKey="duerp">
                            <motion.div key="duerp" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                <DUERPSection />
                            </motion.div>
                        </TabGuard>
                    )}
                    {activeTab === 'incendie' && (
                        <motion.div key="incendie" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <IncendieSection />
                        </motion.div>
                    )}
                    {activeTab === 'prestataires' && (
                        <motion.div key="prestataires" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <PrestatairesSection />
                        </motion.div>
                    )}
                    {activeTab === 'pmr' && (
                        <motion.div key="pmr" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <PMRSection />
                        </motion.div>
                    )}
                    {activeTab === 'conformite' && (
                        <motion.div key="conformite" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <SanitaryComplianceSection />
                        </motion.div>
                    )}
                    {activeTab === 'interventions' && (
                        <motion.div key="interventions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <InterventionLogSection />
                        </motion.div>
                    )}
                </AnimatePresence>

                <Modal isOpen={isCerfaOpen} onClose={() => setIsCerfaOpen(false)} size="xl">
                    <div className="p-2 md:p-6 bg-bg-primary rounded-[3rem] overflow-hidden">
                        <Cerfa13984Section />
                    </div>
                </Modal>
            </div>
        </div>
    );
}

export default withPageGuard(RegistrePage, "registre");
