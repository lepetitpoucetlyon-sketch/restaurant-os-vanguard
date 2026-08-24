"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Map, BarChart3, MessageSquare, TrendingUp, ArrowRight } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { withPageGuard } from "@/shared/components/rbac/PageGuard";
import { PageShell } from "@/shared/components/ui/PageShell";

/**
 * Hub /intelligence — passerelle vers les surfaces d'analyse et d'IA du produit.
 *
 * Cette route existe parce que MobileNavBar la référence : sans page, le lien renvoyait
 * une 404 (constat pendant l'audit Vanguard). Le hub évite le lien mort et rassemble
 * en un seul endroit les entrées IA : agent conversationnel, cartographie 3D du système,
 * analytics métier et rapports d'usage.
 */

interface HubCard {
    title: string;
    description: string;
    href: string;
    icon: typeof Sparkles;
    accent: string; // classe Tailwind pour le badge
}

const CARDS: HubCard[] = [
    {
        title: "Intelligence Exécutive",
        description: "Agent conversationnel IA — analyse, décisions, exports. Piloté par Hermes/LightRAG.",
        href: "/admin/agent",
        icon: MessageSquare,
        accent: "text-accent-gold bg-accent-gold/10",
    },
    {
        title: "Analytics métier",
        description: "Menu Engineering, rentabilité, réputation, conformité. Vue multi-tabs par pilier.",
        href: "/analytics",
        icon: BarChart3,
        accent: "text-status-success bg-status-success/10",
    },
    {
        title: "Cartographie 3D",
        description: "System Map — vue mentale 3D du système Restaurant OS et des dépendances Nexus.",
        href: "/system-map",
        icon: Map,
        accent: "text-blue-500 bg-status-info/10",
    },
    {
        title: "Registre & Prévisionnel",
        description: "Prévisions d'affluence, historique conformité, journal AI-assisté.",
        href: "/registre",
        icon: TrendingUp,
        accent: "text-purple-500 bg-purple-500/10",
    },
];

function IntelligenceHubPage() {
    return (
        <PageShell
            kicker="Intelligence"
            title="Intelligence IA"
            subtitle="Point d'entrée unique vers les surfaces d'analyse et d'automatisation du système. Ouvrez un module pour l'utiliser en pleine surface."
            icon={Sparkles}
            breadcrumbs={[{ label: "Opérations" }, { label: "Intelligence" }]}
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
