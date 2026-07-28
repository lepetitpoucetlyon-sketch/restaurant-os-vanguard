"use client";

import { motion } from "framer-motion";
import { fadeInUp } from "@/shared/utils/motion";
import { 
    Folder, Layers, 
    Monitor, Database, Brain
} from "lucide-react";
import { GlassCard } from "@ui/GlassCard";

const STRUCTURE = [
    {
        title: "L'Apparence (UI/UX)",
        path: "src/app, src/components",
        icon: Monitor,
        color: "blue",
        desc: "Next.js 16 App Router, Tailwind 4 & Framer Motion pour une interface fluide."
    },
    {
        title: "Le Cerveau (Logique)",
        path: "src/hooks, src/context",
        icon: Brain,
        color: "purple",
        desc: "Hooks React avancés & Contextes avec synchronisation temps-réel."
    },
    {
        title: "La Mémoire (Données)",
        path: "src/lib/firebase, firestore.rules",
        icon: Database,
        color: "emerald",
        desc: "Firestore Cloud-Native & Cloud Functions pour la persistance atomique."
    },
    {
        title: "L'ADN (Types)",
        path: "src/types",
        icon: Layers,
        color: "amber",
        desc: "Définitions TypeScript strictes pour sécuriser le domaine métier."
    }
];

export function StructureOverview() {
    return (
        <GlassCard className="p-10 space-y-10">
            <div className="grid grid-cols-1 gap-6">
                {STRUCTURE.map((item, _i) => (
                    <motion.div
                        key={item.title}
                        variants={fadeInUp}
                        className="flex items-start gap-8 p-6 rounded-3xl bg-bg-tertiary/40 border border-border/50 hover:border-accent-gold/20 transition-all group"
                    >
                        <div className={`w-14 h-14 rounded-2xl bg-${item.color}-500/10 border border-border flex items-center justify-center`}>
                            <item.icon className={`w-7 h-7 text-${item.color}-400`} />
                        </div>
                        
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xl font-serif text-text-primary capitalize">{item.title}</h4>
                                <span className="text-[9px] font-mono p-1 bg-border/20 rounded uppercase text-text-muted">{item.path}</span>
                            </div>
                            <p className="text-sm text-text-muted max-w-md">{item.desc}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Aperçu de l'Arborescence */}
            <div className="pt-10 border-t border-border/50 font-mono text-[11px] text-text-muted/60 bg-surface-sidebar/20 p-6 rounded-2xl">
                <div className="flex items-center gap-2 mb-4 text-accent-gold uppercase tracking-[0.2em] font-black">
                    <Folder className="w-3 h-3" /> Structure Racine
                </div>
                <div className="space-y-1">
                    <p className="flex items-center gap-2"><span className="text-border">├──</span> <Folder className="w-3 h-3" /> app/ <span className="text-text-primary/20 italic">{"// Routage & Navigation"}</span></p>
                    <p className="flex items-center gap-2"><span className="text-border">├──</span> <Folder className="w-3 h-3" /> components/ <span className="text-text-primary/20 italic">{"// UI Atomique"}</span></p>
                    <p className="flex items-center gap-2"><span className="text-border">├──</span> <Folder className="w-3 h-3" /> context/ <span className="text-text-primary/20 italic">{"// État Cloud Global"}</span></p>
                    <p className="flex items-center gap-2"><span className="text-border">├──</span> <Folder className="w-3 h-3" /> hooks/ <span className="text-text-primary/20 italic">{"// Logique Hooks"}</span></p>
                    <p className="flex items-center gap-2"><span className="text-border">├──</span> <Folder className="w-3 h-3" /> lib/ <span className="text-text-primary/20 italic">{"// SDKs & Utilitaires"}</span></p>
                    <p className="flex items-center gap-2"><span className="text-border">└──</span> <Folder className="w-3 h-3" /> types/ <span className="text-text-primary/20 italic">{"// Interfaces TS Strict"}</span></p>
                </div>
            </div>
        </GlassCard>
    );
}
