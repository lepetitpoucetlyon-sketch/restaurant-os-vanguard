
"use client";

import { motion } from "framer-motion";
import { TrendingUp, Package, AlertTriangle, Calculator, ChefHat } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/ui.foundations";;
import { cinematicContainer, fadeInUp, cinematicItem } from "@/lib/motion";

interface MarginsTabProps {
    recipes: import('@nexus/contracts').Recipe[];
}

export function MarginsTab({ recipes }: MarginsTabProps) {
    return (
        <motion.div
            variants={cinematicContainer}
            initial="hidden"
            animate="visible"
            className="w-full max-w-full"
        >
            <motion.div variants={fadeInUp} className="flex items-center justify-between mb-12">
                <div>
                    <h2 className="text-4xl font-serif font-black text-text-primary tracking-tight">Analyse des Marges</h2>
                    <p className="text-text-muted text-[13px] mt-3 font-medium uppercase tracking-widest">Rentabilité détaillée par plat et optimisation du coût matière</p>
                </div>
            </motion.div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {[
                    {
                        id: 'avg-margin',
                        label: 'Marge Moyenne',
                        value: '72%',
                        sub: '+3.2% VS MOIS DERNIER',
                        icon: TrendingUp,
                        color: 'text-accent-gold',
                        bg: 'bg-accent-gold/10',
                        isPositive: true
                    },
                    {
                        id: 'material-cost',
                        label: 'Coût Matière Total',
                        value: '28.4%',
                        sub: 'OBJECTIF : <30%',
                        icon: Package,
                        color: 'text-text-primary',
                        bg: 'bg-text-primary/5',
                        isPositive: true
                    },
                    {
                        id: 'profit-risk',
                        label: 'Risque Profit',
                        value: '3 PLATS',
                        sub: 'MARGE CRITIQUE <50%',
                        icon: AlertTriangle,
                        color: 'text-error',
                        bg: 'bg-error/10',
                        isPositive: false
                    },
                    {
                        id: 'active-recipes',
                        label: 'Recettes Actives',
                        value: recipes.length.toString(),
                        sub: 'FICHES VALIDÉES',
                        icon: Calculator,
                        color: 'text-text-primary',
                        bg: 'bg-text-primary/5',
                        isPositive: true
                    }
                ].map((kpi) => (
                    <motion.div
                        key={kpi.id}
                        variants={cinematicItem}
                        whileHover={{ y: -8 }}
                        className="bg-bg-secondary rounded-[2rem] p-8 border border-border shadow-[0_10px_30px_rgba(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] dark:shadow-none transition-all duration-500 relative overflow-hidden group"
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300",
                                kpi.bg
                            )}>
                                <kpi.icon strokeWidth={1.5} className={cn("w-6 h-6", kpi.color)} />
                            </div>
                            <span className="text-[10px] font-black uppercase text-text-muted tracking-[0.2em] leading-tight max-w-[100px]">{kpi.label}</span>
                        </div>
                        <div className="text-5xl font-serif font-black text-text-primary tracking-tighter mb-4">{kpi.value}</div>
                        <p className={cn(
                            "text-[10px] font-black uppercase tracking-widest",
                            kpi.isPositive ? "text-accent-gold" : "text-error"
                        )}>
                            {kpi.sub}
                        </p>

                        {/* Decorative subtle background icon */}
                        <kpi.icon className="absolute -bottom-4 -right-4 w-32 h-32 opacity-[0.03] text-text-primary transform -rotate-12 pointer-events-none" />
                    </motion.div>
                ))}
            </div>

            {/* Recipes Margin Table */}
            <motion.div variants={fadeInUp} className="bg-bg-secondary rounded-[2.5rem] border border-border shadow-[0_10px_40px_rgba(0,0,0,0.03)] overflow-hidden">
                <div className="p-10 border-b border-border/50 flex items-center justify-between">
                    <h3 className="text-2xl font-serif font-black text-text-primary tracking-tight">Performance par Recette</h3>
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">TRIER PAR :</span>
                        <button className="text-[10px] font-black text-text-primary uppercase tracking-[0.2em] border-b-2 border-text-primary pb-1">MARGE DÉCROISSANTE</button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-bg-tertiary/30 text-[10px] font-black text-text-muted uppercase tracking-[0.3em] border-b border-border/30">
                                <th className="text-left px-10 py-8">DÉSIGNATION DU PLAT</th>
                                <th className="text-center px-6 py-8">PRIX VENTE</th>
                                <th className="text-center px-6 py-8">COÛT MAT.</th>
                                <th className="text-center px-6 py-8">MARGE TOTALE</th>
                                <th className="text-center px-6 py-8">% MARGE</th>
                                <th className="text-right px-10 py-8">ÉVALUATION</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {recipes.map((recipe, idx) => {
                                const sellPriceInCents = recipe.priceInCents || 0;
                                const costPriceInCents = recipe.costPriceInCents || 0;
                                const marginInCents = sellPriceInCents - costPriceInCents;
                                const marginPercent = sellPriceInCents > 0 ? (marginInCents / sellPriceInCents) * 100 : 0;
                                const status = marginPercent >= 70 ? 'excellent' : marginPercent >= 50 ? 'good' : 'warning';

                                return (
                                    <motion.tr
                                        key={recipe.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="group hover:bg-bg-tertiary/20 transition-all duration-300"
                                    >
                                        <td className="px-10 py-6">
                                            <div className="flex items-center gap-6">
                                                <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm relative shrink-0">
                                                    {recipe.image ? (
                                                        <img src={recipe.image} className="w-full h-full object-cover" alt="" />
                                                    ) : (
                                                        <div className="w-full h-full bg-bg-tertiary flex items-center justify-center">
                                                            <ChefHat className="w-5 h-5 opacity-20" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-serif font-black text-lg text-text-primary group-hover:text-accent transition-colors tracking-tight">{recipe.name}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: recipe.color }}></span>
                                                        <p className="text-[9px] text-text-muted uppercase tracking-[0.2em] font-bold">{recipe.prepTime} MIN PREP</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <div className="font-mono font-bold text-[14px] text-text-primary bg-bg-tertiary/40 py-2 px-4 rounded-lg inline-block">
                                                {formatCurrency(sellPriceInCents)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <div className="font-mono font-bold text-[13px] text-text-muted">
                                                {formatCurrency(costPriceInCents)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <div className="font-mono font-bold text-[14px] text-text-primary">
                                                {formatCurrency(marginInCents)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex items-center justify-center gap-3">
                                                <div className="w-24 h-1.5 rounded-full bg-bg-tertiary overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${marginPercent}%` }}
                                                        transition={{ duration: 1, ease: "easeOut" }}
                                                        className={cn("h-full rounded-full",
                                                            status === 'excellent' ? 'bg-accent-gold' : status === 'good' ? 'bg-warning' : 'bg-error'
                                                        )}
                                                    />
                                                </div>
                                                <span className={cn(
                                                    "font-mono font-black text-[12px]",
                                                    status === 'excellent' ? 'text-accent-gold' : status === 'good' ? 'text-warning' : 'text-error'
                                                )}>
                                                    {marginPercent.toFixed(0)}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6 text-right">
                                            <span className={cn(
                                                "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] shadow-sm inline-block min-w-[120px] text-center",
                                                status === 'excellent' ? 'bg-accent-gold/10 text-accent-gold border border-accent-gold/20' :
                                                    status === 'good' ? 'bg-warning/10 text-warning border border-warning/20' :
                                                        'bg-error/10 text-error border border-error/20'
                                            )}>
                                                {status === 'excellent' ? 'EXCELLENT' : status === 'good' ? 'CORRECT' : 'CRITIQUE'}
                                            </span>
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </motion.div>
    );
}
