"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { usePOSController } from "@modules/ops";
import { useKitchen, useTables } from "@/engines/ops/NexusOpsProvider";
import { useAuth, useTenant } from "@/engines/core/NexusCoreProvider";
import { useIsMobile } from "@/hooks";
import { useAmbiance, useTabletMode, usePrintReceipt, useRbacGate } from "../_posSlices";
import { useActionPermission } from "@/hooks/useActionPermission";
import { useStockAlerts } from "../useStockAlerts";
import type { CartItem } from "@modules/ops/engine/types";
import type { PendingAction } from "./useRbacGate";

export function usePosPage() {
    const isMobile = useIsMobile();
    const { orders: _orders } = useKitchen();
    const { verifyPin, currentUser: posUser } = useAuth();
    const { activeTenantId } = useTenant();
    const { nodes: allTables } = useTables();

    const { ambiance, tokens } = useAmbiance();
    const { isTabletMode, setIsTabletMode, isTablePickerOpen, setIsTablePickerOpen } = useTabletMode();

    const posController = usePOSController();
    const {
        selectedTableId, setSelectedTableId,
        cartItems, cartTotal, cartCount: _cartCount,
        handleApplyDiscount, handleApplyOffer, handleCancelItem,
        handleCheckout,
        setTipInMicrounits,
        handleSetItemNote,
    } = posController;

    const searchParams = useSearchParams();
    useEffect(() => {
        const tableParam = searchParams.get("table");
        if (tableParam) setSelectedTableId(tableParam);
    }, [searchParams, setSelectedTableId]);

    const outOfStockIds = useStockAlerts();

    const refundPerm   = useActionPermission("pos", "refund");
    const offerPerm    = useActionPermission("pos", "offer_product");
    const cancelPerm   = useActionPermission("pos", "cancel_item_sent");
    const discountPerm = useActionPermission("pos", "apply_discount_percent");

    const [contextMenuItem, setContextMenuItem] = useState<CartItem | null>(null);
    const [customDiscountValue, setCustomDiscountValue] = useState("");
    const [noteValue, setNoteValue] = useState("");
    const [isTipPanelOpen, setIsTipPanelOpen]   = useState(false);
    const [isCashDrawerOpen, setIsCashDrawerOpen] = useState(false);
    const [isVoidModalOpen, setIsVoidModalOpen]   = useState(false);
    const [isCourseViewOpen, setIsCourseViewOpen] = useState(false);

    const executeAction = useCallback(
        (action: PendingAction) => {
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

    const { pendingAction, pinError, handleProtectedAction, handlePinConfirm, handlePinClose } =
        useRbacGate(
            { discount: discountPerm, offer: offerPerm, cancel: cancelPerm, refund: refundPerm },
            executeAction,
            verifyPin,
        );

    const handlePrintReceipt = usePrintReceipt(cartItems, cartTotal);

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

    const isRushMode    = ambiance === "RUSH_SPEED";
    const isCartSidebar = !isMobile && !isTabletMode;
    const pinModalTitle = pendingAction
        ? pendingAction.type === "offer"   ? "Autoriser l'offre"
        : pendingAction.type === "cancel"  ? "Autoriser l'annulation"
        : pendingAction.type === "refund"  ? "Autoriser le remboursement"
        : "Autoriser la remise"
        : "";

    return {
        isMobile, activeTenantId, posUser, allTables,
        ambiance, tokens, isRushMode,
        isTabletMode, setIsTabletMode, isTablePickerOpen, setIsTablePickerOpen,
        ...posController,
        isCartSidebar,
        outOfStockIds,
        refundPerm, offerPerm, cancelPerm, discountPerm,
        contextMenuItem, setContextMenuItem,
        customDiscountValue, setCustomDiscountValue,
        noteValue, setNoteValue,
        isTipPanelOpen, setIsTipPanelOpen,
        isCashDrawerOpen, setIsCashDrawerOpen,
        isVoidModalOpen, setIsVoidModalOpen,
        isCourseViewOpen, setIsCourseViewOpen,
        pendingAction, pinError, handleProtectedAction, handlePinConfirm, handlePinClose,
        pinModalTitle,
        handlePrintReceipt,
        handleCheckoutWithTip,
        handleTipConfirmed,
        handleTipSkipped,
        handleItemContextMenu,
        handleDiscountPreset,
        handleDiscountCustom,
        handleSetItemNote,
    };
}
