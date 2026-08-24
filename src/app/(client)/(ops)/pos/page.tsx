"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Zap } from "lucide-react";

import dynamic from "next/dynamic";
import { ProductGrid, Cart, TableSelector, PosHeader } from "@/modules/ops";
import { BottomSheet } from "@ui/BottomSheet";
import { useLanguage } from "@/shared/hooks";
import { cn } from "@/lib/ui.foundations";
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

            <PosHeader
                currentTable={currentTable}
                allTables={allTables}
                selectedTableId={selectedTableId}
                setSelectedTableId={setSelectedTableId}
                isTabletMode={isTabletMode}
                setIsTabletMode={setIsTabletMode}
                isTablePickerOpen={isTablePickerOpen}
                setIsTablePickerOpen={setIsTablePickerOpen}
                isRushMode={isRushMode}
                blurClass={tokens.blur}
                consumptionMode={consumptionMode}
                setConsumptionMode={setConsumptionMode}
                isCourseViewOpen={isCourseViewOpen}
                setIsCourseViewOpen={setIsCourseViewOpen}
                cartItemsLength={cartItems.length}
                handlePrintReceipt={handlePrintReceipt}
                setIsCashDrawerOpen={setIsCashDrawerOpen}
                setIsVoidModalOpen={setIsVoidModalOpen}
                setIsSosModalOpen={setIsSosModalOpen}
                categories={categories}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
            />

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
