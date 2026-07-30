"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useSetAtom } from "jotai";
import { activeCartAtom } from "../store/orderAtoms";
import { useOrders, useTables, useProducts, useCategories } from "@/modules/ops/providers";
import { useAuth, useTenant } from "@/shared/providers/NexusCoreProvider";
import { useToast } from "@components/ui/Toast";
import { Table, OrderItem } from "@nexus/contracts";
import { toMicrounits } from "@/domain/schemas/primitives";
import { CartItem, CourseType, SovereignProduct } from "../../engine/types";
import { applyItemDiscount, applyItemOffer } from "../domain/cartDiscounts";
import { FinancialNexusBridge } from "@/infrastructure/adapters/FinancialNexusBridge";
import type { ConsumptionMode } from "@/domain/schemas/orders";

import { POSService } from "../domain";

interface PaymentContext {
    cartItems: CartItem[];
    operatorId: string;
    tableId: string | null;
    tenantId: string;
    consumptionMode: ConsumptionMode;
    partialPayments?: { amount: number; guest: number; method?: string }[];
}

async function processPayment(ctx: PaymentContext) {
    await FinancialNexusBridge.processOrder({
        cartItems: ctx.cartItems,
        operatorId: ctx.operatorId,
        tableId: ctx.tableId,
        tenantId: ctx.tenantId,
        consumptionMode: ctx.consumptionMode,
        partialPayments: ctx.partialPayments,
    });
}

function buildModifiers(
    selectedOptions: Record<string, { id?: string; name: string; action?: 'add' | 'remove' | 'info'; ingredientId?: string; quantityImpact?: number }[]> | undefined
) {
    if (!selectedOptions) return [];
    return Object.values(selectedOptions).flat().map((opt) => ({
        id: opt.id || `${Date.now()}-${Math.random()}`,
        name: opt.name,
        action: opt.action || 'add',
        ingredientId: opt.ingredientId,
        quantityImpact: opt.quantityImpact,
    }));
}

const COURSE_LABELS: Record<CourseType, string> = { entree: "Entrées", plat: "Plats", dessert: "Desserts" };

function getUnsentCourseItems(items: CartItem[], course: CourseType): CartItem[] {
    return items.filter((i) => i.course === course && !i.sentAt);
}

function markCourseAsSent(items: CartItem[], course: CourseType, sentAt: number): CartItem[] {
    return items.map((item) => item.course === course && !item.sentAt ? { ...item, sentAt } : item);
}

function computeCartTva(cartItems: CartItem[]): number {
    let tvaMu = 0;
    for (const item of cartItems) {
        const rate = parseFloat(String(item.taxRate ?? '0.10'));
        const ttcMu = item.unitPriceInMicrounits * item.quantity - (item.discountInMicrounits ?? 0);
        tvaMu += ttcMu - Math.round(ttcMu / (1 + rate));
    }
    return Math.round(tvaMu / 10_000);
}

function buildCartItem(product: SovereignProduct, quantity: number, modifiers: CartItem['modifiers'], note?: string): CartItem {
    return {
        cartId: `${product.id}-${Date.now()}`,
        productId: product.id,
        categoryId: product.categoryId || "other",
        name: product.name,
        unitPriceInMicrounits: product.priceInMicrounits || toMicrounits((product.priceInCents || 0) * 10000),
        discountInMicrounits: toMicrounits(0),
        taxRate: product.taxRate || "0.10",
        quantity,
        modifiers,
        notes: note || "",
    };
}

function updateItemQuantity(items: CartItem[], cartId: string, delta: number): CartItem[] {
    return items
        .map((item) => item.cartId === cartId ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item)
        .filter((item) => item.quantity > 0);
}

function buildCourseOrderItems(courseItems: CartItem[], course: CourseType): OrderItem[] {
    return courseItems.map((item) => ({
        id: item.cartId,
        productId: item.productId,
        name: item.name,
        unitPriceInMicrounits: item.unitPriceInMicrounits,
        taxRate: item.taxRate,
        quantity: item.quantity,
        status: "pending" as const,
        notes: item.notes,
        modifiers: item.modifiers,
        discountInMicrounits: toMicrounits(0),
        course,
    })) as OrderItem[];
}

function updateCartItem(items: CartItem[], cartId: string, patch: Partial<CartItem>): CartItem[] {
    return items.map((item) => item.cartId !== cartId ? item : { ...item, ...patch });
}

function canCancelSentItem(item: CartItem | undefined, hasAccess: ((perm: string) => boolean) | undefined): boolean {
    if (!item?.sentAt) return true;
    return !hasAccess || hasAccess('operations.pos.cancel_sent');
}

function hasPermission(hasAccess: ((perm: string) => boolean) | undefined, perm: string): boolean {
    return !hasAccess || hasAccess(perm);
}

function resolveServerName(user: { name?: string } | null | undefined): string {
    return user?.name || "Serveur";
}

interface SplitInfo {
    label: string;
    partials: { amount: number; guest: number; method?: string }[] | undefined;
}

function getSplitInfo(opts: { split?: boolean } | undefined, payments: { amount: number; guest: number; method?: string }[]): SplitInfo {
    return {
        label: opts?.split ? "Paiement fractionné validé" : "Paiement validé",
        partials: opts?.split ? payments : undefined,
    };
}

interface SendOrderParams {
    tableId: string;
    tableNumber: string;
    serverName: string;
    items: OrderItem[];
}

async function handleSendCourseImpl(
    course: CourseType,
    cartItems: CartItem[],
    currentTable: Table | undefined,
    currentUser: { name?: string } | null | undefined,
    addOrder: (data: Record<string, unknown>) => Promise<void>,
    updateTable: (id: string, data: Record<string, unknown>) => Promise<void>,
    selectedTableId: string | null,
    setCartItems: (updater: (prev: CartItem[]) => CartItem[]) => void,
    showToast: (msg: string, type: string) => void
): Promise<void> {
    const courseItems = getUnsentCourseItems(cartItems, course);
    if (courseItems.length === 0 || !currentTable) return;
    try {
        await submitKitchenOrder(
            { tableId: currentTable.id, tableNumber: currentTable.number, serverName: resolveServerName(currentUser), items: buildCourseOrderItems(courseItems, course) },
            addOrder, updateTable, selectedTableId
        );
        setCartItems((prev) => markCourseAsSent(prev, course, Date.now()));
        showToast(`${COURSE_LABELS[course]} envoyés en cuisine`, "success");
    } catch { showToast("Erreur lors de l'envoi du cours", "error"); }
}

async function submitKitchenOrder(
    params: SendOrderParams,
    addOrder: (data: Record<string, unknown>) => Promise<void>,
    updateTable: (id: string, data: Record<string, unknown>) => Promise<void>,
    selectedTableId: string | null
) {
    await addOrder({
        tableId: params.tableId,
        tableNumber: Number(params.tableNumber) || 0,
        serverName: params.serverName,
        items: params.items,
        status: "new",
    });
    if (selectedTableId) await updateTable(selectedTableId, { status: "ordered" });
}

/**
 * usePOSController - The Primary POS Hook
 * Handles cart state, payment flow, discounts, offers, tips, and cancellations.
 */

export function usePOSController() {
    const { currentUser, hasAccess } = useAuth();
    const { activeTenantId } = useTenant();
    const { nodes: tables, updateTable } = useTables();
    const { add: addOrder } = useOrders();
    const { data: products, isLoading: productsLoading } = useProducts();
    const { data: categories, isLoading: categoriesLoading } = useCategories();

    const { showToast } = useToast();
    const setActiveCart = useSetAtom(activeCartAtom);

    // --- POS STATE ---
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isSplitOpen, setIsSplitOpen] = useState(false);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);

    /** Tip selected before payment confirmation (in microunits) */
    const [tipInMicrounits, setTipInMicrounits] = useState<number>(0);

    /** Ticket-level consumption mode (dine_in / takeaway) — T12 */
    const [consumptionMode, setConsumptionMode] = useState<ConsumptionMode>('dine_in');

    const isLoading = productsLoading || categoriesLoading;
    const resolvedTables = tables ?? [];
    const resolvedCategories = categories ?? [];
    const resolvedProducts = products ?? [];

    // --- DERIVED STATE ---
    const currentTable = useMemo(() =>
        resolvedTables.find((t: Table) => t.id === selectedTableId),
        [resolvedTables, selectedTableId]);

    /** Cart subtotal (does not include tip). Already reflects per-item discounts. */
    const cartTotal = useMemo(() =>
        POSService.calculateCartTotal(cartItems),
        [cartItems]);

    /** Grand total including tip */
    const cartGrandTotal = useMemo(() =>
        toMicrounits(cartTotal + tipInMicrounits),
        [cartTotal, tipInMicrounits]);

    const cartCount = useMemo(() =>
        cartItems.reduce((sum, item) => sum + item.quantity, 0),
        [cartItems]);

    const cartTvaInCents = useMemo(() => computeCartTva(cartItems), [cartItems]);

    // Sync cartItems vers activeCartAtom pour que posCartCountSelector/posCartTotalSelector soient à jour.
    useEffect(() => {
        setActiveCart(cartItems.length > 0 ? { items: cartItems as unknown as OrderItem[] } : null);
    }, [cartItems, setActiveCart]);

    // --- ACTIONS ---

    const handleAddToCart = useCallback((
        product: SovereignProduct,
        quantity: number,
        selectedOptions: Record<string, { id?: string; name: string; action?: 'add' | 'remove' | 'info'; ingredientId?: string; quantityImpact?: number }[]>,
        note?: string
    ) => {
        setCartItems((prev) => [...prev, buildCartItem(product, quantity, buildModifiers(selectedOptions), note)]);
        showToast(`${product.name} ajouté`, "success");
    }, [showToast]);

    const handleUpdateQuantity = useCallback((cartId: string, delta: number) => {
        setCartItems((prev) => updateItemQuantity(prev, cartId, delta));
    }, []);

    const handleClearCart = useCallback(() => {
        setCartItems([]);
        setTipInMicrounits(0);
    }, []);

    /**
     * Apply a percentage discount to a single cart item.
     * Stores the original price for strikethrough display,
     * then writes the discounted price into unitPriceInMicrounits
     * so Cart totals update automatically.
     *
     * @param cartId   Target cart item identifier
     * @param percent  0–100 discount percentage (0 removes discount)
     */
    const handleApplyDiscount = useCallback((cartId: string, percent: number) => {
        setCartItems((prev) => prev.map((item) => item.cartId === cartId ? applyItemDiscount(item, percent) : item));
        showToast(`Remise ${percent}% appliquée`, "success");
    }, [showToast]);

    const handleApplyOffer = useCallback((cartId: string) => {
        if (!hasPermission(hasAccess, 'operations.pos.offer')) { showToast("Accès refusé : Autorisation Manager requise", "error"); return; }
        setCartItems((prev) => prev.map((item) => item.cartId === cartId ? applyItemOffer(item) : item));
        showToast("Article offert", "success");
    }, [showToast, hasAccess]);

    const handleCancelItem = useCallback((cartId: string) => {
        if (!canCancelSentItem(cartItems.find(i => i.cartId === cartId), hasAccess)) { showToast("Accès refusé : Ce plat est déjà en préparation", "error"); return; }
        setCartItems((prev) => prev.filter((item) => item.cartId !== cartId));
        showToast("Article annulé", "success");
    }, [cartItems, showToast, hasAccess]);

    const handleSetItemNote = useCallback((cartId: string, note: string) => {
        setCartItems((prev) => updateCartItem(prev, cartId, { notes: note || undefined }));
    }, []);

    const handleSetItemConsumptionMode = useCallback((cartId: string, mode: ConsumptionMode | undefined) => {
        setCartItems((prev) => updateCartItem(prev, cartId, { consumptionMode: mode }));
    }, []);

    const handleToggleDoggyBag = useCallback((cartId: string) => {
        setCartItems((prev) => prev.map((item) => item.cartId !== cartId ? item : { ...item, doggyBag: !item.doggyBag }));
    }, []);

    const handleSendToKitchen = useCallback(async () => {
        if (cartItems.length === 0 || !currentTable) return;
        try {
            await submitKitchenOrder(
                { tableId: currentTable.id, tableNumber: currentTable.number, serverName: resolveServerName(currentUser), items: POSService.formatForKitchen(cartItems) as OrderItem[] },
                addOrder, updateTable, selectedTableId
            );
            showToast(`Table ${currentTable.number} : Commande envoyée`, "success");
            setCartItems([]);
        } catch (_error) { showToast("Erreur lors de l'envoi en cuisine", "error"); }
    }, [cartItems, currentTable, currentUser, addOrder, updateTable, selectedTableId, showToast]);

    const [partialPayments, setPartialPayments] = useState<{ amount: number, guest: number, method?: string }[]>([]);

    const finalizePayment = useCallback(async (opts?: { split?: boolean }) => {
        if (!currentTable) return;
        try {
            const { label, partials } = getSplitInfo(opts, partialPayments);
            await processPayment({ cartItems, operatorId: currentUser?.id ?? "unknown", tableId: selectedTableId, tenantId: activeTenantId ?? "restaurant-os", consumptionMode, partialPayments: partials });
            showToast(`Table ${currentTable.number} — ${label} & scellé NF525`, "success");
            handleClearCart();
            setSelectedTableId(null);
            setIsPaymentOpen(false);
            setIsSplitOpen(false);
            if (opts?.split) setPartialPayments([]);
            await updateTable(currentTable.id, { status: "dirty" });
        } catch (_error) { showToast("Transaction Échouée", "error"); }
    }, [currentTable, cartItems, currentUser, selectedTableId, activeTenantId, consumptionMode, partialPayments, handleClearCart, updateTable, showToast]);

    const handlePaymentComplete = useCallback(() => finalizePayment(), [finalizePayment]);

    const handleCheckout = useCallback(() => {
        if (cartItems.length === 0) return;
        setIsPaymentOpen(true);
    }, [cartItems]);

    const handlePaySplit = useCallback((amountInCents: number, guestIndex: number) => {
        setPartialPayments(prev => [...prev, { amount: amountInCents, guest: guestIndex }]);
        showToast(`Client ${guestIndex + 1} : ${amountInCents / 100}€ réglés et persistés`, "success");
    }, [showToast]);

    const handleSplitComplete = useCallback(() => finalizePayment({ split: true }), [finalizePayment]);

    /**
     * Assign or remove a course from a cart item (pos-3).
     */
    const handleSetItemCourse = useCallback((cartId: string, course: CourseType | undefined) => {
        setCartItems((prev) => updateCartItem(prev, cartId, { course }));
    }, []);

    /**
     * Fire a specific course to the kitchen (pos-3).
     * Only sends items matching the given course; marks them with sentAt.
     * Items already sent (sentAt set) are skipped to prevent double-firing.
     */
    const handleSendCourse = useCallback((course: CourseType) =>
        handleSendCourseImpl(course, cartItems, currentTable, currentUser, addOrder, updateTable, selectedTableId, setCartItems, showToast),
        [cartItems, currentTable, currentUser, addOrder, updateTable, selectedTableId, showToast]);

    return {
        // State
        selectedTableId,
        setSelectedTableId,
        selectedCategory,
        setSelectedCategory,
        categories: resolvedCategories,
        products: resolvedProducts,
        isLoading,
        isMobileCartOpen,
        setIsMobileCartOpen,
        isPaymentOpen,
        setIsPaymentOpen,
        isSplitOpen,
        setIsSplitOpen,
        cartItems,

        // Tip
        tipInMicrounits,
        setTipInMicrounits,

        // Consumption mode (T12)
        consumptionMode,
        setConsumptionMode,

        // Derived state
        currentTable,
        cartTotal,
        cartGrandTotal,
        cartCount,
        cartTvaInCents,

        // Actions
        handleAddToCart,
        handleUpdateQuantity,
        handleClearCart,
        handleApplyDiscount,
        handleApplyOffer,
        handleCancelItem,
        handleSendToKitchen,
        handlePaymentComplete,
        handleCheckout,
        handlePaySplit,
        handleSplitComplete,
        handleSetItemCourse,
        handleSendCourse,
        handleSetItemNote,
        handleSetItemConsumptionMode,
        handleToggleDoggyBag,
        partialPayments,
    };
}
