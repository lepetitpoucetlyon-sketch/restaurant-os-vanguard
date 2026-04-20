// @ts-nocheck
"use client";

import { useMemo, useState } from "react";
import {
    TrendingUp,
    Target,
    Users,
    ArrowUpRight,
    ArrowDownRight,
    Zap,
    PieChart,
    HelpCircle,
    ShoppingBag,
    Star,
    AlertCircle,
    Info,
    LayoutGrid,
    Search,
    ChevronDown,
    Filter,
    Flame
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import { cn } from "@/lib/ui.foundations";;
import { useManagement, useOrders } from "@/engines/ops/NexusOpsProvider";
import { PageHeaderWithDocs } from "@/components/ui/PageHeaderWithDocs";

const CATEGORY_TAGS = {
    star: { label: 'Star', color: 'bg-success/10 text-success border-success/30', desc: 'Populaire & Rentable' },
    plowhorse: { label: 'Plowhorse', color: 'bg-accent/10 text-accent border-accent/30', desc: 'Populaire mais peu rentable' },
    puzzle: { label: 'Puzzle', color: 'bg-warning/10 text-warning border-warning/30', desc: 'Rentable mais peu populaire' },
    dog: { label: 'Dog', color: 'bg-error/10 text-error border-error/30', desc: 'Faible vente & Faible marge' },
};

export default function AnalyticsPage() {
    const management = useManagement();
    const { data: orders, totalRevenue } = useOrders();
    const [searchTerm, setSearchTerm] = useState("");

    const menuAnalysis = management.analysis.data;
    const staffPerformance = management.staffPerformance.data;
    const laborCostRatio = management.laborCostRatio;

    const filteredMenu = menuAnalysis.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Stats
    const totalMargin = useMemo(() =>
        menuAnalysis.reduce((sum, item) => sum + (item.profitability * item.popularity), 0),
        [menuAnalysis]);

    const globalFoodCost = totalRevenue > 0 ? ((totalRevenue - totalMargin) / totalRevenue) * 100 : 0;

    return (
        <div className="flex h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] -m-4 md:-m-8 flex-col bg-bg-primary overflow-hidden animate-in fade-in duration-700">
            <div className="flex-1 overflow-auto p-4 md:p-8 space-y-6 md:space-y-10 elegant-scrollbar pb-24 md:pb-12">
                {/* Executive Header */}
                <div className="flex items-center justify-between mb-8">
                    <PageHeaderWithDocs
                        categoryId="dashboard"
                        title="Analyses & Performance"
                        className="text-2xl font-serif font-black text-text-primary italic"
                    />
                </div>


                {/* Top KPIs Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <div className="bg-bg-secondary p-8 rounded-xl border border-border shadow-sm hover:shadow-xl transition-all duration-500 group">
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 rounded-lg bg-success-soft flex items-center justify-center border border-success/10 group-hover:bg-success group-hover:text-white transition-colors">
                                <TrendingUp strokeWidth={1.5} className="w-6 h-6 text-success group-hover:text-white transition-colors" />
                            </div>
                            <span className="text-[10px] font-bold bg-success-soft text-success px-2.5 py-1 rounded-full border border-success/10">+12.4%</span>
                        </div>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Marge Brute Totale</p>
                        <h3 className="text-3xl font-mono font-medium text-text-primary mt-3">{formatCurrency(totalMargin)}</h3>
                    </div>

                    <div className="bg-bg-secondary p-8 rounded-xl border border-border shadow-sm hover:shadow-xl transition-all duration-500 group">
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 rounded-lg bg-error-soft flex items-center justify-center border border-error/10 group-hover:bg-error group-hover:text-white transition-colors">
                                <ShoppingBag strokeWidth={1.5} className="w-6 h-6 text-error group-hover:text-white transition-colors" />
                            </div>
                            <span className="text-[10px] font-bold bg-error-soft text-error px-2.5 py-1 rounded-full border border-error/10">+2.1%</span>
                        </div>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Food Cost Global</p>
                        <h3 className="text-3xl font-mono font-medium text-text-primary mt-3">{formatPercent(globalFoodCost)}</h3>
                    </div>

                    <div className="bg-bg-secondary p-8 rounded-xl border border-border shadow-sm hover:shadow-xl transition-all duration-500 group">
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 rounded-lg bg-accent/5 flex items-center justify-center border border-accent/10 group-hover:bg-accent group-hover:text-white transition-colors">
                                <Users strokeWidth={1.5} className="w-6 h-6 text-accent group-hover:text-white transition-colors" />
                            </div>
                            <span className="text-[10px] font-bold bg-success-soft text-success px-2.5 py-1 rounded-full border border-success/10">-5.0%</span>
                        </div>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Labor Cost (RH)</p>
                        <h3 className="text-3xl font-mono font-medium text-text-primary mt-3">{formatPercent(laborCostRatio * 100)}</h3>
                    </div>

                    <div className="bg-bg-secondary p-8 rounded-xl border border-border shadow-sm hover:shadow-xl transition-all duration-500 group">
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-12 h-12 rounded-lg bg-accent/5 flex items-center justify-center border border-accent/10 group-hover:bg-accent group-hover:text-white transition-colors">
                                <Target strokeWidth={1.5} className="w-6 h-6 text-accent group-hover:text-white transition-colors" />
                            </div>
                            <span className="text-[10px] font-bold bg-accent/10 text-accent px-2.5 py-1 rounded-full border border-accent/10">Obj. 85%</span>
                        </div>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">Score Efficience</p>
                        <h3 className="text-3xl font-mono font-medium text-text-primary mt-3">92.4%</h3>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                    {/* Menu Engineering Analysis */}
                    <div className="xl:col-span-2 space-y-8">
                        <div className="bg-bg-secondary p-10 rounded-xl border border-border shadow-sm">
                            <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
                                <div className="flex items-center gap-4">
                                    <h3 className="text-2xl font-serif font-semibold text-text-primary tracking-tight">Analyse de Performance Menu</h3>
                                    <HelpCircle strokeWidth={1.5} className="w-4 h-4 text-text-muted cursor-help" />
                                </div>
                                <div className="flex gap-3">
                                    <div className="relative">
                                        <Search strokeWidth={1.5} className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                                        <input
                                            type="text"
                                            placeholder="Filtrer plat..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="input-elegant h-11 pl-11 pr-4 text-[13px] w-56"
                                        />
                                    </div>
                                    <Button size="sm" variant="outline" className="rounded-lg font-bold h-11 px-5 text-[11px] uppercase tracking-widest text-text-muted hover:text-text-primary">
                                        <Filter strokeWidth={1.5} className="w-4 h-4 mr-2.5" /> Catégorie
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {/* Table Headers - Desktop */}
                                <div className="hidden md:grid grid-cols-12 gap-6 px-8 py-5 text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] border-b border-border/50 mb-4 bg-bg-tertiary/20 rounded-t-lg">
                                    <div className="col-span-4">Article</div>
                                    <div className="col-span-2 text-center">Ventes</div>
                                    <div className="col-span-2 text-center">Marge Unit.</div>
                                    <div className="col-span-2 text-center">Marge Tot.</div>
                                    <div className="col-span-2 text-right">Statut</div>
                                </div>

                                {/* Mobile Column Headers (Subtle) */}
                                <div className="md:hidden flex items-center justify-between px-6 py-2 text-[9px] font-black text-neutral-300 uppercase tracking-widest mb-2">
                                    <div className="w-16 text-center">ARTICLE</div>
                                    <div className="flex-1 text-right pr-4">VENTES</div>
                                    <div className="w-20 text-right">MARGE</div>
                                </div>

                                {/* Menu Items List */}
                                <div className="space-y-4 md:space-y-3">
                                    {filteredMenu.map((item, i) => {
                                        const tag = CATEGORY_TAGS[item.category];
                                        return (
                                            <div key={item.productId}>
                                                {/* Desktop Row */}
                                                <div className="hidden md:grid grid-cols-12 gap-6 p-6 rounded-xl bg-bg-secondary hover:bg-bg-tertiary border border-border/40 hover:border-accent/40 hover:shadow-xl transition-all duration-500 items-center group">
                                                    <div className="col-span-4 flex items-center gap-5">
                                                        <div className="w-10 h-10 rounded-lg bg-bg-tertiary flex items-center justify-center font-mono font-medium text-text-primary group-hover:bg-accent group-hover:text-white transition-all shadow-sm">
                                                            {String(i + 1).padStart(2, '0')}
                                                        </div>
                                                        <span className="font-serif font-semibold text-text-primary group-hover:text-accent transition-colors">{item.name}</span>
                                                    </div>
                                                    <div className="col-span-2 text-center font-mono text-[13px] font-medium text-text-primary">{item.popularity}</div>
                                                    <div className="col-span-2 text-center font-mono text-[13px] font-medium text-success">{formatCurrency(item.profitability)}</div>
                                                    <div className="col-span-2 text-center font-mono text-[13px] font-medium text-text-primary">
                                                        {formatCurrency(item.profitability * item.popularity)}
                                                    </div>
                                                    <div className="col-span-2 flex justify-end">
                                                        <div className={cn("px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-[0.15em] border", tag.color)}>
                                                            {tag.label}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Mobile Card Design (Screenshot Match) */}
                                                <div className="md:hidden bg-white dark:bg-bg-secondary p-6 rounded-[2rem] border border-border/50 shadow-sm flex items-center justify-between relative overflow-hidden">
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-12 h-16 rounded-[1.5rem] bg-neutral-100 dark:bg-black/20 flex flex-col items-center justify-center font-mono font-bold text-lg text-neutral-400">
                                                            <span>0</span>
                                                            <span>{i + 1}</span>
                                                        </div>
                                                        <div className="flex flex-col gap-1">
                                                            <h4 className="font-serif font-medium text-xl text-text-primary leading-tight max-w-[140px]">
                                                                {item.name.split(' ').map((word, idx) => (
                                                                    <span key={idx} className="block">{word}</span>
                                                                ))}
                                                            </h4>
                                                            <span className="text-[14px] font-medium text-neutral-400 mt-1">{item.popularity} ventes</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col items-end gap-1">
                                                        <div className="px-4 py-2 bg-[#F3EFE0] dark:bg-accent/10 rounded-full border border-[#DED6B6] dark:border-accent/20">
                                                            <span className="font-mono font-bold text-[#8C7B5D] dark:text-accent text-[13px]">{formatCurrency(item.profitability)} €</span>
                                                        </div>
                                                        <span className="text-[10px] font-bold text-neutral-300 uppercase tracking-wider">Marge Unit.</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Performance & Action Board */}
                    <div className="space-y-10">
                        {/* Recommendations Card */}
                        <div className="bg-bg-tertiary dark:bg-bg-secondary p-10 rounded-xl text-text-primary shadow-2xl relative overflow-hidden border border-border">
                            <Flame strokeWidth={1} className="absolute -right-8 -top-8 w-40 h-40 text-text-muted/10 rotate-12" />
                            <h3 className="text-xl font-serif font-semibold mb-8 flex items-center gap-4 relative z-10">
                                <AlertCircle strokeWidth={1.5} className="text-warning w-5 h-5" /> Actions Stratégiques
                            </h3>
                            <div className="space-y-5 relative z-10">
                                <div className="p-6 bg-bg-secondary dark:bg-bg-tertiary border border-border rounded-xl hover:bg-bg-tertiary/50 transition-colors cursor-pointer group">
                                    <p className="text-text-primary font-serif font-semibold text-base group-hover:text-accent transition-colors">Révision Tarifaire: Burrata</p>
                                    <p className="text-text-muted text-[12px] mt-2 font-medium leading-relaxed">
                                        Catégorie "Plowhorse". Coût matière +15%. Ajustement suggéré: +1.50€ pour préserver la marge brute.
                                    </p>
                                </div>
                                <div className="p-6 bg-bg-secondary dark:bg-bg-tertiary border border-border rounded-xl hover:bg-bg-tertiary/50 transition-colors cursor-pointer group">
                                    <p className="text-text-primary font-serif font-semibold text-base group-hover:text-accent transition-colors">Promotion Menu: Tiramisu</p>
                                    <p className="text-text-muted text-[12px] mt-2 font-medium leading-relaxed">
                                        Catégorie "Puzzle". Rentabilité élevée mais rotation faible. À intégrer en suggestion du jour.
                                    </p>
                                </div>
                            </div>
                            <Button className="btn-elegant-primary w-full mt-10 h-14 text-[11px] shadow-xl shadow-accent/20">
                                Appliquer les Mesures
                            </Button>
                        </div>

                        {/* Staff Performance Leaderboard */}
                        <div className="bg-bg-secondary p-10 rounded-xl border border-border shadow-sm">
                            <h3 className="text-xl font-serif font-semibold text-text-primary mb-8 flex items-center gap-4">
                                <Star strokeWidth={1.5} className="text-warning w-5 h-5 fill-warning/20" /> Excellence du Service
                            </h3>
                            <div className="space-y-8">
                                {staffPerformance.map(staff => (
                                    <div key={staff.userId} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-5">
                                            <div className="w-14 h-14 rounded-xl bg-bg-tertiary border border-border flex items-center justify-center font-serif text-lg font-semibold text-text-primary group-hover:bg-accent group-hover:text-white transition-all duration-300">
                                                {(staff.userName || '').charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-serif font-semibold text-text-primary text-base group-hover:text-accent transition-colors">{staff.userName}</p>
                                                <p className="text-[10px] text-text-muted font-bold uppercase tracking-[0.2em] mt-1">Ventes: <span className="text-text-primary font-mono">{formatCurrency(staff.totalSales)}</span></p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[9px] font-bold text-success uppercase tracking-[0.2em]">Cross-Sell</div>
                                            <div className="text-xl font-mono font-medium text-text-primary mt-1">{staff.upsellRate.toFixed(1)}%</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
