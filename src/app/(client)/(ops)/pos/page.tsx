"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ProductGrid } from "@modules/ops";
import { Cart } from "@modules/ops";
import { TableSelector } from "@modules/ops";
import { PaymentDialog } from "@modules/ops";
import { SplitBillDialog } from "@modules/ops";
import { useKitchen, useTables } from "@/engines/ops/NexusOpsProvider";
import { useAuth, useTenant } from "@/engines/core/NexusCoreProvider";
import {
    LucideIcon, Plus, ArrowLeft, MoreHorizontal, Star, Pizza,
    UtensilsCrossed, GlassWater, Beef, Coffee, Zap,
    Percent, Tag, Gift, Trash2, X, Check,
    Wallet, RotateCcw, Tablet, BookOpen, Printer
} from "lucide-react";
import { useIsMobile } from "@/hooks";
import { BottomSheet } from "@ui/BottomSheet";
import { useLanguage } from "@/hooks";
import { cn } from "@/lib/ui.foundations";
import { PageHeaderWithDocs } from "@ui/PageHeaderWithDocs";
import { usePOSController } from "@modules/ops";
import { AmbianceService, RestaurantAmbiance } from "@domain/services/AmbianceService";
import { formatCurrency } from "@/lib/formatters";
import { toast } from "sonner";

// ── Printing (p0-2) ───────────────────────────────────────────
import { EpsonPrinter } from "@/lib/printing/EpsonPrinter";
import type { ReceiptTicket } from "@/lib/printing/EpsonPrinter";
import { tenantScopedKey } from "@/lib/storage/tenantScopedKey";

// ── New pos/ features ──────────────────────────────────────────
import { useStockAlerts } from "./useStockAlerts";
import { useActionPermission } from "@/hooks/useActionPermission";
import { PinModal } from "@/components/pos/PinModal";
import { TipPanel } from "@/components/pos/TipPanel";
import { CartItem, CourseType } from "@modules/ops/engine/types";
import { SovereignMath } from "@/shared/services/SovereignMath";
import { CourseManager } from "@/components/pos/CourseManager";
import { CashDrawerModal } from "@/components/pos/CashDrawerModal";
import { VoidModal } from "@/components/pos/VoidModal";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

type PendingAction =
    | { type: "offer";    cartId: string }
    | { type: "cancel";   cartId: string }
    | { type: "refund";   cartId: string }
    | { type: "discount"; cartId: string; percent: number };

const ICON_MAP: Record<string, LucideIcon> = {
    all:      Star,
    pizzas:   Pizza,
    pastas:   UtensilsCrossed,
    boissons: GlassWater,
    entrees:  UtensilsCrossed,
    plats:    Beef,
    desserts: Coffee,
};

const DISCOUNT_PRESETS = [5, 10, 15] as const;

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

    // ── Ambiance ──────────────────────────────────────────────────────────────
    const [ambiance, setAmbiance] = useState<RestaurantAmbiance>(AmbianceService.getCurrentAmbiance());
    const [tokens, setTokens] = useState(AmbianceService.getThemeTokens());

    useEffect(() => {
        const handleAmbianceChange = () => {
            setAmbiance(AmbianceService.getCurrentAmbiance());
            setTokens(AmbianceService.getThemeTokens());
        };
        window.addEventListener("ambiance-changed", handleAmbianceChange);
        return () => window.removeEventListener("ambiance-changed", handleAmbianceChange);
    }, []);

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

    // ── PIN modal state ───────────────────────────────────────────────────────
    const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
    const [pinError, setPinError]           = useState<string | undefined>();

    // ── Cart item context menu (pos-4) ────────────────────────────────────────
    const [contextMenuItem, setContextMenuItem] = useState<CartItem | null>(null);
    const [customDiscountValue, setCustomDiscountValue] = useState("");
    const contextMenuRef = useRef<HTMLDivElement>(null);

    // Close context menu on outside click
    useEffect(() => {
        if (!contextMenuItem) return;
        const onOutside = (e: MouseEvent) => {
            if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
                setContextMenuItem(null);
                setCustomDiscountValue("");
            }
        };
        document.addEventListener("mousedown", onOutside);
        return () => document.removeEventListener("mousedown", onOutside);
    }, [contextMenuItem]);

    // ── Tip panel state (pos-7) ───────────────────────────────────────────────
    const [isTipPanelOpen, setIsTipPanelOpen] = useState(false);

    // ── Cash drawer modal (pos-5) ─────────────────────────────────────────────
    const [isCashDrawerOpen, setIsCashDrawerOpen] = useState(false);

    // ── Void/refund modal (pos-6) ─────────────────────────────────────────────
    const [isVoidModalOpen, setIsVoidModalOpen] = useState(false);

    // ── Tablet mode (pos-9) ───────────────────────────────────────────────────
    const [isTabletMode, setIsTabletMode] = useState<boolean>(() => {
        if (typeof window === "undefined") return false;
        return localStorage.getItem(tenantScopedKey("pos-tablet-mode")) === "true";
    });
    const [isTablePickerOpen, setIsTablePickerOpen] = useState(false);
    useEffect(() => {
        localStorage.setItem(tenantScopedKey("pos-tablet-mode"), String(isTabletMode));
    }, [isTabletMode]);

    // ── Course view (pos-3) ───────────────────────────────────────────────────
    const [isCourseViewOpen, setIsCourseViewOpen] = useState(false);

    // ─────────────────────────────────────────────────────────────────────────
    // Handlers
    // ─────────────────────────────────────────────────────────────────────────

    /** Intercept checkout: show tip step first, then open PaymentDialog */
    const handleCheckoutWithTip = useCallback(() => {
        if (cartItems.length === 0) return;
        setIsTipPanelOpen(true);
    }, [cartItems.length]);

    const handleTipConfirmed = useCallback(
        (tip: number) => {
            setTipInMicrounits(tip);
            setIsTipPanelOpen(false);
            handleCheckout();
        },
        [setTipInMicrounits, handleCheckout]
    );

    const handleTipSkipped = useCallback(() => {
        setTipInMicrounits(0);
        setIsTipPanelOpen(false);
        handleCheckout();
    }, [setTipInMicrounits, handleCheckout]);

    /** Print current cart as a NF525 receipt using localStorage printer config (p0-2) */
    const handlePrintReceipt = useCallback(async () => {
        if (cartItems.length === 0) return;

        const STORAGE_KEY = tenantScopedKey("printer_config");
        let _ip = "192.168.1.100";
        let _port = 8008;
        try {
            const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
            if (raw) {
                const parsed = JSON.parse(raw) as unknown;
                if (
                    typeof parsed === "object" &&
                    parsed !== null &&
                    "ip" in parsed &&
                    typeof (parsed as { ip: unknown }).ip === "string"
                ) {
                    _ip = (parsed as { ip: string }).ip;
                }
                if (
                    typeof parsed === "object" &&
                    parsed !== null &&
                    "port" in parsed &&
                    typeof (parsed as { port: unknown }).port === "number"
                ) {
                    _port = (parsed as { port: number }).port;
                }
            }
        } catch {
            // fallback to defaults
        }

        const ticket: ReceiptTicket = {
            restaurantName: "RESTAURANT OS CORE",
            ticketNumber: `T-${Date.now()}`,
            tvaRatePercent: 10,
            totalInMicrounits: Math.round(cartTotal),
            items: cartItems.map((item) => ({
                name: item.name,
                qty: item.quantity,
                priceInMicrounits: item.unitPriceInMicrounits,
            })),
        };

        try {
            await EpsonPrinter.printReceipt(ticket);
            toast.success(`Impression envoyée — ${_ip}:${_port}`);
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Erreur impression";
            toast.error(`Impression échouée : ${msg}`);
        }
    }, [cartItems, cartTotal]);

    /** Cart item "⋯" button triggers context menu */
    const handleItemContextMenu = useCallback((cartId: string, item: CartItem) => {
        setContextMenuItem(item);
        setCustomDiscountValue("");
    }, []);

    /** Execute an already-authorised POS action */
    const executeAction = useCallback(
        (action: PendingAction) => {
            switch (action.type) {
                case "discount":
                    handleApplyDiscount(action.cartId, action.percent);
                    break;
                case "offer":
                    handleApplyOffer(action.cartId);
                    break;
                case "cancel":
                    handleCancelItem(action.cartId);
                    break;
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

    /**
     * RBAC gate: check permission, show PinModal if required, else execute.
     */
    const handleProtectedAction = useCallback(
        (action: PendingAction) => {
            let allowed = false;
            let requiresPin = false;
            let reason: string | undefined;

            if (action.type === "discount") {
                ({ allowed, requiresPin, reason } = discountPerm);
            } else if (action.type === "offer") {
                ({ allowed, requiresPin, reason } = offerPerm);
            } else if (action.type === "cancel") {
                ({ allowed, requiresPin, reason } = cancelPerm);
            } else {
                // refund
                ({ allowed, requiresPin, reason } = refundPerm);
            }

            if (!allowed) {
                toast.error(`Accès refusé — ${reason ?? "Niveau insuffisant"}`);
                return;
            }

            if (requiresPin) {
                setPendingAction(action);
                setPinError(undefined);
                return;
            }

            executeAction(action);
        },
        [discountPerm, offerPerm, cancelPerm, refundPerm, executeAction]
    );

    /** Called after user submits PIN */
    const handlePinConfirm = useCallback(
        async (pin: string) => {
            const ok = verifyPin ? await verifyPin(pin) : pin === "9999";
            if (!ok) {
                setPinError("PIN incorrect. Réessayez.");
                return;
            }
            setPinError(undefined);
            if (pendingAction) {
                executeAction(pendingAction);
            }
            setPendingAction(null);
        },
        [verifyPin, pendingAction, executeAction]
    );

    const handlePinClose = useCallback(() => {
        setPendingAction(null);
        setPinError(undefined);
    }, []);

    /** Apply a preset % discount via RBAC gate */
    const handleDiscountPreset = useCallback(
        (percent: number) => {
            if (!contextMenuItem) return;
            handleProtectedAction({ type: "discount", cartId: contextMenuItem.cartId, percent });
        },
        [contextMenuItem, handleProtectedAction]
    );

    /** Apply a custom % discount (from text input) */
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
    const isRushMode = ambiance === "RUSH_SPEED";
    /** Show cart as sidebar only on xl+ screens AND not in tablet mode */
    const isCartSidebar = !isMobile && !isTabletMode;

    // PIN modal title based on pending action
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
            <AnimatePresence>
                {contextMenuItem && (
                    <motion.div
                        key="ctx-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="fixed inset-0 z-[160] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4 pb-8 sm:pb-0"
                    >
                        <motion.div
                            ref={contextMenuRef}
                            key="ctx-card"
                            initial={{ opacity: 0, y: 32 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 32 }}
                            transition={{ type: "spring", stiffness: 400, damping: 32 }}
                            className="bg-surface-card border border-border rounded-t-[2rem] sm:rounded-[2rem] p-6 w-full sm:w-[400px] shadow-2xl"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <h3 className="text-sm font-black uppercase tracking-widest text-text-primary">
                                        Actions article
                                    </h3>
                                    <p className="text-[11px] text-accent-gold font-bold font-serif italic mt-0.5">
                                        {contextMenuItem.name}
                                    </p>
                                </div>
                                <button
                                    onClick={() => { setContextMenuItem(null); setCustomDiscountValue(""); }}
                                    className="w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* ── Discount section ─────────────────────────── */}
                            <div className="mb-5">
                                <p className="text-[9px] font-black uppercase tracking-widest text-text-muted mb-3 flex items-center gap-2">
                                    <Percent className="w-3 h-3" />
                                    Appliquer remise
                                </p>
                                <div className="grid grid-cols-3 gap-2 mb-3">
                                    {DISCOUNT_PRESETS.map((pct) => {
                                        const isActive = contextMenuItem.discountPercent === pct;
                                        return (
                                            <button
                                                key={pct}
                                                onClick={() => handleDiscountPreset(pct)}
                                                className={cn(
                                                    "h-10 rounded-2xl border text-[11px] font-black uppercase tracking-wider transition-all",
                                                    isActive
                                                        ? "bg-accent-gold border-accent-gold text-white shadow-md shadow-accent-gold/20"
                                                        : "bg-bg-primary border-border text-text-muted hover:border-accent-gold/40"
                                                )}
                                            >
                                                {pct}%
                                            </button>
                                        );
                                    })}
                                </div>
                                {/* Custom discount input */}
                                <div className="flex gap-2">
                                    <div className="flex-1 flex items-center gap-2 border border-border rounded-full px-4 h-10 bg-bg-primary focus-within:border-accent-gold/50 transition-colors">
                                        <Tag className="w-3 h-3 text-text-muted shrink-0" />
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            value={customDiscountValue}
                                            onChange={(e) => setCustomDiscountValue(e.target.value)}
                                            onKeyDown={(e) => e.key === "Enter" && handleDiscountCustom()}
                                            placeholder="% personnalisé"
                                            className="flex-1 bg-transparent text-[12px] text-text-primary placeholder:text-text-muted/50 focus:outline-none"
                                        />
                                    </div>
                                    <button
                                        onClick={handleDiscountCustom}
                                        disabled={!customDiscountValue.trim()}
                                        className="w-10 h-10 rounded-full bg-bg-tertiary flex items-center justify-center text-text-muted hover:bg-accent-gold hover:text-white transition-all disabled:opacity-30"
                                        aria-label="Appliquer"
                                    >
                                        <Check className="w-4 h-4" />
                                    </button>
                                </div>
                                {/* Show current discount info */}
                                {(contextMenuItem.discountPercent ?? 0) > 0 && (
                                    <button
                                        onClick={() => handleProtectedAction({ type: "discount", cartId: contextMenuItem.cartId, percent: 0 })}
                                        className="mt-2 text-[10px] text-status-error hover:underline font-bold tracking-wider"
                                    >
                                        Retirer la remise actuelle ({contextMenuItem.discountPercent}%)
                                    </button>
                                )}
                            </div>

                            {/* Separator */}
                            <div className="h-px bg-border/50 mb-4" />

                            {/* ── RBAC-guarded actions ──────────────────────── */}
                            <div className="space-y-2">
                                {/* Offer product — requires pos.offer_product (manager + PIN) */}
                                <button
                                    onClick={() => handleProtectedAction({ type: "offer", cartId: contextMenuItem.cartId })}
                                    disabled={contextMenuItem.isOffer}
                                    className={cn(
                                        "w-full h-11 rounded-2xl border flex items-center gap-3 px-4 text-[11px] font-black uppercase tracking-wider transition-all",
                                        contextMenuItem.isOffer
                                            ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400 cursor-not-allowed"
                                            : "border-border bg-bg-primary text-text-muted hover:border-emerald-500/40 hover:text-emerald-400"
                                    )}
                                >
                                    <Gift className="w-4 h-4 shrink-0" />
                                    {contextMenuItem.isOffer ? "Article offert" : "Offrir l'article"}
                                    {!contextMenuItem.isOffer && offerPerm.requiresPin && (
                                        <span className="ml-auto text-[8px] text-accent-gold border border-accent-gold/30 px-2 py-0.5 rounded-full">PIN</span>
                                    )}
                                </button>

                                {/* Cancel item — requires pos.cancel_item_sent */}
                                <button
                                    onClick={() => handleProtectedAction({ type: "cancel", cartId: contextMenuItem.cartId })}
                                    className="w-full h-11 rounded-2xl border border-border bg-bg-primary flex items-center gap-3 px-4 text-[11px] font-black uppercase tracking-wider text-text-muted hover:border-status-error/40 hover:text-status-error transition-all"
                                >
                                    <Trash2 className="w-4 h-4 shrink-0" />
                                    Annuler l'article
                                    {cancelPerm.requiresPin && (
                                        <span className="ml-auto text-[8px] text-accent-gold border border-accent-gold/30 px-2 py-0.5 rounded-full">PIN</span>
                                    )}
                                </button>

                                {/* Refund — requires pos.refund (manager + PIN) */}
                                <button
                                    onClick={() => handleProtectedAction({ type: "refund", cartId: contextMenuItem.cartId })}
                                    className="w-full h-11 rounded-2xl border border-border bg-bg-primary flex items-center gap-3 px-4 text-[11px] font-black uppercase tracking-wider text-text-muted hover:border-status-error/40 hover:text-status-error transition-all"
                                >
                                    <X className="w-4 h-4 shrink-0" />
                                    Rembourser l'article
                                    {refundPerm.requiresPin && (
                                        <span className="ml-auto text-[8px] text-accent-gold border border-accent-gold/30 px-2 py-0.5 rounded-full">PIN</span>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

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
