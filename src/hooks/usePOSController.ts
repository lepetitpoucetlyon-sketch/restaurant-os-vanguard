// @ts-nocheck
// @ts-nocheck
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useOrders, useTables, useProducts, useCategories } from "@/engines/ops/NexusOpsProvider";
import { useAuth, useTenant } from "@/engines/core/NexusCoreProvider";
import { processPaymentAction } from "@/app/actions/transactions";

import { useToast } from "@/components/ui/Toast";
import { Table, Category, Product } from "@/types";
import { POSService } from "@/lib/pos-service";
import { BlockchainLedger } from "@/lib/blockchain-ledger";


export interface CartItem {
    cartId: string;
    productId: string;
    categoryId: string;
    name: string;
    priceInCents: number;
    quantity: number;
    modifiers?: string[];
    notes?: string;
}

export function usePOSController() {
    const { currentUser } = useAuth();
    const { data: tables, updateTable } = useTables() as any;
    const { addOrder } = useOrders() as any;
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
        tables.find(t => t.id === selectedTableId),
        [tables, selectedTableId]);

    const cartTotal = useMemo(() =>
        POSService.calculateCartTotal(cartItems),
        [cartItems]);

    const cartCount = useMemo(() =>
        cartItems.reduce((sum, item) => sum + item.quantity, 0),
        [cartItems]);

    // --- ACTIONS ---

    const handleAddToCart = useCallback((product: any, quantity: number, selectedOptions: any, note?: string) => {
        const cartId = `${product.id}-${Date.now()}`;
        const newItem: CartItem = {
            cartId,
            productId: product.id,
            categoryId: product.categoryId,
            name: product.name,
            priceInCents: product.priceInCents,
            quantity,
            modifiers: Object.values(selectedOptions).flat().map((opt: any) => opt.name),
            notes: note
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
                tableNumber: currentTable.number,
                serverName: currentUser?.name || 'Serveur',
                items: POSService.formatForKitchen(cartItems),
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

    const { activeTenantId } = useTenant();

    const handlePaymentComplete = useCallback(async () => {
        if (!currentTable || !activeTenantId) return;

        // --- TRANSITION STATE ---
        const localItems = [...cartItems];
        
        try {
            // --- SERVER ACTION : THE DEEP WIRING ---
            const result = await processPaymentAction(activeTenantId, {
                id: `order_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                tableId: currentTable.id,
                tableNumber: currentTable.number,
                serverName: currentUser?.name || 'Serveur',
                items: POSService.formatForKitchen(localItems),
                totalInCents: cartTotal,
                status: 'paid'
            });

            if (result.success) {
                showToast(`Paiement NF525 certifié: ${result.hash.substring(0, 12)}...`, "success");
                
                // We keep the modal open to show the success hash inside PaymentDialog
                // and clear state after
                handleClearCart();
                setSelectedTableId(null);
                
                return result.hash;
            }

        } catch (error) {
            showToast("Transaction Échouée: Intégrité préservée sur le serveur.", "error");
            console.error(error);
            throw error;
        }
    }, [currentTable, activeTenantId, cartItems, cartTotal, currentUser, showToast, handleClearCart]);



    // --- ORACLE AI INTEGRATION ---
    useEffect(() => {
        const handleAIAction = (e: any) => {
            const { name, args } = e.detail;

            if (name === "addOrderItems" && selectedTableId) {
                const aiTable = tables.find(t => t.number.toString() === args.tableNumber?.toString());

                if (aiTable && aiTable.id === selectedTableId) {
                    const newItem: CartItem = {
                        cartId: `ai-${Date.now()}-${Math.random()}`,
                        productId: 'custom-ai-item',
                        categoryId: 'other',
                        name: args.productName,
                        priceInCents: 0,
                        quantity: args.quantity,
                        notes: args.specialRequest ? `⚠️ ${args.specialRequest}` : ''
                    };
                    setCartItems(prev => [...prev, newItem]);
                    showToast(`${args.quantity}x ${args.productName} ajoutés par l'Oracle`, "success");
                }
            }
        };

        window.addEventListener('ai_action_executed', handleAIAction);
        return () => window.removeEventListener('ai_action_executed', handleAIAction);
    }, [selectedTableId, tables, showToast]);

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
        categories,
        products,
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
