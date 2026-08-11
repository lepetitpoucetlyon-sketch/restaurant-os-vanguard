import { useState, useCallback } from "react";
import { terminalService } from "@/modules/ops/service/pos/infrastructure/payment-terminal/PaymentTerminalService";
import { printerService } from "@/modules/ops/service/printers/hardware/PrintingService";
import { PaymentMethod } from "./useSplitBillState";

export type TerminalState = 'idle' | 'pending' | 'manual_wait' | 'error';

interface UsePaymentTerminalProps {
    onPaymentSuccess: (amount: number, conviveIndex: number, method: PaymentMethod) => void;
}

export function usePaymentTerminal({ onPaymentSuccess }: UsePaymentTerminalProps) {
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [terminalState, setTerminalState] = useState<TerminalState>('idle');
    const [terminalError, setTerminalError] = useState<string | null>(null);

    const resetTerminal = useCallback(() => {
        setSelectedPaymentMethod(null);
        setIsProcessing(false);
        setTerminalState('idle');
        setTerminalError(null);
    }, []);

    const processPayment = useCallback(async (
        payingConvive: number,
        amountInCents: number,
        onPaySplit: (amount: number, conviveIndex: number) => void
    ) => {
        if (selectedPaymentMethod === null) return;

        if (selectedPaymentMethod === 'card') {
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
                    orderId: `SPLIT_${Date.now()}_C${payingConvive}`,
                    description: `Split Table`,
                });

                if (result.status !== "approved") {
                    setTerminalState(result.status === "cancelled" ? "idle" : "error");
                    if (result.status === "error") setTerminalError(result.error ?? "Paiement refusé");
                    setIsProcessing(false);
                    return;
                }
            } catch (err) {
                setTerminalState("error");
                setTerminalError(err instanceof Error ? err.message : "Erreur terminal");
                setIsProcessing(false);
                return;
            }
        } else if (selectedPaymentMethod === 'cash') {
            printerService.openCashDrawer();
        }

        // Success
        setIsProcessing(false);
        setTerminalState('idle');
        onPaySplit(amountInCents, payingConvive);
        onPaymentSuccess(amountInCents, payingConvive, selectedPaymentMethod);
        setSelectedPaymentMethod(null);
    }, [selectedPaymentMethod, onPaymentSuccess]);

    return {
        selectedPaymentMethod,
        setSelectedPaymentMethod,
        isProcessing,
        terminalState,
        setTerminalState,
        terminalError,
        resetTerminal,
        processPayment,
    };
}
