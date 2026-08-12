"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { useInventory } from './useInventory';
import { useActionPermission } from "@/kernel/hooks/useActionPermission";
import { Nexus } from "@/lib/nexus/NexusAdapter";

import type { StockItem } from '../types';

type InvTab = "stock" | "storage" | "rotating_count";

const TAB_ALIASES: Record<string, InvTab> = { stockage: "storage", stocks: "stock" };
const VALID_INV_TABS: InvTab[] = ["stock", "storage", "rotating_count"];

export function useInventoryPage() {
    const searchParams = useSearchParams();
    const rawTab = searchParams.get("tab") ?? "";
    const initTab: InvTab = VALID_INV_TABS.includes(rawTab as InvTab)
        ? (rawTab as InvTab)
        : (TAB_ALIASES[rawTab] ?? "stock");

    const [activeTab, setActiveTab] = useState<InvTab>(initTab);
    const [receptionOpen, setReceptionOpen] = useState(false);
    const [transferOpen, setTransferOpen] = useState(false);
    const [prepOpen, setPrepOpen] = useState(false);
    const [transferItem, setTransferItem] = useState<StockItem | undefined>(undefined);
    const [pinOpen, setPinOpen] = useState(false);
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const [editThresholdItem, setEditThresholdItem] = useState<StockItem | null>(null);
    const [physCountItem, setPhysCountItem] = useState<StockItem | null>(null);
    const [adjustItem, setAdjustItem] = useState<StockItem | null>(null);
    const [oracleItem, setOracleItem] = useState<StockItem | null>(null);

    const deletePermission = useActionPermission("inventory", "delete_item");
    const physCountPermission = useActionPermission("inventory", "physical_count");
    const adjustPermission = useActionPermission("inventory", "adjust_stock");

    const { stockItems, storageLocations, lowStockItems, isLoading } = useInventory();

    const openTransfer = (item?: StockItem) => {
        setTransferItem(item);
        setTransferOpen(true);
    };

    const handleDeleteClick = (item: StockItem) => {
        if (!deletePermission.allowed) { toast.error(deletePermission.reason ?? "Accès refusé."); return; }
        if (deletePermission.requiresPin) {
            setPendingDeleteId(item.id);
            setPinOpen(true);
        } else {
            void executeDelete(item.id);
        }
    };

    const handlePinSuccess = () => {
        if (pendingDeleteId) {
            void executeDelete(pendingDeleteId);
            setPendingDeleteId(null);
        }
    };

    const executeDelete = async (id: string) => {
        try {
            await Nexus.adapter.delete(`stockItems/${id}`);
            toast.success("Article supprimé.");
        } catch {
            toast.error("Erreur lors de la suppression.");
        }
    };

    const handlePhysCountClick = (item: StockItem) => {
        if (!physCountPermission.allowed) { toast.error(physCountPermission.reason ?? "Accès refusé."); return; }
        setPhysCountItem(item);
    };

    const handleAdjustClick = (item: StockItem) => {
        if (!adjustPermission.allowed) { toast.error(adjustPermission.reason ?? "Accès refusé."); return; }
        setAdjustItem(item);
    };

    return {
        // tab
        activeTab, setActiveTab,
        // modals open state
        receptionOpen, setReceptionOpen,
        transferOpen, setTransferOpen,
        transferItem,
        prepOpen, setPrepOpen,
        pinOpen, setPinOpen, setPendingDeleteId,
        editThresholdItem, setEditThresholdItem,
        physCountItem, setPhysCountItem,
        adjustItem, setAdjustItem,
        oracleItem, setOracleItem,
        // permissions
        deletePermission, physCountPermission, adjustPermission,
        // data
        stockItems, storageLocations, lowStockItems, isLoading,
        // handlers
        openTransfer,
        handleDeleteClick,
        handlePinSuccess,
        handlePhysCountClick,
        handleAdjustClick,
    };
}
