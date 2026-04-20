"use client";

// IMPORTANT SÉMANTIQUE :
// Ce fichier utilise le terme "PMS" pour "Plan de Maîtrise Sanitaire" (Norme HACCP).
// Il est distinct du système de gestion opérationnelle des tables (Floor Ops).

import { useState } from "react";
import {
    FileText,
    Shield,
    Users,
    Hammer,
    Droplets,
    Thermometer,
    Truck,
    Bug,
    ClipboardCheck,
    AlertTriangle,
    CheckCircle2,
    BookOpen,
    Menu,
    ChevronRight,
    Search,
    ShieldCheck,
    Cpu,
    Fingerprint,
    Lock,
    ArrowUpRight
} from "lucide-react";
import { cn } from "@/lib/ui.foundations";;
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

// Type definitions for the PMS structure
type PmsSection = {
    id: string;
    title: string;
    description: string;
    icon: any;
    subsections: PmsSubsection[];
};

type PmsSubsection = {
    id: string;
    title: string;
    content: React.ReactNode;
};

// Data structure based on the user request
const PMS_DATA: PmsSection[] = [
    {
        id: "bph",
        title: "1. Bonnes Pratiques d'Hygiène",
        description: "Protocoles neuro-sanitaires et pré-requis opérationnels.",
        icon: Shield,
        subsections: [
            {
                id: "personnel",
                title: "1.1 Le Personnel",
                content: (
                    <div className="space-y-8">
                        <div className="bg-bg-tertiary/20 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-border/30 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00D9A6]/5 rounded-full blur-3xl" />
                            <h4 className="text-2xl font-serif italic font-black text-white mb-6 flex items-center gap-4">
                                <Users className="w-6 h-6 text-[#00D9A6]" /> Plan de Formation
                            </h4>
                            <p className="text-[13px] font-bold text-text-muted uppercase tracking-widest mb-6 border-l-2 border-[#00D9A6] pl-4">
                                Programme de formation continue à la sécurité sanitaire.
                            </p>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    "Formation initiale à l'embauche",
                                    "Rappels annuels sur les BPH",
                                    "Formation spécifique responsables",
                                    "Audit de comportement thermique"
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 p-4 bg-bg-tertiary/20 rounded-2xl border border-white/5 text-sm text-white/60">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#00D9A6]" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-bg-tertiary/20 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-border/30">
                            <h4 className="text-2xl font-serif italic font-black text-white mb-6 flex items-center gap-4">
                                <CheckCircle2 className="w-6 h-6 text-[#00D9A6]" /> Tenue Vestimentaire
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {[
                                    { label: "Veste & Pantalon", desc: "Coton 100% aseptisé" },
                                    { label: "Coiffe Intégrale", desc: "Protection capillaire" },
                                    { label: "Chaussures S3", desc: "Norme antidérapante" }
                                ].map((item, i) => (
                                    <div key={i} className="p-6 bg-bg-tertiary/20 rounded-3xl border border-white/5 hover:border-white/20 transition-all text-center">
                                        <p className="text-sm font-black text-white mb-1 uppercase tracking-tighter">{item.label}</p>
                                        <p className="text-[10px] text-white/30 font-bold uppercase">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )
            },
            {
                id: "maintenance",
                title: "1.2 Maintenance",
                content: (
                    <div className="space-y-6">
                        <div className="bg-bg-tertiary/20 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-border/30">
                            <h4 className="text-2xl font-serif italic font-black text-white mb-6 flex items-center gap-4">
                                <Hammer className="w-6 h-6 text-amber-500" /> Infrastructure Matrix
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-8 bg-gradient-to-br from-white/5 to-transparent rounded-3xl border border-white/5">
                                    <h5 className="text-[11px] font-black text-amber-500 uppercase tracking-widest mb-4">Systèmes Locaux</h5>
                                    <p className="text-sm text-white/50 leading-relaxed">Maintenance préventive des murs, sols, et flux d'air (Marche en avant vectorisée).</p>
                                </div>
                                <div className="p-8 bg-gradient-to-br from-white/5 to-transparent rounded-3xl border border-white/5">
                                    <h5 className="text-[11px] font-black text-amber-500 uppercase tracking-widest mb-4">Unités Thermiques</h5>
                                    <p className="text-sm text-white/50 leading-relaxed">Contrats d'entretien annuels pour chambres froides et terminaux d'extraction.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            },
            {
                id: "hygiene",
                title: "1.3 Hygiène de Production",
                content: (
                    <div className="space-y-6">
                        <div className="bg-bg-tertiary/20 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-border/30 overflow-hidden relative">
                            <h4 className="text-2xl font-serif italic font-black text-white mb-8 flex items-center gap-4">
                                <Droplets className="w-6 h-6 text-cyan-400" /> Matrice DP (Désinfection)
                            </h4>
                            <div className="overflow-x-auto elegant-scrollbar-horizontal pb-4">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-border/30">
                                            <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Secteur</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Fréquence</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Protocole</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {[
                                            { zone: "Surfaces Contact", freq: "Post-Service", method: "Dégraissage Neural" },
                                            { zone: "Vecteurs Sols", freq: "Quotidien", method: "Brossage Haute T°" },
                                            { zone: "Hottes Extraction", freq: "Hebdomadaire", method: "Désinfection Vapeur" }
                                        ].map((row, i) => (
                                            <tr key={i} className="hover:bg-bg-tertiary/20 transition-colors group">
                                                <td className="px-6 py-6 text-sm font-serif italic font-black text-white">{row.zone}</td>
                                                <td className="px-6 py-6"><span className="text-[9px] font-black bg-cyan-400/10 text-cyan-400 px-3 py-1 rounded-lg border border-cyan-400/20">{row.freq}</span></td>
                                                <td className="px-6 py-6 text-xs text-text-muted">{row.method}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )
            },
        ]
    },
    {
        id: "haccp",
        title: "2. Procédures HACCP",
        description: "Analyse des dangers et points de contrôle critiques.",
        icon: FileText,
        subsections: [
            {
                id: "dangers",
                title: "2.1 Analyse des Dangers",
                content: (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { title: "Biologiques", color: "rose", list: ["Salmonella", "Listeria", "Virus"] },
                            { title: "Chimiques", color: "cyan", list: ["Nettoyage", "Pesticides", "Allergènes"] },
                            { title: "Physiques", color: "amber", list: ["Verre/Métal", "Insectes", "Corps Étrangers"] }
                        ].map((box, i) => (
                            <div key={i} className={cn("p-8 rounded-[2.5rem] border bg-opacity-5 relative overflow-hidden group hover:scale-[1.02] transition-all",
                                box.color === 'rose' ? 'bg-rose-500 border-rose-500/20 shadow-[0_0_40px_rgba(244,63,94,0.1)]' :
                                    box.color === 'cyan' ? 'bg-[#00D9A6] border-[#00D9A6]/20 shadow-[0_0_40px_rgba(0,217,166,0.1)]' :
                                        'bg-amber-500 border-amber-500/20 shadow-[0_0_40px_rgba(245,158,11,0.1)]'
                            )}>
                                <div className={cn("w-12 h-12 rounded-2xl mb-6 flex items-center justify-center",
                                    box.color === 'rose' ? 'bg-rose-500/20 text-rose-500' :
                                        box.color === 'cyan' ? 'bg-[#00D9A6]/20 text-[#00D9A6]' :
                                            'bg-amber-500/20 text-amber-500'
                                )}>
                                    <AlertTriangle className="w-6 h-6" />
                                </div>
                                <h4 className="text-xl font-serif italic font-black text-white mb-4">{box.title}</h4>
                                <ul className="space-y-3">
                                    {box.list.map((item, j) => (
                                        <li key={j} className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                                            <div className="w-1 h-1 rounded-full bg-white/20" /> {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                )
            },
            {
                id: "ccp",
                title: "2.3 Points Critiques (CCP)",
                content: (
                    <div className="space-y-4">
                        {[
                            { step: "CCP 1", label: "Cuisson Thermique", desc: "T° > 63°C à coeur impérative pour neutralisation bactérienne." },
                            { step: "CCP 2", label: "Refroidissement", desc: "Passage de +63°C à +10°C en moins de 120 minutes." },
                            { step: "CCP 3", label: "Stockage Froid", desc: "Maintien permanent entre 0°C et +4°C." }
                        ].map((ccp, i) => (
                            <div key={i} className="flex items-center gap-6 p-8 bg-bg-tertiary/20 border border-border/30 rounded-[2rem] hover:bg-white/10 transition-colors group">
                                <div className="w-20 h-20 rounded-[1.8rem] bg-[#00D9A6] flex flex-col items-center justify-center text-bg-primary">
                                    <span className="text-[10px] font-black uppercase tracking-widest">{ccp.step.split(' ')[0]}</span>
                                    <span className="text-2xl font-black">{ccp.step.split(' ')[1]}</span>
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-xl font-serif italic font-black text-white group-hover:text-[#00D9A6] transition-colors">{ccp.label}</h4>
                                    <p className="text-sm text-white/30 mt-1">{ccp.desc}</p>
                                </div>
                                <ArrowUpRight className="w-6 h-6 text-white/5 group-hover:text-text-muted group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                            </div>
                        ))}
                    </div>
                )
            }
        ]
    }
];

export default function PMSPage() {
    const [activeSectionId, setActiveSectionId] = useState<string>("bph");
    const [activeSubsectionId, setActiveSubsectionId] = useState<string>("personnel");
    const [isSideNavOpen, setIsSideNavOpen] = useState(true);

    const activeSection = PMS_DATA.find(s => s.id === activeSectionId);
    const activeSubsection = activeSection?.subsections.find(sub => sub.id === activeSubsectionId) || activeSection?.subsections[0];

    return (
        <div className="flex h-screen -m-4 md:-m-8 bg-bg-primary overflow-hidden relative">
            {/* Toggle Button for Sidebar (Desktop) */}
            <motion.button
                initial={false}
                animate={{
                    left: isSideNavOpen ? 435 : 20,
                    rotate: isSideNavOpen ? 0 : 180
                }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                onClick={() => setIsSideNavOpen(!isSideNavOpen)}
                className="hidden md:flex absolute top-1/2 -translate-y-1/2 z-[60] w-10 h-10 rounded-full bg-white dark:bg-[#1A1A1A] border border-border/30 shadow-[0_0_30px_rgba(0,0,0,0.5)] items-center justify-center text-[#00D9A6] hover:scale-110 transition-all group"
            >
                <ChevronRight strokeWidth={2.5} className="w-5 h-5" />
            </motion.button>

            {/* Cinematic Background Gradient */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#00D9A6]/10 blur-[150px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-blue-500/5 blur-[100px] rounded-full" />
            </div>

            {/* Premium Vertical Sidebar */}
            <AnimatePresence initial={false}>
                {isSideNavOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: -450, width: 0 }}
                        animate={{ opacity: 1, x: 0, width: 450 }}
                        exit={{ opacity: 0, x: -450, width: 0 }}
                        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                        className="bg-bg-tertiary/20 backdrop-blur-3xl border-r border-border/30 flex flex-col h-full z-20 overflow-hidden shrink-0"
                    >
                        <div className="p-12 border-b border-border/30 min-w-[450px]">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-10 h-10 rounded-2xl bg-[#00D9A6]/10 border border-[#00D9A6]/20 flex items-center justify-center">
                                    <ShieldCheck className="w-5 h-5 text-[#00D9A6]" />
                                </div>
                                <h2 className="text-[10px] font-black text-text-muted uppercase tracking-[0.4em]">Neural Vault • Active</h2>
                            </div>
                            <h1 className="text-4xl font-serif italic font-black text-white tracking-tighter">PMS Digital</h1>
                            <p className="text-[12px] font-bold text-white/30 uppercase tracking-[0.2em] mt-3">Plan de Maîtrise Sanitaire • Vol. 1</p>
                        </div>

                        <div className="flex-1 overflow-y-auto elegant-scrollbar p-6 space-y-10">
                            {PMS_DATA.map((section) => (
                                <div key={section.id} className="space-y-4">
                                    <div className="px-6 flex items-center gap-4">
                                        <section.icon className="w-4 h-4 text-[#00D9A6]" />
                                        <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">{section.title}</h3>
                                    </div>

                                    <div className="space-y-2">
                                        {section.subsections.map((sub) => (
                                            <button
                                                key={sub.id}
                                                onClick={() => {
                                                    setActiveSectionId(section.id);
                                                    setActiveSubsectionId(sub.id);
                                                }}
                                                className={cn(
                                                    "w-full text-left p-6 rounded-[2rem] transition-all duration-500 group flex items-center justify-between",
                                                    activeSubsectionId === sub.id
                                                        ? "bg-white text-bg-primary shadow-2xl"
                                                        : "hover:bg-bg-tertiary/20 text-text-muted"
                                                )}
                                            >
                                                <div>
                                                    <p className={cn("text-lg font-serif italic font-black transition-colors",
                                                        activeSubsectionId === sub.id ? "text-bg-primary" : "group-hover:text-white")}>
                                                        {sub.title.split(' ').slice(1).join(' ')}
                                                    </p>
                                                    <p className={cn("text-[9px] font-black uppercase tracking-widest mt-1",
                                                        activeSubsectionId === sub.id ? "text-bg-primary/40" : "text-white/20"
                                                    )}>Protocol Verified • ID-{sub.id.toUpperCase()}</p>
                                                </div>
                                                {activeSubsectionId === sub.id && (
                                                    <div className="w-8 h-8 rounded-xl bg-bg-primary/5 flex items-center justify-center">
                                                        <ChevronRight className="w-4 h-4 text-bg-primary" />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Bottom Status Bar */}
                        <div className="p-8 border-t border-border/30 bg-bg-tertiary/20 flex items-center justify-between min-w-[450px]">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-[#00D9A6] animate-pulse shadow-[0_0_10px_#00D9A6]" />
                                <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">Master Sync Complete</span>
                            </div>
                            <Lock className="w-4 h-4 text-white/20" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Content Viewport */}
            <div className="flex-1 flex flex-col h-full bg-transparent overflow-hidden relative z-10">
                {/* Executive Header */}
                <div className="h-40 flex items-center justify-between px-16 backdrop-blur-sm">
                    <div>
                        <div className="flex items-center gap-4 mb-2">
                            <Cpu className="w-4 h-4 text-[#00D9A6]/40" />
                            <span className="text-[10px] font-black text-[#00D9A6] uppercase tracking-[0.4em]">Sector: {activeSubsection?.title.split(' ')[0]}</span>
                        </div>
                        <h2 className="text-5xl font-serif italic font-black text-white tracking-tighter">
                            {activeSubsection?.title.split(' ').slice(1).join(' ')}
                        </h2>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">Dernière Audit</p>
                            <p className="text-sm font-serif italic font-black text-[#00D9A6]">14 Janvier 2026</p>
                        </div>
                        <div className="w-px h-12 bg-bg-tertiary/20" />
                        <Button className="h-14 px-10 bg-white text-bg-primary hover:bg-white/90 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl">
                            <Fingerprint className="w-4 h-4 mr-3" /> Certifier PDF
                        </Button>
                    </div>
                </div>

                {/* Immersive Scrollable Content */}
                <div className="flex-1 overflow-y-auto elegant-scrollbar p-16">
                    <div className="max-w-5xl mx-auto pb-32">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeSubsection?.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.5, ease: "circOut" }}
                            >
                                {activeSubsection?.content}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>

                {/* Shadow Gradient Overlay */}
                <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-bg-primary to-transparent pointer-events-none" />
            </div>
        </div>
    );
}
