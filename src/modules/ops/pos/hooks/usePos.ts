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

    // --- DERIVED STATE ---
    const currentTable = useMemo(() =>
        (tables || []).find((t: Table) => t.id === selectedTableId),
        [tables, selectedTableId]);

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

    /** TVA réelle du panier en cents (multi-taux : food 10/5.5%, alcool 20%). */
    const cartTvaInCents = useMemo(() => {
        let tvaMu = 0;
        for (const item of cartItems) {
            const rate = parseFloat(String(item.taxRate ?? '0.10'));
            const ttcMu = item.unitPriceInMicrounits * item.quantity - (item.discountInMicrounits ?? 0);
            tvaMu += ttcMu - Math.round(ttcMu / (1 + rate));
        }
        return Math.round(tvaMu / 10_000); // µ → cents
    }, [cartItems]);

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
        const cartId = `${product.id}-${Date.now()}`;
        const newItem: CartItem = {
            cartId,
            productId: product.id,
            categoryId: product.categoryId || "other",
            name: product.name,
            unitPriceInMicrounits: product.priceInMicrounits || toMicrounits((product.priceInCents || 0) * 10000),
            discountInMicrounits: toMicrounits(0),
            taxRate: product.taxRate || "0.10",
            quantity,
            modifiers: selectedOptions
                ? Object.values(selectedOptions).flat().map((opt) => ({
                    id: opt.id || `${Date.now()}-${Math.random()}`,
                    name: opt.name,
                    action: opt.action || 'add',
                    ingredientId: opt.ingredientId,
                    quantityImpact: opt.quantityImpact
                }))
                : [],
            notes: note || "",
        };
        setCartItems((prev) => [...prev, newItem]);
        showToast(`${product.name} ajouté`, "success");
    }, [showToast]);

    const handleUpdateQuantity = useCallback((cartId: string, delta: number) => {
        setCartItems((prev) =>
            prev
                .map((item) =>
                    item.cartId === cartId
                        ? { ...item, quantity: Math.max(0, item.quantity + delta) }
                        : item
                )
                .filter((item) => item.quantity > 0)
        );
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
        // Logique pure extraite → domain/cartDiscounts (dette-2)
        setCartItems((prev) =>
            prev.map((item) =>
                item.cartId === cartId ? applyItemDiscount(item, percent) : item
            )
        );
        showToast(`Remise ${percent}% appliquée`, "success");
    }, [showToast]);

    /**
     * Mark a cart item as an offer (management comp — sets price to 0).
     * Requires operations.pos.offer permission (checked by caller via RBAC).
     */
    const handleApplyOffer = useCallback((cartId: string) => {
        if (hasAccess && !hasAccess('operations.pos.offer')) {
            showToast("Accès refusé : Autorisation Manager requise", "error");
            return;
        }
        // Logique pure extraite → domain/cartDiscounts (dette-2)
        setCartItems((prev) =>
            prev.map((item) =>
                item.cartId === cartId ? applyItemOffer(item) : item
            )
        );
        showToast("Article offert", "success");
    }, [showToast, hasAccess]);

    /**
     * Remove / void a cart item.
     * Requires operations.pos.cancel_sent permission (checked by caller via RBAC).
     */
    const handleCancelItem = useCallback((cartId: string) => {
        const itemToCancel = cartItems.find(i => i.cartId === cartId);
        if (itemToCancel?.sentAt && hasAccess && !hasAccess('operations.pos.cancel_sent')) {
            showToast("Accès refusé : Ce plat est déjà en préparation", "error");
            return;
        }
        setCartItems((prev) => prev.filter((item) => item.cartId !== cartId));
        showToast("Article annulé", "success");
    }, [cartItems, showToast, hasAccess]);

    const handleSetItemNote = useCallback((cartId: string, note: string) => {
        setCartItems((prev) =>
            prev.map((item) => item.cartId !== cartId ? item : { ...item, notes: note || undefined })
        );
    }, []);

    const handleSetItemConsumptionMode = useCallback((cartId: string, mode: ConsumptionMode | undefined) => {
        setCartItems((prev) =>
            prev.map((item) => item.cartId !== cartId ? item : { ...item, consumptionMode: mode })
        );
    }, []);

    const handleToggleDoggyBag = useCallback((cartId: string) => {
        setCartItems((prev) =>
            prev.map((item) => item.cartId !== cartId ? item : { ...item, doggyBag: !item.doggyBag })
        );
    }, []);

    const handleSendToKitchen = useCallback(async () => {
        if (cartItems.length === 0 || !currentTable) return;

        try {
            await addOrder({
                tableId: currentTable.id,
                tableNumber: Number(currentTable.number) || 0,
                serverName: currentUser?.name || "Serveur",
                items: POSService.formatForKitchen(cartItems) as OrderItem[],
                status: "new",
            });

            showToast(`Table ${currentTable.number} : Commande envoyée`, "success");
            setCartItems([]);
            if (selectedTableId) {
                await updateTable(selectedTableId, { status: "ordered" });
            }
        } catch (_error) {
            showToast("Erreur lors de l'envoi en cuisine", "error");
        }
    }, [cartItems, currentTable, currentUser, addOrder, updateTable, selectedTableId, showToast]);

    const handlePaymentComplete = useCallback(async () => {
        if (!currentTable) return;

        try {
            const tenantId = activeTenantId ?? "restaurant-os";
            await FinancialNexusBridge.processOrder({
                cartItems,
                operatorId: currentUser?.id ?? "unknown",
                tableId: selectedTableId,
                tenantId,
                consumptionMode,
            });

            // Déduction stock : gérée par un SEUL chemin — le handler événementiel
            // `StockDeductionHandler` sur `order.paid` (émis par processOrder),
            // tenant-scoped et aligné sur le schéma (product.recipeId → recipe).
            // On a retiré l'ancien appel direct `deductForOrder` (chemins racine)
            // qui causait une DOUBLE déduction sur chaque paiement.

            showToast(
                `Table ${currentTable.number} — Paiement validé & scellé NF525`,
                "success"
            );
            handleClearCart();
            setSelectedTableId(null);
            setIsPaymentOpen(false);
            await updateTable(currentTable.id, { status: "dirty" });
        } catch (_error) {
            showToast("Transaction Échouée", "error");
        }
    }, [currentTable, cartItems, currentUser, selectedTableId, activeTenantId, consumptionMode, handleClearCart, updateTable, showToast]);

    const handleCheckout = useCallback(() => {
        if (cartItems.length === 0) return;
        setIsPaymentOpen(true);
    }, [cartItems]);

    // Partial payments state for resilient splitting
    const [partialPayments, setPartialPayments] = useState<{ amount: number, guest: number, method?: string }[]>([]);

    const handlePaySplit = useCallback((amountInCents: number, guestIndex: number) => {
        // Accusé de réception par convive (feedback UI). Le scellement fiscal de la
        // vente a lieu une seule fois, au terme du fractionnement, via handleSplitComplete.
        setPartialPayments(prev => [...prev, { amount: amountInCents, guest: guestIndex }]);
        showToast(`Client ${guestIndex + 1} : ${amountInCents / 100}€ réglés et persistés`, "success");
    }, [showToast]);

    /**
     * Clôture d'un paiement fractionné : une fois toutes les parts collectées,
     * on scelle la vente UNE seule fois (un ticket NF525 pour toute la table),
     * comme un paiement classique. Avant, le split ne persistait rien (simple toast).
     */
    const handleSplitComplete = useCallback(async () => {
        if (!currentTable) return;
        try {
            const tenantId = activeTenantId ?? "restaurant-os";
            await FinancialNexusBridge.processOrder({
                cartItems,
                operatorId: currentUser?.id ?? "unknown",
                tableId: selectedTableId,
                tenantId,
                consumptionMode,
                // On passe les partialPayments pour l'enregistrement fiscal final
                partialPayments,
            });
            showToast(
                `Table ${currentTable.number} — Paiement fractionné validé & scellé NF525`,
                "success"
            );
            handleClearCart();
            setSelectedTableId(null);
            setIsSplitOpen(false);
            setPartialPayments([]); // Reset partial payments
            await updateTable(currentTable.id, { status: "dirty" });
        } catch (_error) {
            showToast("Transaction Échouée", "error");
        }
    }, [currentTable, cartItems, currentUser, selectedTableId, activeTenantId, consumptionMode, partialPayments, handleClearCart, updateTable, showToast]);

    /**
     * Assign or remove a course from a cart item (pos-3).
     */
    const handleSetItemCourse = useCallback((cartId: string, course: CourseType | undefined) => {
        setCartItems((prev) =>
            prev.map((item) =>
                item.cartId === cartId ? { ...item, course } : item
            )
        );
    }, []);

    /**
     * Fire a specific course to the kitchen (pos-3).
     * Only sends items matching the given course; marks them with sentAt.
     * Items already sent (sentAt set) are skipped to prevent double-firing.
     */
    const handleSendCourse = useCallback(async (course: CourseType) => {
        const courseItems = cartItems.filter((i) => i.course === course && !i.sentAt);
        if (courseItems.length === 0 || !currentTable) return;
        try {
            await addOrder({
                tableId: currentTable.id,
                tableNumber: Number(currentTable.number) || 0,
                serverName: currentUser?.name || "Serveur",
                items: courseItems.map((item) => ({
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
                })) as OrderItem[],
                status: "new",
            });
            const now = Date.now();
            setCartItems((prev) =>
                prev.map((item) =>
                    item.course === course && !item.sentAt
                        ? { ...item, sentAt: now }
                        : item
                )
            );
            const courseLabel =
                course === "entree" ? "Entrées" : course === "plat" ? "Plats" : "Desserts";
            showToast(`${courseLabel} envoyés en cuisine`, "success");
            if (selectedTableId) {
                await updateTable(selectedTableId, { status: "ordered" });
            }
        } catch {
            showToast("Erreur lors de l'envoi du cours", "error");
        }
    }, [cartItems, currentTable, currentUser, addOrder, updateTable, selectedTableId, showToast]);

    return {
        // State
        selectedTableId,
        setSelectedTableId,
        selectedCategory,
        setSelectedCategory,
        categories: categories || [],
        products: products || [],
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
