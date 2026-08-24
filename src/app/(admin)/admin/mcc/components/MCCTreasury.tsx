"use client";

import React, { useMemo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Wallet,
    TrendingUp,
    Cpu,
    Package,
    Sparkles,
    ShoppingBag,
    RefreshCw,
} from 'lucide-react';
import { useFleet } from '@/shared/contexts/FleetContext';
import { TreasuryEngine } from '@/modules/finance';
import { authedFetch } from '@/lib/client/authedFetch';
import type { FleetTreasuryReport } from '@/modules/finance';

export function MCCTreasury() {
    const { instances } = useFleet();

    const theoreticalReport = useMemo(() => TreasuryEngine.generateFleetReport(instances), [instances]);

    const [stripeReport, setStripeReport] = useState<FleetTreasuryReport | null>(null);
    const [isLoadingStripe, setIsLoadingStripe] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setIsLoadingStripe(true);
        authedFetch('/api/admin/fleet/billing/treasury-report')
            .then(r => r.ok ? r.json() as Promise<FleetTreasuryReport> : Promise.reject(r.status))
            .then(data => { if (!cancelled) setStripeReport(data); })
            .catch(() => { /* fallback théorique */ })
            .finally(() => { if (!cancelled) setIsLoadingStripe(false); });
        return () => { cancelled = true; };
    }, []);

    // Tout ce qui est monétaire vient UNIQUEMENT de Stripe.
    // Si pas de clé Stripe → on affiche 0, jamais une estimation.
    const hasStripe = stripeReport?.source === 'stripe';
    const mrr = hasStripe ? (stripeReport?.mrr ?? 0) : 0;
    const collectedMtd = hasStripe ? (stripeReport?.collectedMtd ?? 0) : 0;
    const netMargin = hasStripe ? mrr - (theoreticalReport.totalAICosts) : 0;
    const churn = hasStripe ? (stripeReport?.churnLast30Days ?? 0) : 0;
    const activeSubscriptions = hasStripe ? (stripeReport?.activeSubscriptions ?? 0) : 0;
    const dataSource = stripeReport?.source ?? 'theoretical';

    const operationalHealth = useMemo(() => {
        if (!instances.length) return 0;
        const avg = instances.reduce((sum, inst) => sum + (inst.metrics?.healthScore ?? 100), 0) / instances.length;
        return Math.round(avg);
    }, [instances]);

    const PROCUREMENT_ROWS = useMemo(() => [
        { category: 'Licences POS NF525', volume: instances.length, unit: 'sites', discount: 0, status: 'ACTIVE' as const },
        { category: 'Papier thermique 80mm', volume: instances.length * 12, unit: 'rouleaux/mois', discount: 0, status: 'NEGOTIATED' as const },
        { category: 'Maintenance terminaux', volume: instances.length, unit: 'contrats', discount: 0, status: 'COMPLETED' as const },
    ], [instances.length]);

    return (
        <div className="space-y-8 pb-12">
            {/* Source badge */}
            <div className="flex items-center gap-2">
                {isLoadingStripe ? (
                    <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-text-muted">
                        <RefreshCw className="w-3 h-3 animate-spin" /> Chargement Stripe…
                    </span>
                ) : (
                    <span className={`text-chip-label-sm px-2 py-0.5 rounded border ${dataSource === 'stripe' ? 'text-status-success border-emerald-500/30 bg-status-success/10' : 'text-text-muted border-border-subtle bg-surface-card'}`}>
                        {dataSource === 'stripe' ? '● Données Stripe réelles' : '○ Estimation théorique — STRIPE_SECRET_KEY absent'}
                    </span>
                )}
            </div>

            {/* Main Financial Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

                {/* MRR Stripe réel */}
                <FinancialCard
                    label="MRR Abonnements"
                    value={isLoadingStripe ? '…' : `€${Math.round(mrr).toLocaleString()}`}
                    trend={dataSource === 'stripe' ? `${activeSubscriptions} abonnement${activeSubscriptions > 1 ? 's' : ''} actif${activeSubscriptions > 1 ? 's' : ''}` : 'Estimation par tier'}
                    icon={<Wallet className="text-status-success" />}
                    chartColor="rgba(16, 185, 129, 0.2)"
                />

                {/* CA encaissé mois en cours */}
                <FinancialCard
                    label="CA encaissé (mois)"
                    value={isLoadingStripe ? '…' : `€${Math.round(collectedMtd).toLocaleString()}`}
                    trend={dataSource === 'stripe' ? 'Invoices Stripe payées MTD' : 'Non disponible sans Stripe'}
                    icon={<TrendingUp className="text-status-success" />}
                    chartColor="rgba(16, 185, 129, 0.15)"
                />

                {/* AI Consumption Cost */}
                <FinancialCard
                    label="AI Infrastructure Overhead"
                    value={`€${Math.round(theoreticalReport.totalAICosts).toLocaleString()}`}
                    trend="0.002€ par token estimé"
                    icon={<Cpu className="text-brand" />}
                    chartColor="rgba(99, 102, 241, 0.2)"
                />

                {/* Churn */}
                <FinancialCard
                    label="Churn (30 jours)"
                    value={isLoadingStripe ? '…' : `${churn}`}
                    trend={dataSource === 'stripe' ? 'Résiliations Stripe' : 'Non disponible sans Stripe'}
                    icon={<Sparkles className="text-status-warning" />}
                    chartColor="rgba(245, 158, 11, 0.2)"
                />
            </div>

            <div className="grid grid-cols-12 gap-8">
                {/* Marketplace Collective Intelligence */}
                <div className="col-span-12 lg:col-span-7 bg-surface-card border border-border-subtle rounded-3xl p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-action-primary/5 blur-[80px] -mr-32 -mt-32" />
                    
                    <div className="flex justify-between items-center mb-8 relative z-10">
                        <div>
                            <h3 className="text-lg font-bold tracking-tight uppercase">Achats Groupés Flotte</h3>
                            <p className="text-xs text-secondary font-medium tracking-widest mt-1">Statut des négociations groupées industrielles</p>
                            <p className="text-[9px] text-status-warning font-bold uppercase tracking-widest mt-0.5">Estimations contractuelles — négociations en cours</p>
                        </div>
                        <div className="p-3 bg-surface-card rounded-2xl">
                            <ShoppingBag className="w-5 h-5 text-brand" />
                        </div>
                    </div>

                    <div className="space-y-1 relative z-10">
                        <div className="grid grid-cols-12 text-[8px] font-black text-secondary uppercase tracking-widest pb-2 border-b border-border-subtle px-2">
                            <span className="col-span-5">Catégorie</span>
                            <span className="col-span-3">Économies</span>
                            <span className="col-span-4 text-right">Statut</span>
                        </div>
                        {PROCUREMENT_ROWS.map(row => (
                            <ProcurementRow key={row.category} {...row} />
                        ))}
                    </div>

                    <div className="mt-6 p-4 bg-surface-card border border-border-subtle rounded-2xl flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-action-primary/10 flex items-center justify-center">
                                <TrendingUp className="w-4 h-4 text-brand" />
                            </div>
                            <div>
                                <span className="text-chip-label text-text-primary">Master Supply Portal</span>
                                <p className="text-[9px] text-secondary mt-0.5">{instances.length} site{instances.length > 1 ? 's' : ''} · Coalition active</p>
                            </div>
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-status-success border border-emerald-500/30 bg-status-success/10 px-2 py-0.5 rounded-full">Actif</span>
                    </div>
                </div>

                {/* Net Margin / Health */}
                <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
                    <div className="flex-1 bg-surface-card border border-border-subtle rounded-3xl p-8 relative overflow-hidden">
                        <h3 className="text-xs font-black text-secondary uppercase tracking-[0.3em] mb-6">Net Empire Margin</h3>
                        <div className="text-5xl font-black mb-4 tracking-tighter">
                            {hasStripe ? `€${Math.round(netMargin).toLocaleString()}` : '—'}
                        </div>
                        <p className="text-[11px] text-secondary leading-relaxed font-medium">
                            {hasStripe
                                ? <>MRR encaissé − coûts IA. {mrr > 0 && <> Marge : <span className="text-status-success font-bold">{((netMargin / mrr) * 100).toFixed(1)}%</span>.</>}</>
                                : 'Disponible dès le premier encaissement Stripe.'
                            }
                        </p>
                        
                        <div className="mt-8 pt-8 border-t border-border-subtle space-y-4">
                             <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-secondary">
                                 <span>Santé Opérationnelle</span>
                                 <span className="text-text-primary">OPTIMAL</span>
                             </div>
                             <div className="w-full h-1 bg-surface-card rounded-full overflow-hidden">
                                 <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${operationalHealth}%` }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    className="h-full bg-action-primary"
                                />
                             </div>
                        </div>
                    </div>

                    <div className="bg-surface-card border border-border-subtle rounded-3xl p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-action-primary/10 flex items-center justify-center">
                                <Package className="w-5 h-5 text-brand" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold uppercase tracking-tight">Inter-Site Logistics</h4>
                                <p className="text-[10px] text-secondary font-medium uppercase tracking-tighter">{instances.length} nœuds déclarés</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-sm font-black text-text-primary">€{Math.round(theoreticalReport.collectiveSavings * 0.15).toLocaleString()}</div>
                            <div className="text-[9px] text-secondary uppercase tracking-widest">économies logistique</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface FinancialCardProps {
    label: string;
    value: string;
    trend: string;
    icon: React.ReactNode;
    chartColor: string;
    isSpecial?: boolean;
}

function FinancialCard({ label, value, trend, icon, chartColor, isSpecial = false }: FinancialCardProps) {
    return (
        <motion.div 
            whileHover={{ y: -4 }}
            className={`p-8 rounded-3xl border border-border-subtle bg-surface-card relative overflow-hidden group transition-all ${isSpecial ? 'ring-1 ring-focus/20' : ''}`}
        >
            <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-surface-card rounded-2xl group-hover:bg-surface-card transition-all">
                    {icon}
                </div>
                {isSpecial && <div className="px-2 py-1 rounded bg-action-primary/10 border border-focus/20 text-[8px] font-black text-brand uppercase tracking-widest">Premium Power</div>}
            </div>
            
            <h3 className="text-secondary text-chip-label mb-2">{label}</h3>
            <div className="text-3xl font-black mb-2 tracking-tighter">{value}</div>
            <p className="text-[10px] font-medium text-secondary uppercase tracking-tighter">{trend}</p>

            {/* Faux Sparkline Decoration */}
            <div className="absolute bottom-0 left-0 right-0 h-12 opacity-20 group-hover:opacity-40 transition-all" style={{ backgroundColor: chartColor, maskImage: 'linear-gradient(to top, black, transparent)' }} />
        </motion.div>
    );
}

interface ProcurementRowProps {
    category: string;
    volume: number;
    unit: string;
    discount: number;
    status: 'NEGOTIATED' | 'ACTIVE' | 'COMPLETED';
}

function ProcurementRow({ category, volume, unit, discount, status }: ProcurementRowProps) {
    return (
        <div className="grid grid-cols-12 items-center py-4 border-b border-border-subtle last:border-0 hover:bg-surface-card transition-all rounded-lg px-2">
            <div className="col-span-5">
                <span className="text-xs font-bold text-muted group-hover:text-brand transition-colors uppercase">{category}</span>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] font-bold text-secondary uppercase">{volume.toLocaleString()} {unit}</span>
                </div>
            </div>
            <div className="col-span-3">
                <div className="text-[10px] font-black text-status-success uppercase">-{discount}%</div>
                <span className="text-[8px] font-bold text-secondary uppercase tracking-widest">Max Savings</span>
            </div>
            <div className="col-span-4 text-right">
                <span className={`text-[8px] font-black px-2 py-0.5 rounded border uppercase tracking-widest ${status === 'NEGOTIATED' ? 'bg-action-primary/10 border-focus/30 text-brand' : 'bg-surface-card border-subtle text-secondary'}`}>
                    {status}
                </span>
            </div>
        </div>
    );
}
