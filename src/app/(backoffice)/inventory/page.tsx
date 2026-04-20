"use client";

import { useState, useMemo, useEffect } from "react";
import { TrendingUp, TrendingDown, Package, ShieldCheck, Truck, CheckCircle2, Clock, ChefHat, ArrowDownLeft, AlertTriangle, Search, Filter, Plus, FileDown, MoreVertical, SearchIcon, ChevronRight, User, Layers, BookOpen, PackageCheck, XCircle, RefreshCw, Trash2, MapPin, Thermometer, Calendar, ArrowRight, Apple, Milk, Flame, Bird, Fish, Beef, Sandwich, Box, Droplets, Droplet, Coffee, Wine, GlassWater, Snowflake } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";;
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/ui.foundations";;
import { useInventory } from "@/engines/ops/NexusOpsProvider";
import { ExpertHub } from "@/components/agency/ExpertHub";
import { SupplierOrder, SupplierOrderStatus } from "@/types";
import { useToast } from "@/components/ui/Toast";
import { useUI } from "@/context/UIContext";
import { StockReceptionModal, CreatePreparationModal, StockTransferModal } from "@/components/inventory";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { fadeInUp, easing } from "@/lib/motion";
import { useLanguage } from "@/context/LanguageContext";
import { useIsMobile } from "@/hooks";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { PageHeaderWithDocs } from "@/components/ui/PageHeaderWithDocs";
import { useIntelligence } from "@/context/IntelligenceContext";
import { InventoryService } from "@/lib/inventory-service";
import { Zap, Sparkles, ScanText } from "lucide-react";
import { VisionScanner } from "@/components/shared/VisionScanner";
import { InvoiceReviewModal } from "@/components/inventory/InvoiceReviewModal";

const CATEGORY_LABELS: Record<string, string> = {
    produce: 'Fruits & Légumes',
    dairy: 'Produits Laitiers',
    meat: 'Viandes',
    poultry: 'Volailles',
    seafood: 'Poissons',
    charcuterie: 'Charcuterie',
    bakery: 'Boulangerie',
    dry: 'Épicerie',
    condiment: 'Condiments',
    spice: 'Épices',
    oil: 'Huiles',
    beverage: 'Boissons',
    wine: 'Vins',
    spirits: 'Spiritueux',
    frozen: 'Surgelés',
    other: 'Autre'
};

const CATEGORY_ICONS: Record<string, any> = {
    produce: Apple,
    dairy: Milk,
    meat: Flame,
    poultry: Bird,
    seafood: Fish,
    charcuterie: Beef,
    bakery: Sandwich,
    dry: Box,
    condiment: Droplets,
    spice: Sparkles,
    oil: Droplet,
    beverage: Coffee,
    wine: Wine,
    spirits: GlassWater,
    frozen: Snowflake,
    other: Layers
};

import { OraclePredictor } from "@/components/intelligence/OraclePredictor";
import { OraclePrediction } from "@/domain/services/OracleEngine";

export default function InventoryPage() {
    const isMobile = useIsMobile();
    const { t } = useLanguage();
    const {
        ingredients,
        stockItems,
        preparations,
        lowStockItems,
        supplierOrders,
        receiveOrder,
        cancelOrder,
        storageLocations
    } = useInventory();
    
    // 🔮 ORACLE GRADE VII SENTINEL (Mock Data for Demonstration)
    const criticalPrediction: OraclePrediction | null = useMemo(() => {
        if (lowStockItems.length === 0) return null;
        return {
            estimatedDaysRemaining: 2,
            confidence: 0.89,
            trend: 'ACCELERATING',
            scenarios: {
                optimistic: 5,
                pessimistic: 1,
                p50: 2
            },
            riskLevel: 'HIGH'
        };
    }, [lowStockItems]);

    const { showToast } = useToast();
    const { globalInflationRate } = useIntelligence();

    const stockValuation = useMemo(() => InventoryService.calculateStockValuation(stockItems), [stockItems]);
    const inflationImpact = useMemo(() => InventoryService.getReplacementCostImpact(stockValuation, (globalInflationRate as number) || 0), [stockValuation, globalInflationRate]);

    // Dispatch AI Context
    useEffect(() => {
        const stats = {
            totalItems: stockItems.length,
            valuation: stockValuation,
            lowStock: lowStockItems.length,
            inflationImpact: inflationImpact,
            globalInflation: globalInflationRate
        };
        window.dispatchEvent(new CustomEvent('ai:context_update', { detail: stats }));
    }, [stockItems, stockValuation, lowStockItems, inflationImpact, globalInflationRate]);

    const [activeTab, setActiveTab] = useState<'stock' | 'preparations' | 'orders'>('stock');
    const [isReceptionModalOpen, setIsReceptionModalOpen] = useState(false);
    const [isPreparationModalOpen, setIsPreparationModalOpen] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState<string | null>(null);
    const [isVisionScannerOpen, setIsVisionScannerOpen] = useState(false);
    const [visionData, setVisionData] = useState<any>(null);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

    // Filter stock items
    const filteredStockItems = useMemo(() => {
        let items = (stockItems as any).filter((s: any) => s.status !== 'expired' && s.quantity > 0);
        if (searchQuery) items = items.filter(s => s.ingredientName.toLowerCase().includes(searchQuery.toLowerCase()));
        if (filterCategory) items = items.filter(s => s.category === filterCategory);
        return items.sort((a, b) => new Date(a.dlc).getTime() - new Date(b.dlc).getTime());
    }, [stockItems, searchQuery, filterCategory]);

    // Filter preparations
    const filteredPreparations = useMemo(() => {
        let preps = (preparations as any).filter((p: any) => p.status !== 'discarded' && p.status !== 'expired');
        if (searchQuery) preps = preps.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
        return preps.sort((a, b) => new Date(a.dlc).getTime() - new Date(b.dlc).getTime());
    }, [preparations, searchQuery]);

    const categories = [...new Set(stockItems.map(s => s.category))];

    const getDlcColor = (dlc: string) => {
        const diff = new Date(dlc).getTime() - new Date().getTime();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        if (days <= 0) return "text-error";
        if (days <= 2) return "text-warning";
        return "text-success";
    };

    return (
        <div className="flex flex-1 flex-col bg-bg-primary h-[calc(100vh-80px)] lg:h-[calc(100vh-100px)] -m-4 lg:-m-8 overflow-hidden relative pb-24 lg:pb-0">
            {/* Header & Search */}
            <div className="bg-white/80 dark:bg-bg-primary/80 backdrop-blur-xl px-6 py-6 border-b border-border/50 sticky top-0 z-40">
                <div className="flex items-center justify-between mb-6">
                    <PageHeaderWithDocs
                        categoryId="inventory"
                        title={t('inventory.tabs.archive')}
                        className="text-4xl font-serif font-black italic text-text-primary tracking-tight"
                    />
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setIsVisionScannerOpen(!isVisionScannerOpen)} 
                            className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg",
                                isVisionScannerOpen ? "bg-amber-500 text-black rotate-45" : "bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white"
                            )}
                        >
                            <ScanText className="w-5 h-5" />
                        </button>
                        <button onClick={() => setIsTransferModalOpen(true)} className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                            <RefreshCw className="w-5 h-5" />
                        </button>
                        <button onClick={() => setIsReceptionModalOpen(true)} className="w-12 h-12 rounded-full bg-text-primary text-white flex items-center justify-center shadow-xl">
                            <Plus className="w-6 h-6" />
                        </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isVisionScannerOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                            animate={{ height: 'auto', opacity: 1, marginBottom: 24 }}
                            exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                            className="overflow-hidden"
                        >
                            <VisionScanner 
                                label="Scanner une Facture Fournisseur"
                                onAnalysisComplete={(data) => {
                                    setVisionData(data);
                                    setIsReviewModalOpen(true);
                                    setIsVisionScannerOpen(false);
                                }} 
                            />
                        </motion.div>
                    )}
                  </AnimatePresence>

                <div className="relative mb-6">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/30" />
                    <input
                        type="text"
                        placeholder={t('inventory.search.archive')}
                        className="w-full h-14 pl-14 pr-6 bg-bg-tertiary/50 rounded-2xl border-none text-[10px] font-black uppercase tracking-widest outline-none"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Oracle Risk Sentinel (Grade VII) */}
                <AnimatePresence>
                    {criticalPrediction && activeTab === 'stock' && (
                        <motion.div
                            initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                            animate={{ height: 'auto', opacity: 1, marginBottom: 24 }}
                            exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                            className="px-1"
                        >
                            <OraclePredictor 
                                prediction={criticalPrediction} 
                                itemName={lowStockItems[0]?.ingredientName || "Stock Critique"} 
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Economic Impact Card (Top Level Visibility) */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-6 bg-accent-gold/10 rounded-[2rem] border border-accent-gold/20 backdrop-blur-xl group">
                        <div className="flex justify-between items-center mb-2">
                             <p className="text-[9px] font-black text-accent-gold uppercase tracking-[0.2em]">Valeur Stock (HT)</p>
                             <Sparkles className="w-4 h-4 text-accent-gold opacity-40 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="text-3xl font-serif font-black italic text-text-primary">
                            {formatCurrency(stockValuation)}
                        </div>
                    </div>

                    {((globalInflationRate as number) || 0) > 0 && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-6 bg-error/5 rounded-[2rem] border border-error/20 backdrop-blur-xl"
                        >
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-[9px] font-black text-error uppercase tracking-[0.2em]">Surcoût Réappro (Inflation {globalInflationRate as any}%)</p>
                                <Zap className="w-4 h-4 text-error animate-pulse" />
                            </div>
                            <div className="text-3xl font-serif font-black italic text-error">
                                +{formatCurrency(inflationImpact)}
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Horizontal Navigation Tabs */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                    {[
                        { id: 'stock', label: t('inventory.tabs.archive'), icon: PackageCheck },
                        { id: 'preparations', label: t('inventory.tabs.kitchen'), icon: ChefHat },
                        { id: 'orders', label: t('inventory.tabs.logistics'), icon: Truck }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "flex items-center gap-2 h-11 px-6 rounded-full text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                                activeTab === tab.id ? "bg-accent-gold text-white" : "bg-bg-tertiary text-text-muted"
                            )}
                        >
                            <tab.icon className="w-3.5 h-3.5" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* List Content */}
            <div className="flex-1 overflow-auto p-4 space-y-4 elegant-scrollbar">
                {activeTab === 'stock' && (
                    <div className="space-y-4">
                        {/* Categories Scroll (Sub-categories) */}
                        <div className="flex gap-2 overflow-x-auto no-scrollbar px-1 py-1">
                            <button
                                onClick={() => setFilterCategory(null)}
                                className={cn("px-4 h-9 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all", !filterCategory ? "bg-text-primary text-white border-transparent" : "bg-white dark:bg-bg-secondary border-border text-text-muted")}
                            >
                                Tout
                            </button>
                            {categories.map(cat => {
                                const Icon = CATEGORY_ICONS[cat] || Layers;
                                return (
                                    <button
                                        key={cat}
                                        onClick={() => setFilterCategory(cat)}
                                        className={cn(
                                            "flex items-center gap-2 px-4 h-9 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all whitespace-nowrap",
                                            filterCategory === cat 
                                                ? "bg-text-primary text-white border-transparent shadow-premium" 
                                                : "bg-white dark:bg-bg-secondary border-border text-text-muted hover:border-accent-gold/30"
                                        )}
                                    >
                                        <Icon className="w-3 h-3" />
                                        {CATEGORY_LABELS[cat] || cat}
                                    </button>
                                );
                            })}
                        </div>

                        {filteredStockItems.map((item, idx) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.03 }}
                                className="bg-white dark:bg-bg-secondary p-4 rounded-[2rem] border border-border/50 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-bg-tertiary flex items-center justify-center border border-border">
                                        <Package className="w-6 h-6 text-text-muted/40" strokeWidth={1.5} />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-serif font-black italic text-text-primary tracking-tight leading-none">{item.ingredientName}</h4>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-[8px] font-black text-accent-gold uppercase tracking-widest">{CATEGORY_LABELS[item.category] || item.category}</span>
                                            <div className="w-1 h-1 rounded-full bg-border" />
                                            <span className={cn("text-[8px] font-black uppercase tracking-widest", getDlcColor(item.dlc))}>
                                                DLC {new Date(item.dlc).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right pr-2">
                                    <p className="text-3xl font-serif font-black italic text-text-primary leading-none">{item.quantity}</p>
                                    <p className="text-[9px] font-black text-text-muted uppercase tracking-widest mt-1">{item.unit}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {activeTab === 'preparations' && (
                    <div className="space-y-4">
                        {filteredPreparations.map((prep, idx) => (
                            <motion.div
                                key={prep.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white dark:bg-bg-secondary p-6 rounded-[2.5rem] border border-border/50"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="text-2xl font-serif font-black italic text-text-primary">{prep.name}</h4>
                                        <span className="text-[10px] font-black text-accent-gold uppercase tracking-widest mt-1 block opacity-60">{prep.type}</span>
                                    </div>
                                    <div className="bg-bg-tertiary px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest">
                                        DLC {new Date(prep.dlc).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                    </div>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-5xl font-serif font-black italic text-text-primary">{prep.quantity}</span>
                                    <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.4em] italic opacity-40">{prep.unit}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modals with Mobile Detection for BottomSheet behavior */}
            <StockReceptionModal isOpen={isReceptionModalOpen} onClose={() => setIsReceptionModalOpen(false)} />
            <CreatePreparationModal isOpen={isPreparationModalOpen} onClose={() => setIsPreparationModalOpen(false)} />
            <StockTransferModal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} />

            <AnimatePresence>
                {isReviewModalOpen && visionData && (
                    <InvoiceReviewModal 
                        data={visionData} 
                        onClose={() => setIsReviewModalOpen(false)} 
                        onSaveComplete={() => {
                            setIsReviewModalOpen(false);
                            showToast("Inventaire synchronisé avec succès", "success");
                        }}
                    />
                )}
            </AnimatePresence>

            {/* Diagnostic & Expertise Center */}
            <ExpertHub 
                domain="inventory" 
            />
        </div>
    );
}
