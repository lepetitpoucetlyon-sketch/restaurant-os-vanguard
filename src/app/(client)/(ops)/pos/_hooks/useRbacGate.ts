"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";

export type PendingAction =
    | { type: "offer";    cartId: string }
    | { type: "cancel";   cartId: string }
    | { type: "refund";   cartId: string }
    | { type: "discount"; cartId: string; percent: number };

type Permission = { allowed: boolean; requiresPin: boolean; reason?: string };

interface RbacPermissions {
    discount: Permission;
    offer:    Permission;
    cancel:   Permission;
    refund:   Permission;
}

export function useRbacGate(
    permissions: RbacPermissions,
    executeAction: (action: PendingAction) => void,
    verifyPin: ((pin: string) => Promise<boolean>) | undefined,
) {
    const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
    const [pinError, setPinError]           = useState<string | undefined>();

    const handleProtectedAction = useCallback(
        (action: PendingAction) => {
            let perm: Permission;
            if      (action.type === "discount") perm = permissions.discount;
            else if (action.type === "offer")    perm = permissions.offer;
            else if (action.type === "cancel")   perm = permissions.cancel;
            else                                 perm = permissions.refund;

            if (!perm.allowed) {
                toast.error(`Accès refusé — ${perm.reason ?? "Niveau insuffisant"}`);
                return;
            }
            if (perm.requiresPin) {
                setPendingAction(action);
                setPinError(undefined);
                return;
            }
            executeAction(action);
        },
        [permissions, executeAction]
    );

    const handlePinConfirm = useCallback(
        async (pin: string) => {
            const ok = verifyPin ? await verifyPin(pin) : false;
            if (!ok) { setPinError("PIN incorrect. Réessayez."); return; }
            setPinError(undefined);
            if (pendingAction) executeAction(pendingAction);
            setPendingAction(null);
        },
        [verifyPin, pendingAction, executeAction]
    );

    const handlePinClose = useCallback(() => {
        setPendingAction(null);
        setPinError(undefined);
    }, []);

    return { pendingAction, pinError, handleProtectedAction, handlePinConfirm, handlePinClose };
}
