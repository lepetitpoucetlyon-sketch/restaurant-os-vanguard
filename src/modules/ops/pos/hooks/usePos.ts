"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useOrders, useTables, useProducts, useCategories } from "@/engines/ops/NexusOpsProvider";
import { useAuth } from "@/engines/core/NexusCoreProvider";
import { useToast } from "@/components/ui/Toast";
import { Table, Category, Product, OrderItem } from "@nexus/contracts";
import { toMicrounits } from "@/domain/schemas/primitives";
import { Nexus } from "@/lib/nexus/NexusAdapter";
import { CartItem, SovereignProduct } from "../../engine/types";

import { POSService } from "../domain";

/**
 * usePOSController - The Primary POS Hook
 */



export function usePOSController() {
    const { currentUser } = useAuth();
    const { nodes: tables, updateTable } = useTables();
    const { add: addOrder } = useOrders();
    const { data: products, isLoading: productsLoading } = useProducts();
    const { data: categories, isLoading: categoriesLoading } = useCategories();

    const { showToast } = useToast();

    // --- POS STATE ---
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isSplitOpen, setIsSplitOpen] = useState(false);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);

    const isLoading = productsLoading || categoriesLoading;

    // --- DERIVED STATE ---
    const currentTable = useMemo(() =>
        (tables || []).find((t: Table) => t.id === selectedTableId),
        [tables, selectedTableId]);

    const cartTotal = useMemo(() =>
        POSService.calculateCartTotal(cartItems),
        [cartItems]);

    const cartCount = useMemo(() =>
        cartItems.reduce((sum, item) => sum + item.quantity, 0),
        [cartItems]);

    // --- ACTIONS ---

    const handleAddToCart = useCallback((product: SovereignProduct, quantity: number, selectedOptions: Record<string, { name: string }[]>, note?: string) => {
        const cartId = `${product.id}-${Date.now()}`;
        const newItem: CartItem = {
            cartId,
            productId: product.id,
            categoryId: product.categoryId || 'other',
            name: product.name,
            unitPriceInMicrounits: product.priceInMicrounits || toMicrounits((product.priceInCents || 0) * 10000),
            discountInMicrounits: toMicrounits(0),
            taxRate: product.taxRate || "0.10",
            quantity,
            modifiers: selectedOptions ? Object.values(selectedOptions).flat().map((opt) => opt.name) : [],
            notes: note || ""
        };
        setCartItems(prev => [...prev, newItem]);
        showToast(`${product.name} ajouté`, "success");
    }, [showToast]);

    const handleUpdateQuantity = useCallback((cartId: string, delta: number) => {
        setCartItems(prev => prev.map(item =>
            item.cartId === cartId ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
        ).filter(item => item.quantity > 0));
    }, []);

    const handleClearCart = useCallback(() => setCartItems([]), []);

    const handleSendToKitchen = useCallback(async () => {
        if (cartItems.length === 0 || !currentTable) return;

        try {
            await addOrder({
                tableId: currentTable.id,
                tableNumber: Number(currentTable.number) || 0,
                serverName: currentUser?.name || 'Serveur',
                items: POSService.formatForKitchen(cartItems) as OrderItem[],
                status: 'new'
            });

            showToast(`Table ${currentTable.number} : Commande envoyée`, "success");
            setCartItems([]);
            if (selectedTableId) {
                await updateTable(selectedTableId, { status: 'ordered' });
            }
        } catch (error) {
            showToast("Erreur lors de l'envoi en cuisine", "error");
        }
    }, [cartItems, currentTable, currentUser, addOrder, updateTable, selectedTableId, showToast]);

    const handlePaymentComplete = useCallback(async () => {
        if (!currentTable) return;

        try {
            // TODO: Integrate FinancialNexusBridge here
            showToast("Paiement simulé - Suture FinancialBridge requise", "success");
            handleClearCart();
            setSelectedTableId(null);
            setIsPaymentOpen(false);
        } catch (error) {
            showToast("Transaction Échouée", "error");
        }
    }, [currentTable, handleClearCart, showToast]);

    const handleCheckout = useCallback(() => {
        if (cartItems.length === 0) return;
        setIsPaymentOpen(true);
    }, [cartItems]);

    const handlePaySplit = useCallback((amountInCents: number, guestIndex: number) => {
        showToast(`Client ${guestIndex + 1} : ${amountInCents / 100}€ réglés`, "success");
    }, [showToast]);

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

        // Derived state
        currentTable,
        cartTotal,
        cartCount,

        // Actions
        handleAddToCart,
        handleUpdateQuantity,
        handleClearCart,
        handleSendToKitchen,
        handlePaymentComplete,
        handleCheckout,
        handlePaySplit
    };
}
