"use client";

import { motion } from "framer-motion";
import { fadeInUp } from "@/lib/motion";
import { 
    MousePointer2, Database, Receipt, Cpu, ChevronRight, Activity
} from "lucide-react";
import { GlassCard } from "@ui/GlassCard";

const ONDES_DE_CHOC = [
    {
        icon: MousePointer2,
        title: "Action Utilisateur",
        desc: "Validation d'une Commande Caisse",
        items: ["Profil: Maître d'Hôtel", "Module: Terminal Vente", "Statut: PAYÉ"],
        color: "blue"
    },
    {
        icon: Database,
        title: "Noyau Firestore",
        desc: "Mise à jour Atomique",
        items: ["commandes/maj", "stocks/déduction", "audit/enregistrement"],
        color: "emerald"
    },
    {
        icon: Receipt,
        title: "Ingénierie Fiscale",
        desc: "Génération FEC Immédiate",
        items: ["ventilation/TVA", "grand_livre/update", "archive/conformité"],
        color: "accent-gold"
    },
    {
        icon: Cpu,
        title: "Oracle Predictor",
        desc: "Analyse des Répercussions",
        items: ["tendance/ventes", "seuil/alerte_stock", "score/HACCP"],
        color: "purple"
    }
];

export function ActionImpactMap() {
    return (
        <div className="relative space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
                {/* Connection Line */}
                <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent -translate-y-1/2 hidden md:block" />

                {ONDES_DE_CHOC.map((step, i) => (
                    <motion.div
                        key={step.title}
                        variants={fadeInUp}
                        className="relative group"
                    >
                        <GlassCard className="relative z-10 p-8 hover:border-accent-gold/40 transition-all hover:translate-y-[-8px]">
                            <div className="flex flex-col items-center text-center gap-6">
                                <div className={`w-16 h-16 rounded-2xl bg-${step.color}-500/10 border border-border flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                                    <step.icon className={`w-8 h-8 text-${step.color}-400`} />
                                </div>
                                
                                <div>
                                    <h4 className="text-xl font-serif text-text-primary mb-1">{step.title}</h4>
                                    <p className="text-xs text-text-muted font-medium uppercase tracking-widest">{step.desc}</p>
                                </div>

                                <div className="w-full space-y-2 pt-4 border-t border-border/50 text-left">
                                    {step.items.map(item => (
                                        <div key={item} className="flex items-center gap-2">
                                            <div className="w-1 h-1 rounded-full bg-border" />
                                            <span className="text-[10px] font-mono text-text-muted/80">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Animation d'Onde */}
                            <div className="absolute inset-0 -z-10 bg-accent/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem]" />
                        </GlassCard>

                        {i < ONDES_DE_CHOC.length - 1 && (
                            <div className="absolute top-1/2 -right-4 -translate-y-1/2 z-20 md:block hidden">
                                <div className="w-8 h-8 rounded-full bg-bg-primary border border-border flex items-center justify-center">
                                    <ChevronRight className="w-4 h-4 text-border" />
                                </div>
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>

            <motion.div variants={fadeInUp} className="bg-bg-secondary/50 border border-border/50 rounded-3xl p-10 flex items-center gap-10">
                <div className="w-20 h-20 rounded-full bg-bg-tertiary border-2 border-accent-gold/20 flex items-center justify-center shrink-0">
                    <Activity className="w-10 h-10 text-accent-gold animate-pulse" />
                </div>
                <div className="flex-1 space-y-2">
                    <h3 className="text-2xl font-serif">Flux en <span className="text-accent-gold">Temps Réel</span></h3>
                    <p className="text-text-muted text-sm max-w-2xl">
                        Grâce à l'architecture Cloud-Native, chaque impact est répercuté instantanément 
                        sur tous les interfaces connectées. Pas de rechargement, pas de latence.
                    </p>
                </div>
                <div className="flex gap-4">
                    <div className="px-5 py-3 bg-bg-tertiary rounded-2xl border border-border font-mono text-[10px] uppercase tracking-widest text-status-success">
                        Propagation: ~150ms
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
