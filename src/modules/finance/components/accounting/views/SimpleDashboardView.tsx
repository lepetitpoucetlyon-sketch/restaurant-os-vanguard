"use client";

// @wip owner:finance-team échéance:2026-Q4 — composant orphelin à intégrer ou supprimer (audit orphelins 2026-08-30)
import React, { useMemo } from 'react';
import { 
    Sun, 
    CloudRain, 
    TrendingUp, 
    TrendingDown, 
    Wallet, 
    PieChart, 
    ArrowRight,
    ArrowUpRight,
    Utensils,
    Users,
    Activity
} from 'lucide-react';
import { useAccounting } from '../../../hooks/useAccounting';
import { cn } from '@/lib/ui.foundations';
import { formatMu } from '../../financeUtils';

const fmu = (mu?: number | null, fallbackCents = 0) =>
    formatMu(mu ?? fallbackCents * 10_000);
import { motion } from 'framer-motion';

export function SimpleDashboardView() {
    const { metrics, generatePandL, bankTransactions } = useAccounting();
    const pnl = useMemo(() => generatePandL('current'), [generatePandL]);

    const netProfitMu = metrics.netProfitInMicrounits ?? metrics.netProfitInCents * 10_000;
    const totalRevenueMu = pnl.totalRevenueInMicrounits ?? pnl.totalRevenueInCents * 10_000;
    const healthStatus = netProfitMu >= 0 ? 'sunny' : 'rainy';
    const profitMargin = totalRevenueMu > 0 ? (netProfitMu / totalRevenueMu) * 100 : 0;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* 1. Météo Financière (Hero Section) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={cn(
                        "relative card-premium p-10 overflow-hidden flex flex-col justify-between h-[300px]",
                        healthStatus === 'sunny' ? "bg-accent/5 border-accent/20" : "bg-error/5 border-error/20"
                    )}
                >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-accent/20 via-transparent to-transparent opacity-50" />
                    
                    <div>
                        <div className="flex items-center gap-4 mb-4">
                            {healthStatus === 'sunny' ? (
                                <div className="w-12 h-12 bg-accent/20 rounded-2xl flex items-center justify-center text-accent animate-pulse">
                                    <Sun className="w-6 h-6" />
                                </div>
                            ) : (
                                <div className="w-12 h-12 bg-error/20 rounded-2xl flex items-center justify-center text-error animate-bounce">
                                    <CloudRain className="w-6 h-6" />
                                </div>
                            )}
                            <p className="text-nano font-black uppercase tracking-[0.4em] text-text-muted">Météo de mon Busines</p>
                        </div>
                        <h2 className="text-5xl font-serif font-black italic">
                            {healthStatus === 'sunny' ? "Grand Soleil" : "Averse passagère"}
                        </h2>
                        <p className="text-text-muted mt-2 text-sm max-w-xs">
                            Votre résultat net est de <span className={cn("font-bold", healthStatus === 'sunny' ? "text-accent" : "text-error")}>{fmu(metrics.netProfitInMicrounits, metrics.netProfitInCents)}</span>.
                            C'est un mois {healthStatus === 'sunny' ? "positif" : "difficile"}.
                        </p>
                    </div>

                    <div className="flex items-center gap-6 mt-6">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-status-success" />
                            <span className="text-xl font-bold">{fmu(pnl.totalRevenueInMicrounits, pnl.totalRevenueInCents)}</span>
                        </div>
                        <div className="w-px h-6 bg-border" />
                        <div className="flex items-center gap-2">
                            <TrendingDown className="w-4 h-4 text-error" />
                            <span className="text-xl font-bold">{fmu(pnl.totalExpensesInMicrounits, pnl.totalExpensesInCents)}</span>
                        </div>
                    </div>
                </motion.div>

                {/* 2. Jauge de Marge */}
                <div className="card-premium p-10 bg-bg-secondary flex flex-col justify-between h-[300px]">
                    <div>
                        <p className="text-nano font-black uppercase tracking-[0.4em] text-text-muted mb-6">Ma Marge Nette</p>
                        <div className="flex items-end gap-4">
                            <span className={cn(
                                "text-7xl font-sans font-black tracking-tighter",
                                profitMargin >= 10 ? "text-status-success" : profitMargin > 0 ? "text-accent" : "text-error"
                            )}>
                                {profitMargin.toFixed(1)}%
                            </span>
                            <span className="text-text-muted font-bold mb-3 uppercase tracking-widest text-nano">Rentabilité</span>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="w-full h-3 bg-bg-tertiary rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(Math.max(profitMargin, 0), 100)}%` }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className={cn(
                                    "h-full rounded-full",
                                    profitMargin >= 10 ? "bg-status-success" : "bg-accent"
                                )}
                            />
                        </div>
                        <div className="flex justify-between text-nano font-black uppercase tracking-widest text-text-muted">
                            <span>Marge Critique (0%)</span>
                            <span>Moyenne Resto (12%)</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Les Chiffres "Vrais" */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-bg-secondary rounded-[2.5rem] p-8 border border-border shadow-sm">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-status-info/10 rounded-2xl text-blue-500">
                            <Wallet className="w-5 h-5" />
                        </div>
                        <h4 className="text-xs font-black tracking-widest uppercase">Trésorerie Banq</h4>
                    </div>
                    <p className="text-3xl font-black font-mono">
                        {fmu(null, bankTransactions.reduce((s, t) => s + (t.amountInCents || 0), 0))}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-nano text-status-success font-bold uppercase">
                        <Activity className="w-3 h-3" /> Connecté en direct
                    </div>
                </div>

                <div className="bg-bg-secondary rounded-[2.5rem] p-8 border border-border shadow-sm">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-status-success/10 rounded-2xl text-status-success">
                            <Utensils className="w-5 h-5" />
                        </div>
                        <h4 className="text-xs font-black tracking-widest uppercase">Ratio Food Cost</h4>
                    </div>
                    <p className="text-3xl font-black font-mono">29.4%</p>
                    <div className="flex items-center gap-2 mt-2 text-nano text-accent font-bold uppercase transition-all hover:translate-x-1 cursor-pointer">
                        Voir le détail <ArrowUpRight className="w-3 h-3" />
                    </div>
                </div>

                <div className="bg-bg-secondary rounded-[2.5rem] p-8 border border-border shadow-sm">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-500">
                            <Users className="w-5 h-5" />
                        </div>
                        <h4 className="text-xs font-black tracking-widest uppercase">Productivité Staff</h4>
                    </div>
                    <p className="text-3xl font-black font-mono">31% CA</p>
                    <div className="flex items-center gap-2 mt-2 text-nano text-text-muted font-bold uppercase">
                        Ratio Masse Salariale
                    </div>
                </div>
            </div>

            {/* 4. Flux Simplifié (Revolut Style) */}
            <div className="bg-bg-secondary rounded-[3rem] p-10 border border-border shadow-xl">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-xl font-bold">Mes derniers flux</h3>
                        <p className="text-text-muted text-xs uppercase tracking-widest font-bold mt-1">Dépenses & Recettes récentes</p>
                    </div>
                    <button className="px-6 py-2 bg-bg-tertiary rounded-full text-chip-label hover:bg-border transition-all flex items-center gap-2">
                        TOUT VOIR <ArrowRight className="w-4 h-4" />
                    </button>
                </div>

                <div className="space-y-4">
                    {pnl.expenses.slice(0, 5).map((exp, idx) => (
                        <div key={idx} className="flex items-center justify-between p-6 bg-bg-primary/50 border border-border/50 rounded-3xl group hover:border-error/20 transition-all cursor-pointer">
                            <div className="flex items-center gap-6">
                                <div className="w-12 h-12 bg-error/10 rounded-2xl flex items-center justify-center text-error group-hover:scale-110 transition-transform">
                                    <PieChart className="w-5 h-5" />
                                </div>
                                <div>
                                    <h5 className="font-bold text-sm tracking-tight">{exp.accountName}</h5>
                                    <p className="text-nano text-text-muted font-black uppercase tracking-widest mt-1">Catégorie: Dépense Opérationnelle</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-mono font-black text-error">-{fmu(exp.amountInMicrounits, exp.amountInCents)}</p>
                                <p className="text-nano text-text-muted font-bold">Aujourd'hui, 14:32</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
