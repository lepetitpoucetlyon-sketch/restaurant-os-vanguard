import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useSetAtom } from "jotai";
import { activeCartAtom } from "../store/orderAtoms";
import { useOrders } from '../../../../providers/hooks/kitchenHooks';
import { useTables } from '../../../../providers/hooks/floorHooks';
import { useProducts, useCategories } from '../../../../providers/hooks/catalogHooks';
import { useAuth, useTenant } from "@/shared/providers/NexusCoreProvider";
import { useToast } from "@components/ui/Toast";
import { Table, OrderItem } from "@nexus/contracts";
import { toMicrounits } from "@/shared/schemas/primitives";
import { CartItem, CourseType, SovereignProduct } from "../../../../workflow/engine/types";
import { applyItemDiscount, applyItemOffer } from "../domain/cartDiscounts";
import type { ConsumptionMode } from "../../../../workflow/engine/types";
import { POSService } from "../domain";

// Pure helpers (zéro effets de bord)
import {
    buildModifiers,
    buildCartItem,
    updateItemQuantity,
    updateCartItem,
    canCancelSentItem,
    hasPermission,
    resolveServerName,
    getSplitInfo,
    computeCartTva,
} from "./posHelpers";

// Orchestration async (Nexus + NF525 + EventBus)
import {
    processPayment,
    submitKitchenOrder,
    handleSendCourseImpl,
} from "./posOrderSubmit";

/**
 * usePOSController — Hook principal du POS.
 * Gère l'état du panier, le flux de paiement, les remises, les offres, les pourboires et les annulations.
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

    // ── État POS ──────────────────────────────────────────────────────────────
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isSplitOpen, setIsSplitOpen] = useState(false);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [tipInMicrounits, setTipInMicrounits] = useState<number>(0);
    const [consumptionMode, setConsumptionMode] = useState<ConsumptionMode>('dine_in');
    const [partialPayments, setPartialPayments] = useState<{ amountInMicrounits: number; guest: number; method?: string }[]>([]);

    const isLoading = productsLoading || categoriesLoading;
    const resolvedTables = tables ?? [];
    const resolvedCategories = categories ?? [];
    const resolvedProducts = products ?? [];

    // ── Dérivés ───────────────────────────────────────────────────────────────
    const currentTable = useMemo(() =>
        resolvedTables.find((t: Table) => t.id === selectedTableId),
        [resolvedTables, selectedTableId]);

    /** Sous-total panier (hors pourboire). Reflète les remises par article. */
    const cartTotal = useMemo(() => POSService.calculateCartTotal(cartItems), [cartItems]);

    /** Total TTC incluant le pourboire */
    const cartGrandTotal = useMemo(() => toMicrounits(cartTotal + tipInMicrounits), [cartTotal, tipInMicrounits]);

    const cartCount = useMemo(() => cartItems.reduce((sum, item) => sum + item.quantity, 0), [cartItems]);

    const cartTvaInCents = useMemo(() => computeCartTva(cartItems), [cartItems]);

    // Sync vers activeCartAtom pour posCartCountSelector / posCartTotalSelector
    useEffect(() => {
        setActiveCart(cartItems.length > 0 ? { items: cartItems as unknown as OrderItem[] } : null);
    }, [cartItems, setActiveCart]);

    // ── Actions ───────────────────────────────────────────────────────────────

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
     * Applique un pourcentage de remise à un article du panier.
     * Conserve le prix original pour l'affichage barré.
     */
    const handleApplyDiscount = useCallback((cartId: string, percent: number) => {
        setCartItems((prev) => prev.map((item) => item.cartId === cartId ? applyItemDiscount(item, percent) : item));
        showToast(`Remise ${percent}% appliquée`, "success");
    }, [showToast]);

    const handleApplyOffer = useCallback((cartId: string) => {
        if (!hasPermission(hasAccess, 'operations.pos.offer')) {
            showToast("Accès refusé : Autorisation Manager requise", "error");
            return;
        }
        setCartItems((prev) => prev.map((item) => item.cartId === cartId ? applyItemOffer(item) : item));
        showToast("Article offert", "success");
    }, [showToast, hasAccess]);

    const handleCancelItem = useCallback((cartId: string) => {
        if (!canCancelSentItem(cartItems.find(i => i.cartId === cartId), hasAccess)) {
            showToast("Accès refusé : Ce plat est déjà en préparation", "error");
            return;
        }
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
        setCartItems((prev) => prev.map((item) =>
            item.cartId !== cartId ? item : { ...item, doggyBag: !item.doggyBag }
        ));
    }, []);

    const handleSendToKitchen = useCallback(async () => {
        if (cartItems.length === 0 || !currentTable) return;
        // 🛡️ LOT F fail-closed : refuser l'envoi cuisine sans tenant ancré.
        // Écrire dans 'default' scellerait dans un tenant fantôme (P1-11).
        if (!activeTenantId) {
            showToast("Envoi impossible : contexte tenant absent. Reconnectez-vous.", "error");
            return;
        }
        try {
            await submitKitchenOrder(
                {
                    tableId: currentTable.id,
                    tableNumber: currentTable.number,
                    serverName: resolveServerName(currentUser),
                    items: POSService.formatForKitchen(cartItems) as OrderItem[],
                },
                addOrder, updateTable, selectedTableId, activeTenantId
            );
            showToast(`Table ${currentTable.number} : Commande envoyée`, "success");
            setCartItems([]);
        } catch (_error) {
            showToast("Erreur lors de l'envoi en cuisine", "error");
        }
    }, [cartItems, currentTable, currentUser, addOrder, updateTable, selectedTableId, showToast, activeTenantId]);

    const finalizePayment = useCallback(async (opts?: { split?: boolean }) => {
        if (!currentTable) return;
        // 🛡️ LOT F fail-closed : refuser l'encaissement/sceau NF525 sans tenant.
        // Sceller dans 'restaurant-os' fabrique un ticket fiscal orphelin (P1-11).
        if (!activeTenantId) {
            showToast("Encaissement impossible : contexte tenant absent. Reconnectez-vous.", "error");
            return;
        }
        try {
            const { label, partials } = getSplitInfo(opts, partialPayments);
            await processPayment({
                cartItems,
                operatorId: currentUser?.id ?? "unknown",
                tableId: selectedTableId,
                tenantId: activeTenantId,
                consumptionMode,
                partialPayments: partials,
            });
            showToast(`Table ${currentTable.number} — ${label} & scellé NF525`, "success");
            handleClearCart();
            setSelectedTableId(null);
            setIsPaymentOpen(false);
            setIsSplitOpen(false);
            if (opts?.split) setPartialPayments([]);
            // PLAN LOGIQUE MÉTIER LOT D — cycle de vie table :
            // paying → dirty (paiement finalisé) + émission table.released
            // pour que TableTurnoverAnalyzerHandler ferme le chronomètre
            // de rotation démarré à table.assigned (arrivée client).
            await updateTable(currentTable.id, { status: "dirty" });
            await NexusEventBus.emitDurable('table.released', {
                v: 1,
                tenantId: activeTenantId,
                tableId: currentTable.id,
            });
        } catch (_error) {
            showToast("Transaction Échouée", "error");
        }
    }, [currentTable, cartItems, currentUser, selectedTableId, activeTenantId, consumptionMode, partialPayments, handleClearCart, updateTable, showToast]);

    const handlePaymentComplete = useCallback(() => finalizePayment(), [finalizePayment]);

    const handleCheckout = useCallback(() => {
        if (cartItems.length === 0) return;
        setIsPaymentOpen(true);
    }, [cartItems]);

    const handlePaySplit = useCallback((amountInMicrounits: number, guestIndex: number) => {
        setPartialPayments(prev => [...prev, { amountInMicrounits, guest: guestIndex }]);
        showToast(`Client ${guestIndex + 1} : ${(amountInMicrounits / 1_000_000).toFixed(2)}€ réglés et persistés`, "success");
    }, [showToast]);

    const handleSplitComplete = useCallback(() => finalizePayment({ split: true }), [finalizePayment]);

    /** Affecte ou retire un service à un article (pos-3). */
    const handleSetItemCourse = useCallback((cartId: string, course: CourseType | undefined) => {
        setCartItems((prev) => updateCartItem(prev, cartId, { course }));
    }, []);

    /**
     * Envoie un service en cuisine (pos-3).
     * Seuls les articles du service non encore envoyés (sentAt absent) partent.
     */
    const handleSendCourse = useCallback((course: CourseType) => {
        if (!activeTenantId) {
            showToast("Envoi cours impossible : contexte tenant absent.", "error");
            return Promise.resolve();
        }
        return handleSendCourseImpl(
            course, cartItems, currentTable, currentUser,
            addOrder, updateTable, selectedTableId,
            setCartItems, showToast as never, activeTenantId!
        );
    },
        [cartItems, currentTable, currentUser, addOrder, updateTable, selectedTableId, showToast, activeTenantId]
    );

    return {
        // State
        selectedTableId, setSelectedTableId,
        selectedCategory, setSelectedCategory,
        categories: resolvedCategories,
        products: resolvedProducts,
        isLoading,
        isMobileCartOpen, setIsMobileCartOpen,
        isPaymentOpen, setIsPaymentOpen,
        isSplitOpen, setIsSplitOpen,
        cartItems,

        // Tip
        tipInMicrounits, setTipInMicrounits,

        // Consumption mode (T12)
        consumptionMode, setConsumptionMode,

        // Dérivés
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
