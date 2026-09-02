"use client";

import { useState, useRef } from "react";
import { Loader2, Sparkles, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { Modal } from "@ui/Modal";
import { useLanguage } from "@/shared/hooks";
import { formatCurrency } from "@/lib/formatters";
import { terminalService } from "../infrastructure/payment-terminal/PaymentTerminalService";
import type { PaymentResult } from "../infrastructure/payment-terminal/types";
import { printerService } from "../../../core/printing";

import { PaymentSuccessView } from "./payment-dialog/PaymentSuccessView";
import { TerminalStatePanel, type TerminalState } from "./payment-dialog/TerminalStatePanel";
import { PaymentMethodSelector, type PaymentMethod } from "./payment-dialog/PaymentMethodSelector";
import { CashDrawerTriggerService } from "../services/CashDrawerTriggerService";
import { ExactChangeAssistanceService } from "../services/ExactChangeAssistanceService";
import { ChangeAsTipService } from "../services/ChangeAsTipService";
import { BilingualTipGratuityHelper } from "../services/BilingualTipGratuityHelper";
import { MealVoucherLimitGuard } from "../services/MealVoucherLimitGuard";
import { TpeReconciliationService } from "../services/TpeReconciliationService";

interface PaymentDialogProps {
    isOpen: boolean;
    total: number;
    tvaInMicrounits?: number;
    orderId?: string;
    tenantId?: string;
    operatorId?: string;
    onClose: () => void;
    onPaymentComplete: () => Promise<string | void>;
}

function applyHashIfPresent(hash: string | void, setCertifiedHash: (h: string) => void): void {
    if (hash) setCertifiedHash(hash);
}

export function PaymentDialog({ isOpen, total, tvaInMicrounits, orderId, tenantId, operatorId, onClose, onPaymentComplete }: PaymentDialogProps) {
    const [method, setMethod] = useState<PaymentMethod | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [certifiedHash, setCertifiedHash] = useState<string | null>(null);
    const [terminalState, setTerminalState] = useState<TerminalState>("idle");
    const [terminalError, setTerminalError] = useState<string | null>(null);
    const [cashReceived, setCashReceived] = useState("");
    const [changeAsTip, setChangeAsTip] = useState(false);
    const { t } = useLanguage();

    const manualAdapterRef = useRef<ReturnType<typeof terminalService.getManualAdapter>>(null);
    const defaultDeviceRef = useRef<string | null>(null);
    const lastTpeTxnRef = useRef<string | null>(null);

    if (!isOpen) return null;

    const tid = tenantId || 'unknown';
    const amountInMicrounits = total * 10_000;

    // Rendu de monnaie réel — calculé sur le montant effectivement reçu.
    const receivedMicrounits = Math.round((parseFloat(cashReceived.replace(",", ".")) || 0) * 1_000_000);
    const changeResult = ExactChangeAssistanceService.computeChange(
        amountInMicrounits,
        receivedMicrounits > 0 ? receivedMicrounits : amountInMicrounits,
    );

    const handleProcessPayment = async () => {
        if (method === "card") {
            await handleCardPayment();
        } else {
            await handleDirectPayment();
        }
    };

    const handleCardPayment = async () => {
        setTerminalState("pending");
        setTerminalError(null);

        const chargeOrderId = orderId ?? `ORDER_${Date.now()}`;

        // Retry après échec : vérifier que le débit précédent n'est pas déjà capturé (anti double-débit).
        if (lastTpeTxnRef.current && tenantId) {
            const check = await TpeReconciliationService.checkBeforeRedebit({
                tenantId,
                orderId: chargeOrderId,
                tpeTransactionId: lastTpeTxnRef.current,
                operatorId: operatorId ?? 'pos-operator',
            }).catch(() => null);
            if (check && !check.safe && check.reason === 'already_captured') {
                setTerminalState("idle");
                setIsProcessing(true);
                try {
                    const hash = await onPaymentComplete();
                    applyHashIfPresent(hash, setCertifiedHash);
                    setIsSuccess(true);
                } finally { setIsProcessing(false); }
                return;
            }
        }

        const defaultDevice = terminalService.getDefault();
        defaultDeviceRef.current = defaultDevice?.id ?? null;
        const tpeTxnId = `TPE-${chargeOrderId}-${Date.now()}`;
        lastTpeTxnRef.current = tpeTxnId;

        let result: PaymentResult;
        try {
            if (defaultDevice?.adapter === "manual") {
                setTerminalState("manual_wait");
                if (terminalService.getStatus(defaultDevice.id) === "disconnected") {
                    await terminalService.connect(defaultDevice.id);
                }
                manualAdapterRef.current = terminalService.getManualAdapter(defaultDevice.id);
            } else {
                setTerminalState("pending");
            }

            result = await terminalService.charge({
                amountInMicrounits,
                orderId: chargeOrderId,
                description: `Commande POS`,
            });
        } catch (err) {
            setTerminalState("error");
            setTerminalError(err instanceof Error ? err.message : "Erreur terminal");
            return;
        }

        if (result.status === "approved") {
            if (tenantId) {
                await TpeReconciliationService.recordTransaction({
                    transactionId: tpeTxnId,
                    orderId: chargeOrderId,
                    tenantId,
                    amountInMicrounits,
                    status: 'captured',
                    terminalId: defaultDeviceRef.current ?? 'POS-MAIN',
                    capturedAt: Date.now(),
                    updatedAt: Date.now(),
                }).catch(() => null);
            }
            setTerminalState("idle");
            setIsProcessing(true);
            try {
                const hash = await onPaymentComplete();
                applyHashIfPresent(hash, setCertifiedHash);
                setIsSuccess(true);
            } finally {
                setIsProcessing(false);
            }
        } else if (result.status === "cancelled") {
            setTerminalState("idle");
            setMethod(null);
        } else {
            setTerminalState("error");
            setTerminalError(result.error ?? "Paiement refusé");
        }
    };

    const handleDirectPayment = async () => {
        setIsProcessing(true);
        try {
            if (method === "cash") {
                if (changeResult.isUnderpaid) {
                    setIsProcessing(false);
                    setTerminalError("Montant reçu insuffisant");
                    return;
                }
                printerService.openCashDrawer();
                await CashDrawerTriggerService.triggerOpen({
                    tenantId: tid,
                    adminId: operatorId || 'pos-operator',
                    terminalId: 'POS-MAIN',
                    reason: 'cash_payment',
                    orderId,
                }).catch(() => null);

                if (changeAsTip && changeResult.changeDueInMicrounits > 0) {
                    await ChangeAsTipService.record({
                        tenantId: tid,
                        orderId: orderId ?? `ORDER_${Date.now()}`,
                        operatorId: operatorId || 'pos-operator',
                        changeInMicrounits: changeResult.changeDueInMicrounits,
                        tipInMicrounits: changeResult.changeDueInMicrounits,
                    }).catch(() => null);
                }
            }
            if (method === "conecs") {
                await MealVoucherLimitGuard.validate({
                    tenantId: tid,
                    orderId: orderId ?? `ORDER_${Date.now()}`,
                    requestedVoucherAmountInMicrounits: amountInMicrounits,
                    items: [{
                        productId: 'pos-cart-summary',
                        category: 'food',
                        amountInMicrounits,
                    }],
                }).catch(() => null);
            }
            const hash = await onPaymentComplete();
            applyHashIfPresent(hash, setCertifiedHash);
            setIsSuccess(true);
        } catch {
            /* toast handled upstream */
        } finally {
            setIsProcessing(false);
        }
    };

    const handleManualConfirm = () => {
        manualAdapterRef.current?.confirmPayment(amountInMicrounits);
        manualAdapterRef.current = null;
        setTerminalState("pending");
    };

    const handleManualCancel = () => {
        manualAdapterRef.current?.cancelPayment();
        manualAdapterRef.current = null;
        setTerminalState("idle");
        setMethod(null);
    };

    const handleTerminalCancel = async () => {
        if (defaultDeviceRef.current) {
            await terminalService.cancelCurrent(defaultDeviceRef.current).catch(() => {});
        }
        setTerminalState("idle");
        setMethod(null);
    };

    const isTerminalBusy = terminalState === "pending" || terminalState === "manual_wait";

    return (
        <Modal
            isOpen={isOpen}
            onClose={isTerminalBusy ? () => {} : onClose}
            size="lg"
            className="p-0 border-none bg-transparent"
            showClose={false}
            noPadding
        >
            <div className="bg-bg-secondary w-full overflow-hidden relative border border-border/50 h-auto min-h-[600px] flex flex-col rounded-[3rem]">
                <div className="absolute top-0 right-0 w-48 h-48 bg-accent-gold/5 rounded-full blur-[100px] -mr-24 -mt-24 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-gold/5 rounded-full blur-[100px] -ml-24 -mb-24 pointer-events-none" />

                {isSuccess ? (
                    <PaymentSuccessView certifiedHash={certifiedHash} />
                ) : (
                    <>
                        {/* Header */}
                        <div className="relative p-10 md:p-14 pb-8 flex items-center justify-between shrink-0">
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-1.5 h-1.5 rounded-full bg-accent-gold" />
                                    <span className="text-nano font-black uppercase tracking-[0.4em] text-accent-gold">{t('pos.payment.subtitle')}</span>
                                </div>
                                <h1 className="text-4xl md:text-5xl font-serif font-black text-text-primary tracking-tighter italic">{t('pos.payment.title')}</h1>
                            </div>
                            {!isTerminalBusy && (
                                <button aria-label="Fermer"
                                    onClick={onClose}
                                    className="w-12 h-12 md:w-14 md:h-14 bg-bg-tertiary/50 hover:bg-accent-gold hover:text-text-primary rounded-2xl flex items-center justify-center text-text-muted transition-all border border-border/50 group"
                                >
                                    <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                                </button>
                            )}
                        </div>

                        {/* Amount */}
                        <div className="bg-bg-tertiary/40 border-y border-border/50 px-10 md:px-14 py-8 md:py-10 flex items-center justify-between shrink-0">
                            <div className="flex flex-col items-center">
                                <span className="text-nano font-bold uppercase tracking-widest text-text-primary/40 mb-1">Montant à régler</span>
                                <span className="text-4xl md:text-5xl font-serif font-black text-accent-gold italic drop-shadow-sm">{formatCurrency(total)}</span>
                            </div>
                            {tvaInMicrounits !== undefined && (
                                <div className="flex flex-col items-center">
                                    <span className="text-nano font-bold uppercase tracking-widest text-text-primary/40 mb-1">TVA incluse</span>
                                    <span className="text-xl md:text-2xl font-serif font-black text-text-primary italic">{formatCurrency(Math.round(tvaInMicrounits / 10_000))}</span>
                                </div>
                            )}
                        </div>

                        <div className="p-10 md:p-14 space-y-8 flex-1 overflow-auto elegant-scrollbar">
                            {/* Terminal states */}
                            <TerminalStatePanel
                                terminalState={terminalState}
                                terminalError={terminalError}
                                onTerminalCancel={handleTerminalCancel}
                                onManualConfirm={handleManualConfirm}
                                onManualCancel={handleManualCancel}
                                onErrorDismiss={() => { setTerminalState("idle"); setTerminalError(null); setMethod(null); }}
                            />

                            {/* Method selection */}
                            {!isTerminalBusy && (
                                <PaymentMethodSelector
                                    method={method}
                                    onSelectMethod={(m) => { setTerminalState("idle"); setTerminalError(null); setMethod(m); }}
                                    total={total}
                                />
                            )}

                            {/* Cash — montant reçu & rendu de monnaie */}
                            {!isTerminalBusy && method === "cash" && (
                                <div className="rounded-2xl border border-border/50 bg-bg-tertiary/30 p-5 space-y-3">
                                    <label className="block text-nano font-bold uppercase tracking-widest text-text-muted">
                                        Montant reçu (€)
                                    </label>
                                    <input
                                        value={cashReceived}
                                        onChange={(e) => setCashReceived(e.target.value)}
                                        inputMode="decimal"
                                        placeholder={formatCurrency(total)}
                                        className="w-full rounded-xl border border-border/50 bg-bg-secondary px-4 py-3 text-2xl font-serif tabular-nums text-text-primary"
                                    />
                                    {receivedMicrounits > 0 && (
                                        <div className="space-y-2 pt-1">
                                            {changeResult.isUnderpaid ? (
                                                <p className="text-sm font-semibold text-error">Insuffisant — manque {formatCurrency(Math.round((amountInMicrounits - receivedMicrounits) / 10_000))}</p>
                                            ) : (
                                                <>
                                                    <p className="text-lg font-serif tabular-nums text-text-primary">
                                                        Rendu : <span className="font-black text-accent-gold">{formatCurrency(Math.round(changeResult.changeDueInMicrounits / 10_000))}</span>
                                                    </p>
                                                    {changeResult.breakdown.length > 0 && (
                                                        <p className="text-xs text-text-muted">
                                                            {changeResult.breakdown.map((d) => `${d.count}× ${d.name}`).join(" · ")}
                                                        </p>
                                                    )}
                                                    {changeResult.changeDueInMicrounits > 0 && (
                                                        <label className="flex items-center gap-2 text-sm text-text-primary">
                                                            <input type="checkbox" checked={changeAsTip} onChange={(e) => setChangeAsTip(e.target.checked)} />
                                                            Laisser le rendu en pourboire (compte 426)
                                                        </label>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Confirm button */}
                            {!isTerminalBusy && (
                                <div className="pt-4 pb-4">
                                    <button
                                        disabled={!method || isProcessing}
                                        onClick={handleProcessPayment}
                                        className={cn(
                                            "w-full h-16 md:h-20 rounded-[32px] md:rounded-[40px] font-black text-lg md:text-xl transition-all duration-700 flex items-center justify-center gap-6 relative overflow-hidden shadow-premium active:scale-95 group uppercase tracking-[0.3em]",
                                            method
                                                ? "bg-action-primary hover:bg-action-primary-hover text-text-on-primary"
                                                : "bg-bg-tertiary text-text-muted/40 cursor-not-allowed border border-border/50"
                                        )}
                                    >
                                        <div className="absolute inset-0 bg-accent-gold/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        {isProcessing ? (
                                            <>
                                                <Loader2 className="w-6 h-6 animate-spin text-accent-gold" />
                                                <span className="animate-pulse">{t('pos.payment.processing')}</span>
                                            </>
                                        ) : (
                                            <>
                                                {t('pos.payment.confirm_seal')}
                                                <ArrowRight className="w-6 h-6 text-accent-gold group-hover:translate-x-2 transition-transform" strokeWidth={1.5} />
                                            </>
                                        )}
                                    </button>

                                    <div className="mt-10 flex flex-col items-center gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="h-px w-8 bg-border/50" />
                                            <p className="text-nano text-text-muted font-black uppercase tracking-[0.4em] flex items-center gap-3">
                                                <Sparkles className="w-3.5 h-3.5 text-accent-gold" />
                                                {t('pos.payment.security_seal')}
                                            </p>
                                            <div className="h-px w-8 bg-border/50" />
                                        </div>
                                        <p className="text-nano text-text-muted/40 font-black uppercase tracking-[0.2em]">{t('pos.payment.encryption_protocol')}</p>
                                        <p className="text-[10px] text-text-muted/30 text-center tracking-tight">
                                            {BilingualTipGratuityHelper.LEGAL_NOTICE_FR}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
}
