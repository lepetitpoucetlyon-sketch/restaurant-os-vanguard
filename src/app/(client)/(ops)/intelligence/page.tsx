"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Map, BarChart3, MessageSquare, TrendingUp, ArrowRight } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { withPageGuard } from "@/shared/components/rbac/PageGuard";
import { PageShell } from "@/shared/components/ui/PageShell";

/**
 * Hub /intelligence — passerelle vers les surfaces d'analyse et de pilotage du produit.
 */

interface HubCard {
    title: string;
    description: string;
    href: string;
    icon: typeof Sparkles;
    accent: string;
}

const CARDS: HubCard[] = [
    {
        title: "Monitoring & Tâches",
        description: "Supervision des services, synchronisation et diagnostic de l'application.",
        href: "/admin/agent",
        icon: MessageSquare,
        accent: "text-accent-gold bg-accent-gold/10",
    },
    {
        title: "Analytics Métier",
        description: "Menu Engineering, rentabilité des plats, productivité horaire et prévisions de ventes.",
        href: "/analytics",
        icon: BarChart3,
        accent: "text-status-success bg-status-success/10",
    },
    {
        title: "Cartographie Système",
        description: "Visualisation interactive de la structure et des modules de l'application.",
        href: "/system-map",
        icon: Map,
        accent: "text-blue-500 bg-status-info/10",
    },
    {
        title: "Registres & Conformité",
        description: "Historique de conformité, registres obligatoires et traçabilité légale.",
        href: "/registre",
        icon: TrendingUp,
        accent: "text-purple-500 bg-purple-500/10",
    },
];

function IntelligenceHubPage() {
    return (
        <PageShell
            kicker="Analyses"
            title="Analyses & Pilotage"
            subtitle="Point d'entrée vers les outils d'analyse, de prévision et de pilotage de votre établissement."
            icon={Sparkles}
            breadcrumbs={[{ label: "Opérations" }, { label: "Analyses" }]}
        >
            <section className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl">
                {CARDS.map((card, i) => {
                    const Icon = card.icon;
                    return (
                        <motion.div
                            key={card.href}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25, delay: i * 0.05 }}
                        >
                            <Link
                                href={card.href}
                                className="group block rounded-2xl border border-border bg-surface-card hover:border-accent-gold/60 hover:shadow-lg transition-all duration-300 p-6"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center", card.accent)}>
                                        <Icon className="w-5 h-5" strokeWidth={2} />
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-accent-gold group-hover:translate-x-1 transition-all" />
                                </div>
                                <h2 className="text-base font-serif font-black italic text-text-primary mt-4">
                                    {card.title}
                                </h2>
                                <p className="text-xs text-text-muted mt-2 leading-relaxed">
                                    {card.description}
                                </p>
                            </Link>
                        </motion.div>
                    );
                })}
            </section>
        </PageShell>
    );
}

export default withPageGuard(IntelligenceHubPage, "intelligence");

