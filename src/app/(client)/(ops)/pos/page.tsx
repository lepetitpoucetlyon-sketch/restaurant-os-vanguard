"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ProductGrid, Cart, TableSelector, PaymentDialog, SplitBillDialog } from "@modules/ops";
import { useKitchen, useTables } from "@/engines/ops/NexusOpsProvider";
import { useAuth, useTenant } from "@/engines/core/NexusCoreProvider";
import {
    LucideIcon, Plus, ArrowLeft, MoreHorizontal, Star, Pizza,
    UtensilsCrossed, GlassWater, Beef, Coffee, Zap,
    Wallet, RotateCcw, Tablet, BookOpen, Printer,
    Store, ShoppingBag,
} from "lucide-react";
import { useIsMobile } from "@/hooks";
import { BottomSheet } from "@ui/BottomSheet";
import { useLanguage } from "@/hooks";
import { cn } from "@/lib/ui.foundations";
import { PageHeaderWithDocs } from "@ui/PageHeaderWithDocs";
import { usePOSController } from "@modules/ops";
import { formatCurrency } from "@/lib/formatters";
import { toast } from "sonner";
import { useStockAlerts } from "./useStockAlerts";
import { useActionPermission } from "@/hooks/useActionPermission";
import { CashDrawerModal, PinModal, TipPanel, VoidModal, CourseManager } from "@modules/commerce/ui/pos";
import { CartItem, CourseType } from "@modules/ops/engine/types";
import { SovereignMath } from "@/shared/services/SovereignMath";
import { useAmbiance, useTabletMode, usePrintReceipt, useRbacGate, CartItemContextMenu } from "./_posSlices";

const ICON_MAP: Record<string, LucideIcon> = {
    all:      Star,
    pizzas:   Pizza,
    pastas:   UtensilsCrossed,
    boissons: GlassWater,
    entrees:  UtensilsCrossed,
    plats:    Beef,
    desserts: Coffee,
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export default function POSPage() {
    const { t: _t } = useLanguage();
    const isMobile = useIsMobile();
    const { orders: _orders } = useKitchen();
    const { verifyPin, currentUser: posUser } = useAuth();
    const { activeTenantId } = useTenant();
    const { nodes: allTables } = useTables();

    // ── Slices ────────────────────────────────────────────────────────────────
    const { ambiance, tokens } = useAmbiance();
    const { isTabletMode, setIsTabletMode, isTablePickerOpen, setIsTablePickerOpen } = useTabletMode();

    // ── POS controller ────────────────────────────────────────────────────────
    const {
        selectedTableId, setSelectedTableId,
        selectedCategory, setSelectedCategory,
        categories, products, isLoading,
        isMobileCartOpen, setIsMobileCartOpen,
        isPaymentOpen, setIsPaymentOpen,
        isSplitOpen, setIsSplitOpen,
        cartItems,
        tipInMicrounits: _tipInMicrounits,
        setTipInMicrounits,
        currentTable, cartTotal, cartGrandTotal, cartCount,
        handleAddToCart, handleUpdateQuantity, handleClearCart,
        handleApplyDiscount, handleApplyOffer, handleCancelItem,
        handleSendToKitchen, handlePaymentComplete,
        handleCheckout, handlePaySplit,
        handleSetItemCourse, handleSendCourse,
        handleSetItemNote,
        handleSetItemConsumptionMode,
        handleToggleDoggyBag,
        consumptionMode,
        setConsumptionMode,
    } = usePOSController();

    // ── USP-007: pre-select table from floor-plan (?table=<id>) ──────────────
    const searchParams = useSearchParams();
    useEffect(() => {
        const tableParam = searchParams.get("table");
        if (tableParam) setSelectedTableId(tableParam);
    }, [searchParams, setSelectedTableId]);

    // ── Stock alerts (pos-8) ──────────────────────────────────────────────────
    const outOfStockIds = useStockAlerts();

    // ── RBAC permissions (rbac-1) ─────────────────────────────────────────────
    const refundPerm   = useActionPermission("pos", "refund");
    const offerPerm    = useActionPermission("pos", "offer_product");
    const cancelPerm   = useActionPermission("pos", "cancel_item_sent");
    const discountPerm = useActionPermission("pos", "apply_discount_percent");

    // ── Cart item context menu state (pos-4) ──────────────────────────────────
    const [contextMenuItem, setContextMenuItem] = useState<CartItem | null>(null);
    const [customDiscountValue, setCustomDiscountValue] = useState("");
    const [noteValue, setNoteValue] = useState("");

    // ── Modal states ──────────────────────────────────────────────────────────
    const [isTipPanelOpen, setIsTipPanelOpen]   = useState(false);
    const [isCashDrawerOpen, setIsCashDrawerOpen] = useState(false);
    const [isVoidModalOpen, setIsVoidModalOpen]   = useState(false);
    const [isCourseViewOpen, setIsCourseViewOpen] = useState(false);

    // ── executeAction (shared between RBAC gate + context menu) ──────────────
    const executeAction = useCallback(
        (action: import("./_hooks/useRbacGate").PendingAction) => {
            switch (action.type) {
                case "discount": handleApplyDiscount(action.cartId, action.percent); break;
                case "offer":    handleApplyOffer(action.cartId); break;
                case "cancel":   handleCancelItem(action.cartId); break;
                case "refund":
                    toast.success("Remboursement initié — ticket annulé");
                    handleCancelItem(action.cartId);
                    break;
            }
            setContextMenuItem(null);
            setCustomDiscountValue("");
        },
        [handleApplyDiscount, handleApplyOffer, handleCancelItem]
    );

    // ── RBAC gate (pin flow) ──────────────────────────────────────────────────
    const { pendingAction, pinError, handleProtectedAction, handlePinConfirm, handlePinClose } =
        useRbacGate(
            { discount: discountPerm, offer: offerPerm, cancel: cancelPerm, refund: refundPerm },
            executeAction,
            verifyPin,
        );

    // ── Print receipt hook ────────────────────────────────────────────────────
    const handlePrintReceipt = usePrintReceipt(cartItems, cartTotal);

    // ─────────────────────────────────────────────────────────────────────────
    // Handlers
    // ─────────────────────────────────────────────────────────────────────────

    const handleCheckoutWithTip = useCallback(() => {
        if (cartItems.length === 0) return;
        setIsTipPanelOpen(true);
    }, [cartItems.length]);

    const handleTipConfirmed = useCallback(
        (tip: number) => { setTipInMicrounits(tip); setIsTipPanelOpen(false); handleCheckout(); },
        [setTipInMicrounits, handleCheckout]
    );

    const handleTipSkipped = useCallback(() => {
        setTipInMicrounits(0); setIsTipPanelOpen(false); handleCheckout();
    }, [setTipInMicrounits, handleCheckout]);

    const handleItemContextMenu = useCallback((_cartId: string, item: CartItem) => {
        setContextMenuItem(item);
        setCustomDiscountValue("");
        setNoteValue(item.notes ?? "");
    }, []);

    const handleDiscountPreset = useCallback(
        (percent: number) => {
            if (!contextMenuItem) return;
            handleProtectedAction({ type: "discount", cartId: contextMenuItem.cartId, percent });
        },
        [contextMenuItem, handleProtectedAction]
    );

    const handleDiscountCustom = useCallback(() => {
        if (!contextMenuItem) return;
        const pct = parseFloat(customDiscountValue.replace(",", "."));
        if (isNaN(pct) || pct <= 0 || pct > 100) {
            toast.error("Remise invalide — saisissez un pourcentage entre 1 et 100");
            return;
        }
        handleProtectedAction({ type: "discount", cartId: contextMenuItem.cartId, percent: Math.round(pct) });
    }, [contextMenuItem, customDiscountValue, handleProtectedAction]);

    // ── Derived ───────────────────────────────────────────────────────────────
    const isRushMode    = ambiance === "RUSH_SPEED";
    const isCartSidebar = !isMobile && !isTabletMode;

    const pinModalTitle = pendingAction
        ? pendingAction.type === "offer"   ? "Autoriser l'offre"
        : pendingAction.type === "cancel"  ? "Autoriser l'annulation"
        : pendingAction.type === "refund"  ? "Autoriser le remboursement"
        : "Autoriser la remise"
        : "";

    // ─────────────────────────────────────────────────────────────────────────
    // Table selection screen
    // ─────────────────────────────────────────────────────────────────────────

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

    // ─────────────────────────────────────────────────────────────────────────
    // POS main layout
    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className={cn(
            "flex flex-1 flex-col h-[calc(100vh-80px)] lg:h-[calc(100vh-100px)] -m-4 lg:-m-8 overflow-hidden relative pb-24 lg:pb-0 transition-colors duration-1000",
            isRushMode ? "bg-surface-sidebar" : "bg-bg-primary"
        )}>

            {/* ── Header & Category Swiper ─────────────────────────────────── */}
            <div className={cn(
                "px-ui py-ui border-b border-border/50 sticky top-0 z-40 transition-all",
                isRushMode ? "bg-surface-sidebar/90" : "bg-surface-card/80 dark:bg-bg-primary/80",
                tokens.blur
            )}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSelectedTableId(null)} className="text-text-muted">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        {/* Table number — bigger in tablet mode (pos-9) */}
                        {isTabletMode ? (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setIsTablePickerOpen((v) => !v)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-accent-gold/10 border border-accent-gold/30 hover:bg-accent-gold/20 transition-colors"
                                >
                                    <span className="text-xl font-serif font-black italic text-accent-gold tracking-tight">
                                        Table {currentTable?.number || "—"}
                                    </span>
                                    <MoreHorizontal className="w-4 h-4 text-accent-gold/70" />
                                </button>
                                {isTablePickerOpen && (
                                    <div className="absolute top-full mt-2 left-0 z-50 bg-surface-card border border-border rounded-2xl shadow-xl p-3 w-64 grid grid-cols-4 gap-1.5">
                                        {allTables.map((t) => (
                                            <button
                                                key={t.id}
                                                onClick={() => { setSelectedTableId(t.id); setIsTablePickerOpen(false); }}
                                                className={cn(
                                                    "h-10 rounded-xl border text-[11px] font-black uppercase tracking-wider transition-all",
                                                    t.id === selectedTableId
                                                        ? "bg-accent-gold border-accent-gold text-white"
                                                        : "border-border text-text-muted hover:border-accent-gold/40 hover:text-accent-gold"
                                                )}
                                            >
                                                {t.number ?? t.id.slice(-3)}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <PageHeaderWithDocs
                                categoryId="pos"
                                title={`Table ${currentTable?.number || ""}`}
                                className="text-2xl font-serif font-black italic text-text-primary tracking-tight"
                            >
                                <span className="text-accent-gold ml-1">.</span>
                            </PageHeaderWithDocs>
                        )}
                        {isRushMode && (
                            <div className="flex items-center gap-2 bg-status-success/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                                <Zap className="w-3 h-3 text-status-success fill-emerald-400" />
                                <span className="text-[9px] font-black uppercase text-status-success tracking-widest">Rush Active</span>
                            </div>
                        )}
                    </div>

                    {/* ── Header action buttons ──────────────────────────── */}
                    <div className="flex items-center gap-2">
                        {/* Consumption mode toggle (T12) */}
                        <button
                            onClick={() => setConsumptionMode(consumptionMode === 'dine_in' ? 'takeaway' : 'dine_in')}
                            title={consumptionMode === 'dine_in' ? 'Sur place' : 'À emporter'}
                            className={cn(
                                "h-10 px-3 rounded-full flex items-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all border",
                                consumptionMode === 'dine_in'
                                    ? "bg-action-primary/10 border-action-primary/30 text-action-primary"
                                    : "bg-amber-500/10 border-amber-500/30 text-amber-500"
                            )}
                        >
                            {consumptionMode === 'dine_in' ? <Store className="w-3.5 h-3.5" /> : <ShoppingBag className="w-3.5 h-3.5" />}
                            {consumptionMode === 'dine_in' ? 'Sur place' : 'Emporter'}
                        </button>

                        {/* Course view toggle (pos-3) */}
                        <button
                            onClick={() => setIsCourseViewOpen((v) => !v)}
                            title="Vue par cours"
                            className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                                isCourseViewOpen
                                    ? "bg-accent-gold text-white"
                                    : "bg-bg-tertiary text-text-muted hover:text-text-primary"
                            )}
                        >
                            <BookOpen className="w-4 h-4" />
                        </button>

                        {/* Cash drawer (pos-5) */}
                        <button
                            onClick={() => setIsCashDrawerOpen(true)}
                            title="Fond de caisse"
                            className="w-10 h-10 rounded-full bg-bg-tertiary flex items-center justify-center text-text-muted hover:text-accent-gold transition-colors"
                        >
                            <Wallet className="w-4 h-4" />
                        </button>

                        {/* Print receipt (p0-2) */}
                        <button
                            onClick={handlePrintReceipt}
                            disabled={cartItems.length === 0}
                            title="Imprimer le ticket"
                            className="w-10 h-10 rounded-full bg-bg-tertiary flex items-center justify-center text-text-muted hover:text-accent-gold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <Printer className="w-4 h-4" />
                        </button>

                        {/* Void / refund (pos-6) */}
                        <button
                            onClick={() => setIsVoidModalOpen(true)}
                            title="Annuler / Rembourser"
                            className="w-10 h-10 rounded-full bg-bg-tertiary flex items-center justify-center text-text-muted hover:text-status-error transition-colors"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>

                        {/* Tablet mode toggle (pos-9) */}
                        <button
                            onClick={() => setIsTabletMode((v) => !v)}
                            title={isTabletMode ? "Quitter le mode tablette" : "Mode tablette"}
                            className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                                isTabletMode
                                    ? "bg-text-primary text-bg-primary dark:bg-accent-gold dark:text-white"
                                    : "bg-bg-tertiary text-text-muted hover:text-text-primary"
                            )}
                        >
                            <Tablet className="w-4 h-4" />
                        </button>
                    </div>
                </div>

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
                    {categories.map((cat) => {
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

            {/* ── Main content: ProductGrid + Cart ─────────────────────────── */}
            <div className="flex-1 flex flex-row overflow-hidden">

                {/* Product Grid — full width in tablet mode (pos-9) */}
                <div className={cn(
                    "flex-1 overflow-auto p-ui lg:p-ui elegant-scrollbar transition-all",
                    isRushMode ? "bg-surface-sidebar" : "bg-bg-primary/50"
                )}>
                    <ProductGrid
                        categoryFilter={selectedCategory}
                        onAddToCart={handleAddToCart}
                        products={products}
                        isLoading={isLoading}
                        outOfStockIds={outOfStockIds}
                    />
                </div>

                {/* Desktop Cart sidebar — hidden in tablet mode (pos-9) */}
                {isCartSidebar && (
                    <div className={cn(
                        "h-full hidden xl:flex xl:flex-col w-[400px] shrink-0 border-l border-border/30 transition-all overflow-hidden",
                        isRushMode ? "bg-[#0f172a]" : "bg-surface-card"
                    )}>
                        {/* ── Cart / Course view tab bar (pos-3) ────────── */}
                        <div className="flex border-b border-border/40 shrink-0">
                            <button
                                onClick={() => setIsCourseViewOpen(false)}
                                className={cn(
                                    "flex-1 h-10 text-[9px] font-black uppercase tracking-widest transition-colors",
                                    !isCourseViewOpen
                                        ? "border-b-2 border-accent-gold text-accent-gold"
                                        : "text-text-muted hover:text-text-primary"
                                )}
                            >
                                Panier
                            </button>
                            <button
                                onClick={() => setIsCourseViewOpen(true)}
                                className={cn(
                                    "flex-1 h-10 text-[9px] font-black uppercase tracking-widest transition-colors",
                                    isCourseViewOpen
                                        ? "border-b-2 border-accent-gold text-accent-gold"
                                        : "text-text-muted hover:text-text-primary"
                                )}
                            >
                                Cours
                            </button>
                        </div>

                        {/* ── Content ───────────────────────────────────── */}
                        <div className="flex-1 overflow-auto elegant-scrollbar">
                            {isCourseViewOpen ? (
                                <CourseManager
                                    items={cartItems}
                                    onSetCourse={(cartId, course) =>
                                        handleSetItemCourse(cartId, course as CourseType | undefined)
                                    }
                                    onSendCourse={(course) => handleSendCourse(course as CourseType)}
                                />
                            ) : (
                                <Cart
                                    items={cartItems}
                                    onUpdateQuantity={handleUpdateQuantity}
                                    onClearCart={handleClearCart}
                                    onCheckout={handleCheckoutWithTip}
                                    onSendToKitchen={handleSendToKitchen}
                                    onSplitBill={() => setIsSplitOpen(true)}
                                    tableNumber={currentTable?.number}
                                    guestCount={currentTable?.seats}
                                    onItemContextMenu={handleItemContextMenu}
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Mobile / tablet cart dock ─────────────────────────────────── */}
            <AnimatePresence>
                {cartItems.length > 0 && !isMobileCartOpen && (isMobile || isTabletMode) && (
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
                                isRushMode ? "bg-status-success border-emerald-400" : "bg-text-primary dark:bg-accent-gold border-subtle"
                            )}
                        >
                            <div className="absolute inset-0 bg-surface-card/5 opacity-0 group-active:opacity-100 transition-opacity" />
                            <div className="flex items-center gap-4 relative z-10">
                                <div className="w-10 h-10 bg-surface-card/20 rounded-2xl flex items-center justify-center font-black text-xs text-white">
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

            {/* ── Mobile cart bottom sheet ──────────────────────────────────── */}
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
                        onCheckout={() => { setIsMobileCartOpen(false); handleCheckoutWithTip(); }}
                        onSendToKitchen={() => { setIsMobileCartOpen(false); handleSendToKitchen(); }}
                        onSplitBill={() => { setIsMobileCartOpen(false); setIsSplitOpen(true); }}
                        tableNumber={currentTable?.number}
                        guestCount={currentTable?.seats}
                        showClose={false}
                        onItemContextMenu={handleItemContextMenu}
                    />
                </div>
            </BottomSheet>

            {/* ── Tip panel (pos-7) — shown before payment dialog ───────────── */}
            <AnimatePresence>
                {isTipPanelOpen && (
                    <motion.div
                        key="tip-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-4 pb-8 sm:pb-0"
                        onClick={(e) => { if (e.target === e.currentTarget) handleTipSkipped(); }}
                    >
                        <motion.div
                            key="tip-card"
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 40 }}
                            transition={{ type: "spring", stiffness: 380, damping: 34 }}
                            className="w-full sm:w-[420px]"
                        >
                            <TipPanel
                                totalInMicrounits={cartTotal}
                                onTipSelect={handleTipConfirmed}
                            />
                            <button
                                onClick={handleTipSkipped}
                                className="mt-4 w-full h-12 rounded-full border border-border text-[11px] font-black uppercase tracking-wider text-text-muted hover:border-border/80 bg-surface-card/80 transition-colors"
                            >
                                Passer — Sans pourboire
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Cart item context menu (pos-4 discount + rbac-1 actions) ──── */}
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

            {/* ── Payment dialog ────────────────────────────────────────────── */}
            <PaymentDialog
                isOpen={isPaymentOpen}
                total={SovereignMath.toCents(BigInt(Math.round(cartGrandTotal)))}
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

            {/* ── PIN modal (rbac-1) ────────────────────────────────────────── */}
            <PinModal
                isOpen={pendingAction !== null}
                title={pinModalTitle}
                onConfirm={handlePinConfirm}
                onClose={handlePinClose}
                error={pinError}
            />

            {/* ── Cash drawer modal (pos-5) ────────────────────────────────── */}
            <CashDrawerModal
                isOpen={isCashDrawerOpen}
                onClose={() => setIsCashDrawerOpen(false)}
                tenantId={activeTenantId ?? ""}
                userId={posUser?.id ?? "unknown"}
            />

            {/* ── Void / refund modal (pos-6) ──────────────────────────────── */}
            <VoidModal
                isOpen={isVoidModalOpen}
                onClose={() => setIsVoidModalOpen(false)}
                tenantId={activeTenantId ?? ""}
                operatorId={posUser?.id ?? "unknown"}
            />

            {/* ── Mobile/tablet course view bottom sheet (pos-3) ───────────── */}
            <BottomSheet
                isOpen={isCourseViewOpen && (isMobile || isTabletMode)}
                onClose={() => setIsCourseViewOpen(false)}
                title="Gestion des cours"
                size="full"
            >
                <div className="h-full flex flex-col -mt-4 overflow-auto elegant-scrollbar">
                    <CourseManager
                        items={cartItems}
                        onSetCourse={(cartId, course) =>
                            handleSetItemCourse(cartId, course as CourseType | undefined)
                        }
                        onSendCourse={(course) => handleSendCourse(course as CourseType)}
                    />
                </div>
            </BottomSheet>
        </div>
    );
}
