"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useOrders, useTables, useProducts, useCategories } from "@/engines/ops/NexusOpsProvider";
import { useAuth, useTenant } from "@/engines/core/NexusCoreProvider";
import { processPaymentAction } from '@/app/(admin)/actions/transactions';

import { useToast } from "@/components/ui/Toast";
import { Table, Category, Product } from "@/types";
import { CartItem, OrderItem } from "@/modules/ops/types";
import { POSService } from "@/lib/pos-service";
import { BlockchainLedger } from "@/lib/blockchain-ledger";




export function usePOSController() {
    const { currentUser } = useAuth();
    const { tables, updateTable } = useTables();
    const { submitOrder: addOrder } = useOrders();
    const { data: products, isLoading: productsLoading } = useProducts();
    const { data: categories, isLoading: categoriesLoading } = useCategories();

    const { showToast } = useToast();

    // --- POS STATE ---
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
