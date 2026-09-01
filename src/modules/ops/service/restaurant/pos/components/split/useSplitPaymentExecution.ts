"use client";

import { useState } from "react";
import { terminalService } from "../../infrastructure/payment-terminal/PaymentTerminalService";
import { printerService } from "../../../../core/printing";
import { NexusEventBus } from "@/shared/eventBus/NexusEventBus";
import { useTenant } from "@/shared/hooks/useTenant";
import type { PaymentMethod } from "./types";

interface UseSplitPaymentExecutionProps {
    onPaySplit: (amountInMicrounits: number, conviveIndex: number) => void;
}

export function useSplitPaymentExecution({ onPaySplit }: UseSplitPaymentExecutionProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [terminalState, setTerminalState] = useState<'idle' | 'pending' | 'manual_wait' | 'error'>('idle');
    const [terminalError, setTerminalError] = useState<string | null>(null);

    const { activeTenantId } = useTenant();

    const executeCardPayment = async (amountInMicrounits: number, conviveIndex: number): Promise<boolean> => {
        setIsProcessing(true);
        setTerminalState('pending');
        setTerminalError(null);

        const defaultDevice = terminalService.getDefault();
        const orderId = `SPLIT_${Date.now()}_C${conviveIndex}`;
        try {
            if (defaultDevice?.adapter === "manual") {
                setTerminalState("manual_wait");
                if (terminalService.getStatus(defaultDevice.id) === "disconnected") {
                    await terminalService.connect(defaultDevice.id);
                }
            }

            const result = await terminalService.charge({
                amountInMicrounits,
                orderId,
                description: `Split Table`,
            });

            if (result.status !== "approved") {
                setTerminalState(result.status === "cancelled" ? "idle" : "error");
                if (result.status === "error") setTerminalError(result.error ?? "Paiement refusé");
                setIsProcessing(false);
                // AUDIT LM 2026-08-30 P1-D : réveiller PaymentRejectAuditHandler
                // (audit local des refus TPE côté POS — distinct de Stripe
                // webhook qui émet finance.payment_failed pour les online).
                if (activeTenantId && result.status !== "cancelled") {
                    NexusEventBus.emit('payment.rejected', {
                        v: 1,
                        tenantId: activeTenantId,
                        orderId,
                        reason: result.error ?? result.status,
                        amountInMicrounits,
                    }).catch(() => { /* non-bloquant */ });
                }
                return false;
            }
            return true;
        } catch (err) {
            setTerminalState("error");
            setTerminalError(err instanceof Error ? err.message : "Erreur terminal");
            setIsProcessing(false);
            if (activeTenantId) {
                NexusEventBus.emit('payment.rejected', {
                    v: 1,
                    tenantId: activeTenantId,
                    orderId,
                    reason: err instanceof Error ? err.message : "Erreur terminal",
                    amountInMicrounits,
                }).catch(() => { /* non-bloquant */ });
            }
            return false;
        }
    };

    const executePayment = async (
        amountInMicrounits: number,
        conviveIndex: number,
        method: PaymentMethod
    ): Promise<boolean> => {
        if (method === 'card') {
            const success = await executeCardPayment(amountInMicrounits, conviveIndex);
            if (!success) return false;
        } else if (method === 'cash') {
            printerService.openCashDrawer();
        }

        setIsProcessing(false);
        setTerminalState('idle');
        onPaySplit(amountInMicrounits, conviveIndex);
        return true;
    };

    return {
        isProcessing,
        terminalState,
        terminalError,
        setTerminalState,
        executePayment,
    };
}
