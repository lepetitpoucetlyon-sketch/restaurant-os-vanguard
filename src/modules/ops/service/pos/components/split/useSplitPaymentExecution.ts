"use client";

import { useState } from "react";
import { terminalService } from "@/modules/ops/service/pos/infrastructure/payment-terminal/PaymentTerminalService";
import { printerService } from "@/modules/ops/service/printers/hardware/PrintingService";
import type { PaymentMethod } from "./types";

interface UseSplitPaymentExecutionProps {
    onPaySplit: (amountInCents: number, conviveIndex: number) => void;
}

export function useSplitPaymentExecution({ onPaySplit }: UseSplitPaymentExecutionProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [terminalState, setTerminalState] = useState<'idle' | 'pending' | 'manual_wait' | 'error'>('idle');
    const [terminalError, setTerminalError] = useState<string | null>(null);

    const executeCardPayment = async (amountInCents: number, conviveIndex: number): Promise<boolean> => {
        setIsProcessing(true);
        setTerminalState('pending');
        setTerminalError(null);

        const defaultDevice = terminalService.getDefault();
        try {
            if (defaultDevice?.adapter === "manual") {
                setTerminalState("manual_wait");
                if (terminalService.getStatus(defaultDevice.id) === "disconnected") {
                    await terminalService.connect(defaultDevice.id);
                }
            }

            const result = await terminalService.charge({
                amountInMicrounits: amountInCents * 10000,
                orderId: `SPLIT_${Date.now()}_C${conviveIndex}`,
                description: `Split Table`,
            });

            if (result.status !== "approved") {
                setTerminalState(result.status === "cancelled" ? "idle" : "error");
                if (result.status === "error") setTerminalError(result.error ?? "Paiement refusé");
                setIsProcessing(false);
                return false;
            }
            return true;
        } catch (err) {
            setTerminalState("error");
            setTerminalError(err instanceof Error ? err.message : "Erreur terminal");
            setIsProcessing(false);
            return false;
        }
    };

    const executePayment = async (
        amountInCents: number,
        conviveIndex: number,
        method: PaymentMethod
    ): Promise<boolean> => {
        if (method === 'card') {
            const success = await executeCardPayment(amountInCents, conviveIndex);
            if (!success) return false;
        } else if (method === 'cash') {
            printerService.openCashDrawer();
        }

        setIsProcessing(false);
        setTerminalState('idle');
        onPaySplit(amountInCents, conviveIndex);
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
