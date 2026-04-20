// @ts-nocheck
"use client";

import { useState, useMemo, useEffect } from "react";
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    ArrowUpRight,
    ArrowDownRight,
    PiggyBank,
    CreditCard,
    Receipt,
    Clock,
    RefreshCw,
    Download,
    Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/ui.foundations";;
import { useFinance } from "@/engines/fiscal/NexusFiscalProvider";
import { motion } from "framer-motion";
import { useIntelligence } from "@/context/IntelligenceContext";
import { Zap } from "lucide-react";

export default function FinancePage() {
    const { treasury, alerts, bankTransactions } = useFinance();
    const { globalInflationRate } = useIntelligence();

    // Adjusted Forecast based on inflation
    const adjustedForecast = useMemo(() => {
        const base = treasury.forecast30Days;
        if (globalInflationRate === 0) return base;
        // Inflation impacts outflows (estimated at 10% of total volume for 30 days)
        const inflationLoss = (treasury.pendingPayables || 5000) * (globalInflationRate / 100);
        return base - inflationLoss;
    }, [treasury.forecast30Days, treasury.pendingPayables, globalInflationRate]);

    // Dispatch AI Context
    useEffect(() => {
        const stats = {
            cashOnHand: treasury.cashOnHand,
            bankBalance: treasury.bankBalance,
            pendingReceivables: treasury.pendingReceivables,
            pendingPayables: treasury.pendingPayables,
            forecast30Days: adjustedForecast,
            globalInflation: globalInflationRate,
            inflationImpactOnForecast: treasury.forecast30Days - adjustedForecast
        };
        window.dispatchEvent(new CustomEvent('ai:context_update', { detail: stats }));
    }, [treasury, adjustedForecast, globalInflationRate]);

    // Mini chart data for sparkline
    const chartData = treasury.cashFlowTrend.slice(-14);
    const maxValue = Math.max(...chartData.map(d => Math.max(d.inflow, d.outflow)), 1);

    return (
        <div className="flex h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] -m-4 md:-m-8 flex-col bg-bg-primary overflow-hidden pb-20 md:pb-0">


            {/* Content */}
            <div className="flex-1 overflow-auto p-10 elegant-scrollbar space-y-8">
                {/* KPIs Row */}
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-serif font-black text-text-primary italic">Trésorerie & Finance</h1>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        {
                            title: "Trésorerie Disponible",
                            value: formatCurrency(treasury.cashOnHand),
                            change: treasury.cashOnHand >= 0,
                            icon: Wallet,
                            color: treasury.cashOnHand >= 0 ? "text-success" : "text-error"
                        },
                        {
                            title: "Solde Bancaire",
                            value: formatCurrency(treasury.bankBalance),
                            change: true,
                            icon: CreditCard,
                            color: "text-indigo-600"
                        },
                        {
                            title: "Créances en Attente",
                            value: formatCurrency(treasury.pendingReceivables),
                            change: true,
                            icon: ArrowUpRight,
                            color: "text-success"
                        },
                        {
                            title: "Dettes Fournisseurs",
                            value: formatCurrency(treasury.pendingPayables),
                            change: false,
                            icon: ArrowDownRight,
                            color: "text-error"
                        },
                    ].map((kpi, i) => (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            key={kpi.title}
                            className="card-premium p-8"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className={cn("p-3 rounded-xl", kpi.change ? "bg-success/10" : "bg-error/10")}>
                                    <kpi.icon className={cn("w-5 h-5", kpi.color)} />
                                </div>
                            </div>
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-1">{kpi.title}</p>
                            <h3 className={cn("text-2xl font-black tracking-tight", kpi.color)}>{kpi.value}</h3>
                        </motion.div>
                    ))}
                </div>

                {/* Alerts Section */}
                {alerts.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-lg font-serif font-black text-text-primary italic">Alertes Financières</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {alerts.map(alert => (
                                <div
                                    key={alert.id}
                                    className={cn(
                                        "p-6 rounded-2xl border flex gap-4",
                                        alert.type === 'critical' && "bg-error/5 border-error/20",
                                        alert.type === 'warning' && "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30",
                                        alert.type === 'info' && "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30"
                                    )}
                                >
                                    <AlertTriangle className={cn(
                                        "w-5 h-5 shrink-0",
                                        alert.type === 'critical' && "text-error",
                                        alert.type === 'warning' && "text-amber-600",
                                        alert.type === 'info' && "text-indigo-600"
                                    )} />
                                    <div>
                                        <h4 className="text-sm font-bold text-text-primary">{alert.title}</h4>
                                        <p className="text-xs text-text-muted mt-1">{alert.message}</p>
                                        {alert.amount && (
                                            <p className="text-sm font-black mt-2 text-text-primary">{formatCurrency(alert.amount)}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Cash Flow Chart & Forecast */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Chart */}
                    <div className="lg:col-span-2 card-premium p-8">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-lg font-serif font-black text-text-primary italic">Flux de Trésorerie</h3>
                                <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mt-1">14 derniers jours</p>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-success" />
                                    <span className="text-[10px] font-bold text-text-muted uppercase">Entrées</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-error" />
                                    <span className="text-[10px] font-bold text-text-muted uppercase">Sorties</span>
                                </div>
                            </div>
                        </div>

                        {/* Simple Bar Chart */}
                        <div className="h-48 flex items-end gap-2">
                            {chartData.map((day, i) => (
                                <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                                    <div className="w-full flex gap-0.5 h-40 items-end">
                                        <div
                                            className="flex-1 bg-success/80 rounded-t-md transition-all hover:bg-success"
                                            style={{ height: `${(day.inflow / maxValue) * 100}%` }}
                                        />
                                        <div
                                            className="flex-1 bg-error/80 rounded-t-md transition-all hover:bg-error"
                                            style={{ height: `${(day.outflow / maxValue) * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-[8px] font-bold text-text-muted">
                                        {new Date(day.date).getDate()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Forecast Card */}
                    <div className="card-premium p-8 bg-text-primary text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-accent opacity-10 -mr-16 -mt-16 rounded-full blur-2xl" />

                        <div className="relative z-10 space-y-8">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <PiggyBank className="w-5 h-5 text-accent" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Prévision à 30 Jours</span>
                                </div>
                                <p className={cn(
                                    "text-4xl font-black tracking-tight",
                                    adjustedForecast >= 0 ? "text-success" : "text-error"
                                )}>
                                    {formatCurrency(adjustedForecast)}
                                </p>
                            </div>

                            {globalInflationRate > 0 && (
                                <motion.div 
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="p-4 bg-error/20 border border-error/30 rounded-2xl"
                                >
                                    <div className="flex justify-between items-center mb-1">
                                         <span className="text-[8px] font-black uppercase tracking-widest text-neutral-400">Impact Inflation 30j</span>
                                         <Zap className="w-3 h-3 text-error" fill="currentColor" />
                                    </div>
                                    <p className="text-sm font-black text-error">-{formatCurrency(treasury.forecast30Days - adjustedForecast)}</p>
                                </motion.div>
                            )}

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-neutral-400">Position Nette</span>
                                    <span className="text-sm font-bold">{formatCurrency(treasury.netCashPosition)}</span>
                                </div>
                                <div className="h-px bg-white/10" />
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-neutral-400">Créances vs Dettes</span>
                                    <span className={cn(
                                        "text-sm font-bold",
                                        treasury.pendingReceivables > treasury.pendingPayables ? "text-success" : "text-error"
                                    )}>
                                        {formatCurrency(treasury.pendingReceivables - treasury.pendingPayables)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Bank Transactions */}
                <div className="card-premium p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-serif font-black text-text-primary italic">Mouvements Bancaires</h3>
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mt-1">Dernières opérations</p>
                        </div>
                        <Button variant="outline" className="h-10 px-6 rounded-xl font-bold text-[11px] uppercase tracking-widest">
                            <Plus className="w-4 h-4 mr-2" />
                            Ajouter
                        </Button>
                    </div>

                    <div className="space-y-3">
                        {bankTransactions.length === 0 ? (
                            <div className="py-12 text-center text-text-muted italic">
                                Aucun mouvement bancaire enregistré
                            </div>
                        ) : (
                            bankTransactions.slice(0, 10).map(tx => (
                                <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl hover:bg-bg-tertiary/30 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center",
                                            tx.type === 'credit' ? "bg-success/10 text-success" : "bg-error/10 text-error"
                                        )}>
                                            {tx.type === 'credit' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-text-primary">{tx.label}</p>
                                            <p className="text-[10px] text-text-muted">{new Date(tx.date).toLocaleDateString('fr-FR')}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={cn(
                                            "text-lg font-black",
                                            tx.type === 'credit' ? "text-success" : "text-error"
                                        )}>
                                            {tx.type === 'credit' ? '+' : '-'}{formatCurrency(tx.amountInCents / 100)}
                                        </span>
                                        {tx.isReconciled ? (
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-success bg-success/10 px-2 py-1 rounded-full">Rapproché</span>
                                        ) : (
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-amber-600 bg-amber-500/10 px-2 py-1 rounded-full">En attente</span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
