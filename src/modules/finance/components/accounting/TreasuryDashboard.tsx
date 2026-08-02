"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Wallet, CreditCard, ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { SovereignMath } from "@shared/services/SovereignMath";
import { computeTreasury, type TreasuryEntryInput } from '@/modules/finance';

interface TreasuryDashboardProps {
    journalEntries: readonly TreasuryEntryInput[];
}

const fmt = (mu: number) => SovereignMath.format(mu);

/**
 * Dashboard de trésorerie — position de cash réelle depuis les écritures Nexus.
 * KPI (caisse / banque / créances / dettes) + courbe de flux 14 jours + prévision 30j.
 * Toute la logique de calcul vit dans TreasuryCalculator (fonction pure, testée).
 */
export function TreasuryDashboard({ journalEntries }: TreasuryDashboardProps) {
    const t = useMemo(() => computeTreasury(journalEntries), [journalEntries]);

    const kpis = [
        {
            title: "Trésorerie disponible",
            value: fmt(t.cashOnHandInMicrounits),
            positive: t.cashOnHandInMicrounits >= 0,
            icon: Wallet,
        },
        {
            title: "Solde bancaire",
            value: fmt(t.bankBalanceInMicrounits),
            positive: t.bankBalanceInMicrounits >= 0,
            icon: CreditCard,
        },
        {
            title: "Créances en attente",
            value: fmt(t.pendingReceivablesInMicrounits),
            positive: true,
            icon: ArrowUpRight,
        },
        {
            title: "Dettes fournisseurs",
            value: fmt(t.pendingPayablesInMicrounits),
            positive: false,
            icon: ArrowDownRight,
        },
    ];

    // Échelle du graphe : plus grande amplitude absolue sur la fenêtre.
    const maxAbs = Math.max(
        1,
        ...t.cashFlowTrend.map((p) => Math.abs(p.netInMicrounits)),
    );

    return (
        <div className="space-y-8">
            {/* KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((kpi, i) => (
                    <motion.div
                        key={kpi.title}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="bg-surface-card border border-subtle rounded-2xl p-6"
                    >
                        <div
                            className={cn(
                                "inline-flex p-2.5 rounded-xl mb-4",
                                kpi.positive ? "bg-status-success/10" : "bg-status-danger/10",
                            )}
                        >
                            <kpi.icon
                                className={cn(
                                    "w-5 h-5",
                                    kpi.positive ? "text-status-success" : "text-status-danger",
                                )}
                            />
                        </div>
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-1">
                            {kpi.title}
                        </p>
                        <h3
                            className={cn(
                                "text-2xl font-black tracking-tight tabular-nums",
                                kpi.positive ? "text-text-primary" : "text-status-danger",
                            )}
                        >
                            {kpi.value}
                        </h3>
                    </motion.div>
                ))}
            </div>

            {/* Cashflow 14j + prévision 30j */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-surface-card border border-subtle rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-serif font-black text-text-primary italic">
                                Flux de trésorerie
                            </h3>
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mt-1">
                                14 derniers jours
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-text-muted uppercase">
                                <span className="w-2.5 h-2.5 rounded-full bg-status-success" /> Entrées
                            </span>
                            <span className="flex items-center gap-1.5 text-[10px] font-bold text-text-muted uppercase">
                                <span className="w-2.5 h-2.5 rounded-full bg-status-danger" /> Sorties
                            </span>
                        </div>
                    </div>

                    {/* Bar chart CSS pur — pas de dépendance externe. Barre centrée sur zéro. */}
                    <div className="flex items-end justify-between gap-1 h-40">
                        {t.cashFlowTrend.map((point) => {
                            const ratio = point.netInMicrounits / maxAbs; // −1..1
                            const heightPct = Math.abs(ratio) * 50; // moitié de hauteur max
                            const isPositive = point.netInMicrounits >= 0;
                            const day = new Date(point.date).getDate();
                            return (
                                <div
                                    key={point.date}
                                    className="flex-1 flex flex-col items-center justify-center h-full group relative"
                                    title={`${fmt(point.netInMicrounits)} le ${new Date(point.date).toLocaleDateString("fr-FR")}`}
                                >
                                    {/* zone haute (positif) */}
                                    <div className="flex-1 w-full flex items-end justify-center">
                                        {isPositive && (
                                            <div
                                                className="w-full max-w-[14px] rounded-t bg-status-success/70 group-hover:bg-status-success transition-colors"
                                                style={{ height: `${heightPct}%` }}
                                            />
                                        )}
                                    </div>
                                    <div className="w-full h-px bg-border-subtle" />
                                    {/* zone basse (négatif) */}
                                    <div className="flex-1 w-full flex items-start justify-center">
                                        {!isPositive && point.netInMicrounits !== 0 && (
                                            <div
                                                className="w-full max-w-[14px] rounded-b bg-status-danger/70 group-hover:bg-status-danger transition-colors"
                                                style={{ height: `${heightPct}%` }}
                                            />
                                        )}
                                    </div>
                                    <span className="text-[8px] text-text-muted mt-1 tabular-nums">{day}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Prévision 30 jours */}
                <div className="bg-surface-card border border-subtle rounded-2xl p-6 flex flex-col justify-between">
                    <div>
                        <div className="inline-flex p-2.5 rounded-xl mb-4 bg-accent-gold/10">
                            <TrendingUp className="w-5 h-5 text-accent-gold" />
                        </div>
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-1">
                            Prévision 30 jours
                        </p>
                        <h3
                            className={cn(
                                "text-3xl font-black tracking-tight tabular-nums",
                                t.forecast30DaysInMicrounits >= 0 ? "text-text-primary" : "text-status-danger",
                            )}
                        >
                            {fmt(t.forecast30DaysInMicrounits)}
                        </h3>
                    </div>
                    <p className="text-[11px] text-text-muted mt-4 leading-relaxed">
                        Position actuelle {fmt(t.netCashPositionInMicrounits)} projetée au flux
                        journalier moyen des 14 derniers jours.
                    </p>
                </div>
            </div>
        </div>
    );
}
