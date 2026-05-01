"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CategoryList } from "@modules/ops";
import { ProductGrid } from "@modules/ops";
import { Cart } from "@modules/ops";
import { TableSelector } from "@modules/ops";
import { PaymentDialog } from "@modules/ops";
import { SplitBillDialog } from "@modules/ops";
import { useKitchen } from "@/engines/ops/NexusOpsProvider";
import { useTables } from "@/engines/ops/NexusOpsProvider";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@ui/Toast";
import { LucideIcon, ShoppingCart, Plus, ArrowLeft, MoreHorizontal, LayoutGrid, Star, Pizza, UtensilsCrossed, GlassWater, Beef, Coffee, Zap } from "lucide-react";
import { useIsMobile } from "@/hooks";
import { fabVariants, mobileSpring } from "@/lib/motion";
import { BottomSheet } from "@ui/BottomSheet";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/lib/ui.foundations";
import { PageHeaderWithDocs } from "@ui/PageHeaderWithDocs";
import { usePOSController } from "@modules/ops";
import { AmbianceService, RestaurantAmbiance } from "@domain/services/AmbianceService";
import { formatCurrency } from "@/lib/formatters";

const ICON_MAP: Record<string, LucideIcon> = {
    all: Star,
    pizzas: Pizza,
    pastas: UtensilsCrossed,
    boissons: GlassWater,
    entrees: UtensilsCrossed,
    plats: Beef,
    desserts: Coffee
};

export default function POSPage() {
    const { t } = useLanguage();
    const isMobile = useIsMobile();
    const { orders } = useKitchen();
    const [ambiance, setAmbiance] = useState<RestaurantAmbiance>(AmbianceService.getCurrentAmbiance());
    const [tokens, setTokens] = useState(AmbianceService.getThemeTokens());

    useEffect(() => {
        const handleAmbianceChange = () => {
            const newAmbiance = AmbianceService.getCurrentAmbiance();
            setAmbiance(newAmbiance);
            setTokens(AmbianceService.getThemeTokens());
        };
        
        window.addEventListener('ambiance-changed', handleAmbianceChange);
        return () => window.removeEventListener('ambiance-changed', handleAmbianceChange);
    }, []);

    const {
        selectedTableId, setSelectedTableId,
        selectedCategory, setSelectedCategory,
        categories, products, isLoading,
        isMobileCartOpen, setIsMobileCartOpen,
        isPaymentOpen, setIsPaymentOpen,
        isSplitOpen, setIsSplitOpen,
        cartItems,
        currentTable, cartTotal, cartCount,
        handleAddToCart, handleUpdateQuantity, handleClearCart,
        handleSendToKitchen, handlePaymentComplete,
        handleCheckout, handlePaySplit
    } = (usePOSController() as any);

    const isRushMode = ambiance === 'RUSH_SPEED';

    if (!selectedTableId) {
        return (
            <motion.div 
                initial={{ opacity: 0, scale: 0.98 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.4 * tokens.animationMultiplier, ease: [0.16, 1, 0.3, 1] }}
                className={cn("h-full overflow-hidden transition-colors duration-700", isRushMode ? "bg-black" : "bg-bg-primary")}
            >
                <TableSelector onSelectTable={setSelectedTableId} />
            </motion.div>
        );
    }

    return (
        <div className={cn(
            "flex flex-1 flex-col h-[calc(100vh-80px)] lg:h-[calc(100vh-100px)] -m-4 lg:-m-8 overflow-hidden relative pb-24 lg:pb-0 transition-colors duration-1000",
            isRushMode ? "bg-black" : "bg-bg-primary"
        )}>
            {/* Header & Categories Swiper */}
            <div className={cn(
                "px-ui py-ui border-b border-border/50 sticky top-0 z-40 transition-all",
                isRushMode ? "bg-black/90" : "bg-white/80 dark:bg-bg-primary/80",
                tokens.blur
            )}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSelectedTableId(null)} className="text-text-muted">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <PageHeaderWithDocs
                            categoryId="pos"
                            title={`Table ${currentTable?.number || ''}`}
                            className="text-2xl font-serif font-black italic text-text-primary tracking-tight"
                        >
                            <span className="text-accent-gold ml-1">.</span>
                        </PageHeaderWithDocs>
                        {isRushMode && (
                            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                                <Zap className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                                <span className="text-[9px] font-black uppercase text-emerald-400 tracking-widest">Rush Active</span>
                            </div>
                        )}
                    </div>
                    <button className="w-10 h-10 rounded-full bg-bg-tertiary flex items-center justify-center text-text-muted">
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                </div>

                {/* Horizontal Category Swiper */}
                <div className={cn("flex gap-2 overflow-x-auto no-scrollbar py-1", isRushMode && "grayscale-[0.3]")}>
                    <button
                        onClick={() => setSelectedCategory("all")}
                        className={cn(
                            "flex items-center gap-2 h-10 px-5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                            selectedCategory === "all" ? "bg-accent-gold text-white shadow-lg scale-105" : "bg-bg-tertiary text-text-muted"
                        )}
                    >
                        <Star className="w-3.5 h-3.5" />
                        Favoris
                    </button>
                    {categories.map((cat: any) => {
                        const Icon = ICON_MAP[cat.id] || UtensilsCrossed;
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={cn(
                                    "flex items-center gap-2 h-10 px-5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                                    selectedCategory === cat.id ? "bg-accent-gold text-white shadow-lg scale-105" : "bg-bg-tertiary text-text-muted"
                                )}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {cat.name}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Main Content Area - ProductGrid + Cart side by side on desktop */}
            <div className="flex-1 flex flex-row overflow-hidden">
                {/* Product Grid */}
                <div className={cn(
                    "flex-1 overflow-auto p-ui lg:p-ui elegant-scrollbar transition-all",
                    isRushMode ? "bg-black" : "bg-bg-primary/50"
                )}>
                    <ProductGrid 
                        categoryFilter={selectedCategory} 
                        onAddToCart={handleAddToCart} 
                        products={products}
                        isLoading={isLoading}
                    />
                </div>

                {/* Cart Sheet (Mobile) / Desktop Sidebar */}
                {!isMobile && (
                    <div className={cn(
                        "h-full hidden xl:block w-[400px] shrink-0 border-l border-border/30 transition-all",
                        isRushMode ? "bg-[#0f172a]" : "bg-white"
                    )}>
                        <Cart
                            items={cartItems}
                            onUpdateQuantity={handleUpdateQuantity}
                            onClearCart={handleClearCart}
                            onCheckout={handleCheckout}
                            onSendToKitchen={handleSendToKitchen}
                            onSplitBill={() => setIsSplitOpen(true)}
                            tableNumber={currentTable?.number}
                            guestCount={currentTable?.seats}
                        />
                    </div>
                )}
            </div>

            {/* Mobile Cart Tray (Dock UX) - Only show on mobile */}
            <AnimatePresence>
                {cartItems.length > 0 && !isMobileCartOpen && isMobile && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        className="fixed bottom-28 left-6 right-6 z-50 pointer-events-none"
                    >
                        <button
                            onClick={() => setIsMobileCartOpen(true)}
                            className={cn(
                                "pointer-events-auto w-full h-16 rounded-[2rem] px-8 flex items-center justify-between shadow-2xl border transition-all relative overflow-hidden group",
                                isRushMode ? "bg-emerald-600 border-emerald-400" : "bg-text-primary dark:bg-accent-gold border-white/10"
                            )}
                        >
                            <div className="absolute inset-0 bg-white/5 opacity-0 group-active:opacity-100 transition-opacity" />
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center font-black text-xs text-white">
                                    {cartCount}
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Ouvrir le Panier</span>
                            </div>
                            <div className="flex items-center gap-4 relative z-10">
                                <span className="text-xl font-mono font-bold italic text-white">{formatCurrency(cartTotal)}</span>
                                <Plus className="w-6 h-6 rotate-45 opacity-40 text-white" />
                            </div>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <BottomSheet
                isOpen={isMobileCartOpen}
                onClose={() => setIsMobileCartOpen(false)}
                title={`Panier Table ${currentTable?.number}`}
                size="full"
            >
                <div className="h-full flex flex-col -mt-4">
                    <Cart
                        items={cartItems}
                        onUpdateQuantity={handleUpdateQuantity}
                        onClearCart={handleClearCart}
                        onCheckout={() => { setIsMobileCartOpen(false); handleCheckout(); }}
                        onSendToKitchen={() => { setIsMobileCartOpen(false); handleSendToKitchen(); }}
                        onSplitBill={() => { setIsMobileCartOpen(false); setIsSplitOpen(true); }}
                        tableNumber={currentTable?.number}
                        guestCount={currentTable?.seats}
                        showClose={false}
                    />
                </div>
            </BottomSheet>

            <PaymentDialog
                isOpen={isPaymentOpen}
                total={cartTotal}
                onClose={() => setIsPaymentOpen(false)}
                onPaymentComplete={handlePaymentComplete}
            />

            <SplitBillDialog
                isOpen={isSplitOpen}
                items={cartItems}
                total={cartTotal}
                coverCount={currentTable?.seats || 1}
                onClose={() => setIsSplitOpen(false)}
                onPaySplit={(amountInCents, guestIndex) => handlePaySplit(amountInCents, guestIndex)}
            />
        </div>
    );
}
