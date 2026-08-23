"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    LucideIcon, Plus, ArrowLeft, MoreHorizontal, Star, Pizza,
    UtensilsCrossed, GlassWater, Beef, Coffee, Zap,
    Wallet, RotateCcw, Tablet, BookOpen, Printer,
    Store, ShoppingBag, LifeBuoy,
} from "lucide-react";

import dynamic from "next/dynamic";
import { ProductGrid, Cart, TableSelector } from "@/modules/ops";
import { BottomSheet } from "@ui/BottomSheet";
import { useLanguage } from "@/shared/hooks";
import { cn } from "@/lib/ui.foundations";
import { PageHeaderWithDocs } from "@ui/PageHeaderWithDocs";
import { formatCurrency } from "@/lib/formatters";

const PaymentDialog = dynamic(() => import('@/modules/ops/service/pos/components/PaymentDialog').then(m => m.PaymentDialog), { ssr: false });
const SplitBillDialog = dynamic(() => import('@/modules/ops/service/pos/components/SplitBillDialog').then(m => m.SplitBillDialog), { ssr: false });
const CashDrawerModal = dynamic(() => import('@/modules/commerce/ui/pos').then(m => m.CashDrawerModal), { ssr: false });
const PinModal = dynamic(() => import('@/modules/commerce/ui/pos').then(m => m.PinModal), { ssr: false });
const TipPanel = dynamic(() => import('@/modules/commerce/ui/pos').then(m => m.TipPanel), { ssr: false });
const VoidModal = dynamic(() => import('@/modules/commerce/ui/pos').then(m => m.VoidModal), { ssr: false });
const CourseManager = dynamic(() => import('@/modules/commerce/ui/pos').then(m => m.CourseManager), { ssr: false });
const SosCaisseModal = dynamic(() => import('@/modules/commerce/ui/pos').then(m => m.SosCaisseModal), { ssr: false });
import type { CourseType } from "@/modules/ops";
import { SovereignMath } from "@/shared/services/SovereignMath";
import { CartItemContextMenu } from "./_posSlices";
import { usePosPage } from "./_hooks/usePosPage";
import { withPageGuard } from "@/shared/components/rbac/PageGuard";
import { ActionGuard } from "@/shared/components/rbac/ActionGuard";
import { ResponsiveShell } from "@/shared/components/ui/ResponsiveShell";

const ICON_MAP: Record<string, LucideIcon> = {
    all:      Star,
    pizzas:   Pizza,
    pastas:   UtensilsCrossed,
    boissons: GlassWater,
    entrees:  UtensilsCrossed,
    plats:    Beef,
    desserts: Coffee,
};

function POSPage() {
    const { t: _t } = useLanguage();
    const [isSosModalOpen, setIsSosModalOpen] = useState(false);
    const {
        isMobile, activeTenantId, posUser, allTables,
        tokens, isRushMode,
        isTabletMode, setIsTabletMode, isTablePickerOpen, setIsTablePickerOpen,
        selectedTableId, setSelectedTableId,
        selectedCategory, setSelectedCategory,
        categories, products, isLoading,
        isMobileCartOpen, setIsMobileCartOpen,
        isPaymentOpen, setIsPaymentOpen,
        isSplitOpen, setIsSplitOpen,
        cartItems, cartTotal, cartGrandTotal, cartCount, cartTvaInCents,
        currentTable,
        handleAddToCart,
        handleUpdateQuantity, handleClearCart,
        handleSendToKitchen, handlePaymentComplete,
        handlePaySplit, handleSplitComplete,
        handleSetItemCourse, handleSendCourse,
        handleSetItemNote,
        consumptionMode, setConsumptionMode,
        handleToggleDoggyBag, handleSetItemConsumptionMode,
        isCartSidebar,
        outOfStockIds,
        refundPerm, offerPerm, cancelPerm,
        contextMenuItem, setContextMenuItem,
        customDiscountValue, setCustomDiscountValue,
        noteValue, setNoteValue,
        isTipPanelOpen, setIsTipPanelOpen,
        isCashDrawerOpen, setIsCashDrawerOpen,
        isVoidModalOpen, setIsVoidModalOpen,
        isCourseViewOpen, setIsCourseViewOpen,
        pendingAction, pinError, handleProtectedAction, handlePinConfirm, handlePinClose,
        pinModalTitle,
        handlePrintReceipt,
        handleCheckoutWithTip,
        handleTipConfirmed,
        handleTipSkipped,
        handleItemContextMenu,
        handleDiscountPreset,
        handleDiscountCustom,
    } = usePosPage();

    if (!selectedTableId) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.4 * tokens.animationMultiplier, ease: [0.16, 1, 0.3, 1] }}
                className={cn("h-full overflow-hidden transition-colors duration-700", isRushMode ? "bg-surface-sidebar" : "bg-bg-primary")}
            >
                <TableSelector onSelectTable={setSelectedTableId} />
            </motion.div>
        );
    }

    return (
        <div className={cn(
            "flex flex-1 flex-col h-[calc(100vh-80px)] lg:h-[calc(100vh-100px)] -m-4 lg:-m-8 overflow-hidden relative pb-24 lg:pb-0 transition-colors duration-700",
            isRushMode ? "bg-surface-sidebar" : "bg-bg-primary"
        )}>
            {/* Rush ribbon — 2px strip anchored to top instead of grayscale wash */}
            {isRushMode && (
                <div className="h-[2px] w-full bg-gradient-to-r from-red-500/0 via-red-500 to-red-500/0" />
            )}

            {/* Editorial header — table number as a display title, actions grouped by role */}
            <header className={cn(
                "px-ui pt-6 pb-5 border-b border-border/40 sticky top-0 z-40 transition-colors duration-300",
                isRushMode ? "bg-surface-sidebar/95" : "bg-surface-card/70 dark:bg-bg-primary/85",
                tokens.blur
            )}>
                <div className="flex items-center justify-between gap-4 mb-6">
                    {/* Left cluster — back + title + rush pulse */}
                    <div className="flex items-baseline gap-5 min-w-0">
                        <button onClick={() => setSelectedTableId(null)}
                            aria-label="Retour à la sélection des tables"
                            className="shrink-0 w-9 h-9 -mb-1 flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-white/5 rounded-full transition-colors">
                            <ArrowLeft className="w-[18px] h-[18px]" />
                        </button>

                        {isTabletMode ? (
                            <button onClick={() => setIsTablePickerOpen((v) => !v)}
                                className="group flex items-baseline gap-3 pr-1 hover:opacity-90 transition-opacity">
                                <span className="font-serif font-black italic text-[11px] uppercase tracking-[0.32em] text-text-muted/70">Table</span>
                                <span className="font-serif font-black text-[38px] leading-none tracking-[-0.02em] text-accent-gold">
                                    {currentTable?.number || "—"}
                                </span>
                                <MoreHorizontal className="w-4 h-4 text-accent-gold/60 group-hover:text-accent-gold transition-colors -translate-y-0.5" />
                            </button>
                        ) : (
                            <div className="flex items-baseline gap-3 min-w-0">
                                <span className="font-serif font-black italic text-[11px] uppercase tracking-[0.32em] text-text-muted/70">Table</span>
                                <PageHeaderWithDocs
                                    categoryId="pos"
                                    title={`${currentTable?.number || ""}`}
                                    className="font-serif font-black text-[38px] leading-none tracking-[-0.02em] text-text-primary"
                                />
                            </div>
                        )}

                        {isRushMode && (
                            <span className="hidden sm:flex items-center gap-2 self-center pl-1">
                                <span className="relative flex w-2 h-2">
                                    <span className="absolute inset-0 rounded-full bg-red-500/60 animate-ping" />
                                    <span className="relative rounded-full w-2 h-2 bg-red-500" />
                                </span>
                                <span className="font-serif italic text-[11px] tracking-[0.24em] uppercase text-red-500/90">Rush</span>
                            </span>
                        )}

                        {isTabletMode && isTablePickerOpen && (
                            <div className="absolute top-full mt-2 left-4 z-50 bg-surface-card border border-border rounded-2xl shadow-xl p-3 w-64 grid grid-cols-4 gap-1.5">
                                {allTables.map((t) => (
                                    <button key={t.id} onClick={() => { setSelectedTableId(t.id); setIsTablePickerOpen(false); }}
                                        className={cn("h-10 rounded-lg border text-xs font-medium tracking-wide transition-colors", t.id === selectedTableId ? "bg-accent-gold border-accent-gold text-text-primary" : "border-border/60 text-text-muted hover:border-accent-gold/40 hover:text-accent-gold")}>
                                        {t.number ?? t.id.slice(-3)}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right cluster — 3 role-grouped segments with vertical dividers */}
                    <div className="flex items-center gap-3 shrink-0">
                        {/* Group A — consumption mode + course view (customer-facing intent) */}
                        <div className="flex items-center h-10 bg-white/[0.03] border border-border/50 rounded-xl overflow-hidden">
                            <button onClick={() => setConsumptionMode(consumptionMode === 'dine_in' ? 'takeaway' : 'dine_in')}
                                title={consumptionMode === 'dine_in' ? 'Sur place' : 'À emporter'}
                                className={cn(
                                    "h-full flex items-center gap-2 px-3.5 text-[11px] font-medium tracking-wide transition-colors border-r border-border/40",
                                    consumptionMode === 'dine_in' ? "text-text-primary" : "text-text-secondary hover:text-text-primary"
                                )}>
                                {consumptionMode === 'dine_in'
                                    ? <Store className="w-[14px] h-[14px] text-action-primary" />
                                    : <ShoppingBag className="w-[14px] h-[14px] text-action-primary" />}
                                <span>{consumptionMode === 'dine_in' ? 'Sur place' : 'Emporter'}</span>
                            </button>
                            <button onClick={() => setIsCourseViewOpen((v) => !v)} title="Vue par cours"
                                aria-pressed={isCourseViewOpen}
                                className={cn(
                                    "h-full w-10 flex items-center justify-center transition-colors",
                                    isCourseViewOpen ? "text-accent-gold bg-accent-gold/10" : "text-text-secondary hover:text-text-primary"
                                )}>
                                <BookOpen className="w-[15px] h-[15px]" />
                            </button>
                        </div>

                        {/* Group B — ticket utilities (imprimer / tiroir / annuler) */}
                        <div className="flex items-center h-10 bg-white/[0.03] border border-border/50 rounded-xl overflow-hidden">
                            <button onClick={handlePrintReceipt} disabled={cartItems.length === 0} title="Imprimer le ticket"
                                className="h-full w-10 flex items-center justify-center text-text-secondary hover:text-action-primary transition-colors disabled:opacity-25 disabled:cursor-not-allowed border-r border-border/40">
                                <Printer className="w-[15px] h-[15px]" />
                            </button>
                            <ActionGuard page="pos" action="cash_count">
                                <button onClick={() => setIsCashDrawerOpen(true)} title="Fond de caisse"
                                    className="h-full w-10 flex items-center justify-center text-text-secondary hover:text-action-primary transition-colors border-r border-border/40">
                                    <Wallet className="w-[15px] h-[15px]" />
                                </button>
                            </ActionGuard>
                            <ActionGuard page="pos" action="void_line">
                                <button onClick={() => setIsVoidModalOpen(true)} title="Annuler / Rembourser"
                                    className="h-full w-10 flex items-center justify-center text-text-secondary hover:text-red-500 transition-colors">
                                    <RotateCcw className="w-[15px] h-[15px]" />
                                </button>
                            </ActionGuard>
                        </div>

                        {/* Group C — tablet toggle */}
                        <button onClick={() => setIsTabletMode((v) => !v)} title={isTabletMode ? "Quitter le mode tablette" : "Mode tablette"}
                            aria-pressed={isTabletMode}
                            className={cn(
                                "h-10 w-10 flex items-center justify-center rounded-xl border transition-colors",
                                isTabletMode
                                    ? "bg-action-primary text-text-on-primary border-action-primary"
                                    : "bg-white/[0.03] border-border/50 text-text-secondary hover:text-text-primary"
                            )}>
                            <Tablet className="w-[15px] h-[15px]" />
                        </button>

                        {/* SOS — dedicated distress button, single semantic red, no idle pulse */}
                        <button onClick={() => setIsSosModalOpen(true)} title="SOS Caisse & Urgence Service"
                            className="group h-10 pl-3 pr-4 rounded-xl bg-red-500 text-white hover:bg-red-600 active:scale-[0.98] flex items-center gap-2 text-[11px] font-serif italic tracking-[0.2em] uppercase transition-all shadow-[0_4px_20px_-6px_rgba(239,68,68,0.5)]">
                            <LifeBuoy className="w-[14px] h-[14px]" />
                            <span className="hidden sm:inline">SOS</span>
                        </button>
                    </div>
                </div>

                {/* Category rail — segmented navigation with under-line, no pill scaling, no grayscale wash */}
                <nav aria-label="Catégories" className="flex gap-6 overflow-x-auto no-scrollbar -mb-[9px] pb-[7px]">
                    <button onClick={() => setSelectedCategory("all")}
                        aria-current={selectedCategory === "all" ? "page" : undefined}
                        className={cn(
                            "group relative shrink-0 flex items-center gap-2 pb-2 text-xs font-medium tracking-wide transition-colors whitespace-nowrap",
                            selectedCategory === "all"
                                ? "text-accent-gold"
                                : "text-text-muted hover:text-text-primary"
                        )}>
                        <Star className={cn("w-[15px] h-[15px] transition-transform", selectedCategory === "all" && "fill-accent-gold/20")} />
                        <span>Favoris</span>
                        {selectedCategory === "all" && (
                            <span className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-accent-gold rounded-full" />
                        )}
                    </button>
                    {categories.map((cat) => {
                        const Icon = ICON_MAP[cat.id] || UtensilsCrossed;
                        const active = selectedCategory === cat.id;
                        return (
                            <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
                                aria-current={active ? "page" : undefined}
                                className={cn(
                                    "group relative shrink-0 flex items-center gap-2 pb-2 text-xs font-medium tracking-wide transition-colors whitespace-nowrap",
                                    active ? "text-accent-gold" : "text-text-muted hover:text-text-primary"
                                )}>
                                <Icon className={cn("w-[15px] h-[15px] transition-transform", active && "fill-accent-gold/10")} />
                                <span>{cat.name}</span>
                                {active && (
                                    <span className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-accent-gold rounded-full" />
                                )}
                            </button>
                        );
                    })}
                </nav>
            </header>

            {/* Responsive Main Layout */}
            <ResponsiveShell
                className="flex-1 overflow-hidden"
                mobile={
                    <div className="flex-1 overflow-auto p-3 elegant-scrollbar">
                        <ProductGrid categoryFilter={selectedCategory} onAddToCart={handleAddToCart} products={products} isLoading={isLoading} outOfStockIds={outOfStockIds} />
                    </div>
                }
                tablet={
                    <div className="flex-1 flex flex-row overflow-hidden">
                        <div className="flex-1 overflow-auto p-4 elegant-scrollbar">
                            <ProductGrid categoryFilter={selectedCategory} onAddToCart={handleAddToCart} products={products} isLoading={isLoading} outOfStockIds={outOfStockIds} />
                        </div>
                        <div className="w-[340px] shrink-0 border-l border-border-default bg-surface-card overflow-auto elegant-scrollbar">
                            <Cart items={cartItems} onUpdateQuantity={handleUpdateQuantity} onClearCart={handleClearCart} onCheckout={handleCheckoutWithTip} onSendToKitchen={handleSendToKitchen} onSplitBill={() => setIsSplitOpen(true)} tableNumber={currentTable?.number} guestCount={currentTable?.seats} onItemContextMenu={handleItemContextMenu} />
                        </div>
                    </div>
                }
                desktop={
                    <div className="flex-1 flex flex-row overflow-hidden">
                        <div className={cn("flex-1 overflow-auto p-ui lg:p-ui elegant-scrollbar transition-all", isRushMode ? "bg-surface-sidebar" : "bg-surface-bg")}>
                            <ProductGrid categoryFilter={selectedCategory} onAddToCart={handleAddToCart} products={products} isLoading={isLoading} outOfStockIds={outOfStockIds} />
                        </div>

                        {isCartSidebar && (
                            <div className={cn("h-full hidden xl:flex xl:flex-col w-[400px] shrink-0 border-l border-border/50 transition-colors overflow-hidden", isRushMode ? "bg-surface-sidebar" : "bg-surface-card")}>
                                <div className="flex items-center gap-6 px-5 pt-4 pb-0 border-b border-border/40 shrink-0">
                                    <button onClick={() => setIsCourseViewOpen(false)}
                                        aria-current={!isCourseViewOpen ? "page" : undefined}
                                        className={cn(
                                            "relative pb-3 text-sm font-medium tracking-tight transition-colors",
                                            !isCourseViewOpen ? "text-text-primary" : "text-text-muted hover:text-text-primary"
                                        )}>
                                        Panier
                                        {!isCourseViewOpen && <span className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-accent-gold rounded-full" />}
                                    </button>
                                    <button onClick={() => setIsCourseViewOpen(true)}
                                        aria-current={isCourseViewOpen ? "page" : undefined}
                                        className={cn(
                                            "relative pb-3 text-sm font-medium tracking-tight transition-colors",
                                            isCourseViewOpen ? "text-text-primary" : "text-text-muted hover:text-text-primary"
                                        )}>
                                        Cours
                                        {isCourseViewOpen && <span className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-accent-gold rounded-full" />}
                                    </button>
                                </div>
                                <div className="flex-1 overflow-auto elegant-scrollbar">
                                    {isCourseViewOpen ? (
                                        <CourseManager items={cartItems} onSetCourse={(cartId, course) => handleSetItemCourse(cartId, course as CourseType | undefined)} onSendCourse={(course) => handleSendCourse(course as CourseType)} />
                                    ) : (
                                        <Cart items={cartItems} onUpdateQuantity={handleUpdateQuantity} onClearCart={handleClearCart} onCheckout={handleCheckoutWithTip} onSendToKitchen={handleSendToKitchen} onSplitBill={() => setIsSplitOpen(true)} tableNumber={currentTable?.number} guestCount={currentTable?.seats} onItemContextMenu={handleItemContextMenu} />
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                }
            />

            {/* Mobile cart dock — editorial signature: count · label + tabular total, gold rest, black on rush */}
            <AnimatePresence>
                {cartItems.length > 0 && !isMobileCartOpen && (isMobile || isTabletMode) && (
                    <motion.div
                        initial={{ y: 120, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 120, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        className="fixed bottom-28 left-5 right-5 z-50 pointer-events-none">
                        <button
                            onClick={() => setIsMobileCartOpen(true)}
                            className={cn(
                                "pointer-events-auto w-full h-[68px] rounded-2xl px-5 flex items-center justify-between transition-colors border relative overflow-hidden group active:scale-[0.99]",
                                "shadow-[0_24px_48px_-16px_rgba(0,0,0,0.55),0_2px_0_0_rgba(255,255,255,0.05)_inset]",
                                isRushMode
                                    ? "bg-red-500 border-red-400/60 text-white"
                                    : "bg-accent-gold border-accent-gold/40 text-[#0B0B0C]"
                            )}
                        >
                            <div className="flex items-center gap-4">
                                <span className={cn(
                                    "w-9 h-9 rounded-lg flex items-center justify-center font-serif font-black text-sm tracking-tight",
                                    isRushMode ? "bg-white/15 text-white" : "bg-[#0B0B0C]/15 text-[#0B0B0C]"
                                )}>
                                    {cartCount}
                                </span>
                                <div className="flex flex-col items-start leading-tight">
                                    <span className="font-serif font-black italic text-[10px] uppercase tracking-[0.24em] opacity-70">Panier</span>
                                    <span className="text-sm font-medium tracking-tight">Ouvrir</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="font-serif font-black text-2xl leading-none tracking-[-0.02em] tabular-nums">
                                    {formatCurrency(cartTotal)}
                                </span>
                                <Plus className="w-5 h-5 opacity-50 -rotate-45" />
                            </div>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mobile cart bottom sheet */}
            <BottomSheet isOpen={isMobileCartOpen} onClose={() => setIsMobileCartOpen(false)} title={`Panier Table ${currentTable?.number}`} size="full">
                <div className="h-full flex flex-col -mt-4">
                    <Cart items={cartItems} onUpdateQuantity={handleUpdateQuantity} onClearCart={handleClearCart} onCheckout={() => { setIsMobileCartOpen(false); handleCheckoutWithTip(); }} onSendToKitchen={() => { setIsMobileCartOpen(false); handleSendToKitchen(); }} onSplitBill={() => { setIsMobileCartOpen(false); setIsSplitOpen(true); }} tableNumber={currentTable?.number} guestCount={currentTable?.seats} showClose={false} onItemContextMenu={handleItemContextMenu} />
                </div>
            </BottomSheet>

            {/* Tip panel */}
            <AnimatePresence>
                {isTipPanelOpen && (
                    <motion.div key="tip-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-4 pb-8 sm:pb-0" onClick={(e) => { if (e.target === e.currentTarget) handleTipSkipped(); }}>
                        <motion.div key="tip-card" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }} transition={{ type: "spring", stiffness: 380, damping: 34 }} className="w-full sm:w-[420px]">
                            <TipPanel totalInMicrounits={cartTotal} onTipSelect={handleTipConfirmed} />
                            <button onClick={handleTipSkipped} className="mt-4 w-full h-12 rounded-full border border-border text-[11px] font-black uppercase tracking-wider text-text-muted hover:border-border/80 bg-surface-card/80 transition-colors">Passer — Sans pourboire</button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Context menu */}
            <CartItemContextMenu
                contextMenuItem={contextMenuItem}
                customDiscountValue={customDiscountValue}
                noteValue={noteValue}
                offerRequiresPin={offerPerm.requiresPin}
                cancelRequiresPin={cancelPerm.requiresPin}
                refundRequiresPin={refundPerm.requiresPin}
                onClose={() => { setContextMenuItem(null); setCustomDiscountValue(""); }}
                onDiscountPreset={handleDiscountPreset}
                onDiscountCustom={handleDiscountCustom}
                onDiscountCustomChange={setCustomDiscountValue}
                onProtectedAction={handleProtectedAction}
                onNoteChange={setNoteValue}
                onNoteSave={(cartId, note) => { handleSetItemNote(cartId, note); setContextMenuItem(null); }}
                onNoteClear={(cartId) => { handleSetItemNote(cartId, ""); setNoteValue(""); }}
                ticketConsumptionMode={consumptionMode}
                onConsumptionModeOverride={handleSetItemConsumptionMode}
                onToggleDoggyBag={handleToggleDoggyBag}
            />

            <PaymentDialog isOpen={isPaymentOpen} total={SovereignMath.toCents(BigInt(Math.round(cartGrandTotal)))} tvaInCents={cartTvaInCents} onClose={() => setIsPaymentOpen(false)} onPaymentComplete={handlePaymentComplete} />
            <SplitBillDialog isOpen={isSplitOpen} items={cartItems} total={cartTotal} coverCount={currentTable?.seats || 1} onClose={() => setIsSplitOpen(false)} onPaySplit={(amountInCents: number, guestIndex: number) => handlePaySplit(amountInCents, guestIndex)} onSplitComplete={handleSplitComplete} />
            <PinModal isOpen={pendingAction !== null} title={pinModalTitle} onConfirm={handlePinConfirm} onClose={handlePinClose} error={pinError} />
            <CashDrawerModal isOpen={isCashDrawerOpen} onClose={() => setIsCashDrawerOpen(false)} tenantId={activeTenantId ?? ""} userId={posUser?.id ?? "unknown"} />
            <VoidModal isOpen={isVoidModalOpen} onClose={() => setIsVoidModalOpen(false)} tenantId={activeTenantId ?? ""} operatorId={posUser?.id ?? "unknown"} />
            <BottomSheet isOpen={isCourseViewOpen && (isMobile || isTabletMode)} onClose={() => setIsCourseViewOpen(false)} title="Gestion des cours" size="full">
                <div className="h-full flex flex-col -mt-4 overflow-auto elegant-scrollbar">
                    <CourseManager items={cartItems} onSetCourse={(cartId, course) => handleSetItemCourse(cartId, course as CourseType | undefined)} onSendCourse={(course) => handleSendCourse(course as CourseType)} />
                </div>
            </BottomSheet>
            <SosCaisseModal isOpen={isSosModalOpen} onClose={() => setIsSosModalOpen(false)} tableId={selectedTableId} />
        </div>
    );
}

export default withPageGuard(POSPage, "pos");
