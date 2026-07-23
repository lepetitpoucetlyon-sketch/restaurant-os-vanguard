"use client";

import { useState, useCallback, useMemo } from "react";
import { useOrders, useTables, useProducts, useCategories } from "@/engines/ops/NexusOpsProvider";
import { useAuth, useTenant } from "@/engines/core/NexusCoreProvider";
import { useToast } from "@/components/ui/Toast";
import { Table, OrderItem } from "@nexus/contracts";
import { toMicrounits, Microunits } from "@/domain/schemas/primitives";
import { CartItem, CourseType, SovereignProduct } from "../../engine/types";
import { FinancialNexusBridge } from "@/infrastructure/adapters/FinancialNexusBridge";
import { useStockDeduction } from "@modules/logistics/hooks/useStockDeduction";
import type { OrderLine } from "@/domain/schemas/orders";

import { POSService } from "../domain";

/**
 * usePOSController - The Primary POS Hook
 * Handles cart state, payment flow, discounts, offers, tips, and cancellations.
 */

export function usePOSController() {
    const { currentUser } = useAuth();
    const { activeTenantId } = useTenant();
    const { nodes: tables, updateTable } = useTables();
    const { add: addOrder } = useOrders();
    const { data: products, isLoading: productsLoading } = useProducts();
    const { data: categories, isLoading: categoriesLoading } = useCategories();

    const { showToast } = useToast();
    const { deductForOrder } = useStockDeduction();

    // --- POS STATE ---
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isSplitOpen, setIsSplitOpen] = useState(false);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);

    /** Tip selected before payment confirmation (in microunits) */
    const [tipInMicrounits, setTipInMicrounits] = useState<number>(0);

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

    // --- ACTIONS ---

    const handleAddToCart = useCallback((
        product: SovereignProduct,
        quantity: number,
        selectedOptions: Record<string, { name: string }[]>,
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
                ? Object.values(selectedOptions).flat().map((opt) => opt.name)
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
        setCartItems((prev) =>
            prev.map((item) => {
                if (item.cartId !== cartId) return item;

                // Use the stored original price if one already exists (re-applying discount)
                const originalPrice: Microunits =
                    item.originalPriceInMicrounits ?? item.unitPriceInMicrounits;

                if (percent === 0) {
                    // Remove discount — restore original price
                    return {
                        ...item,
                        unitPriceInMicrounits: originalPrice,
                        discountInMicrounits: toMicrounits(0),
                        discountPercent: undefined,
                        originalPriceInMicrounits: undefined,
                    };
                }

                const discountMicro = toMicrounits(
                    Math.round((originalPrice * percent) / 100)
                );
                const discountedPrice = toMicrounits(originalPrice - discountMicro);

                return {
                    ...item,
                    originalPriceInMicrounits: originalPrice,
                    unitPriceInMicrounits: discountedPrice,
                    discountInMicrounits: discountMicro,
                    discountPercent: percent,
                };
            })
        );
        showToast(`Remise ${percent}% appliquée`, "success");
    }, [showToast]);

    /**
     * Mark a cart item as an offer (management comp — sets price to 0).
     * Requires pos.offer_product permission (checked by caller via RBAC).
     */
    const handleApplyOffer = useCallback((cartId: string) => {
        setCartItems((prev) =>
            prev.map((item) => {
                if (item.cartId !== cartId) return item;
                const originalPrice: Microunits =
                    item.originalPriceInMicrounits ?? item.unitPriceInMicrounits;
                return {
                    ...item,
                    originalPriceInMicrounits: originalPrice,
                    unitPriceInMicrounits: toMicrounits(0),
                    discountInMicrounits: originalPrice,
                    discountPercent: 100,
                    isOffer: true,
                };
            })
        );
        showToast("Article offert", "success");
    }, [showToast]);

    /**
     * Remove / void a cart item.
     * Requires pos.cancel_item_sent permission (checked by caller via RBAC).
     */
    const handleCancelItem = useCallback((cartId: string) => {
        setCartItems((prev) => prev.filter((item) => item.cartId !== cartId));
        showToast("Article annulé", "success");
    }, [showToast]);

    const handleSetItemNote = useCallback((cartId: string, note: string) => {
        setCartItems((prev) =>
            prev.map((item) => item.cartId !== cartId ? item : { ...item, notes: note || undefined })
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
            });

            // pos-4: déduction stock cascade — parcourt les recettes des produits vendus,
            // décrémente les ingrédients dans stockItems, alerte sur les seuils bas.
            // Volontairement fire-and-log : un échec de déduction ne doit pas annuler
            // un paiement déjà scellé fiscalement (NF525 immuable).
            const orderLines = cartItems.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
            })) as unknown as OrderLine[];
            deductForOrder(orderLines).catch(err => {
                showToast("Stock non déduit — voir console", "error");
                console.error("[usePOS] stock deduction failed", err);
            });

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
    }, [currentTable, cartItems, currentUser, selectedTableId, activeTenantId, deductForOrder, handleClearCart, updateTable, showToast]);

    const handleCheckout = useCallback(() => {
        if (cartItems.length === 0) return;
        setIsPaymentOpen(true);
    }, [cartItems]);

    const handlePaySplit = useCallback((amountInCents: number, guestIndex: number) => {
        showToast(`Client ${guestIndex + 1} : ${amountInCents / 100}€ réglés`, "success");
    }, [showToast]);

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

        // Derived state
        currentTable,
        cartTotal,
        cartGrandTotal,
        cartCount,

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
        handleSetItemCourse,
        handleSendCourse,
        handleSetItemNote,
    };
}
