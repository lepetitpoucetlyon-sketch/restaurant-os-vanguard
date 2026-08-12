"use client";

import { useState, useRef } from "react";
import { CreditCard, Banknote, Smartphone, CheckCircle, Loader2, Sparkles, Receipt, X, ArrowRight, AlertCircle, Terminal, FileText } from "lucide-react";
import { cn } from "@/lib/ui.foundations";;
import { Modal } from "@ui/Modal";
import { useLanguage } from "@/shared/hooks";
import { formatCurrency } from "@/lib/formatters";;
import { terminalService } from "@/modules/ops/service/pos/infrastructure/payment-terminal/PaymentTerminalService";
import type { PaymentResult } from "@/modules/ops/service/pos/infrastructure/payment-terminal/types";
import { printerService } from "@/modules/ops/service/printers/hardware/PrintingService";

interface PaymentDialogProps {
    isOpen: boolean;
    /** Amount in cents */
    total: number;
    /** TVA réelle du panier en cents (calculée par usePOSController) */
    tvaInCents?: number;
    orderId?: string;
    onClose: () => void;
    onPaymentComplete: () => Promise<string | void>;
    /** Montant HT en microunits — pour alerte seuil 150€ */
    totalHTInMicrounits?: number;
    /** true si le client a demandé une facture pro */
    hasInvoiceRequest?: boolean;
    /** Ouvre la modale de demande de facture */
    onRequestInvoice?: () => void;
}

type PaymentMethod = "card" | "cash" | "mobile";

type TerminalState = "idle" | "pending" | "manual_wait" | "error";

function applyHashIfPresent(hash: string | void, setCertifiedHash: (h: string) => void): void {
    if (hash) setCertifiedHash(hash);
}

const INVOICE_THRESHOLD_HT_MU = 150_000_000;

export function PaymentDialog({ isOpen, total, tvaInCents, orderId, onClose, onPaymentComplete, totalHTInMicrounits, hasInvoiceRequest, onRequestInvoice }: PaymentDialogProps) {
    const [method, setMethod] = useState<PaymentMethod | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [certifiedHash, setCertifiedHash] = useState<string | null>(null);
    const [terminalState, setTerminalState] = useState<TerminalState>("idle");
    const [terminalError, setTerminalError] = useState<string | null>(null);
    const { t } = useLanguage();

    // Used to let the ManualAdapter know the operator confirmed
    const manualAdapterRef = useRef<ReturnType<typeof terminalService.getManualAdapter>>(null);
    const defaultDeviceRef = useRef<string | null>(null);

    if (!isOpen) return null;

    const amountInMicrounits = total * 10_000;

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

        const defaultDevice = terminalService.getDefault();
        defaultDeviceRef.current = defaultDevice?.id ?? null;

        let result: PaymentResult;
        try {
            if (defaultDevice?.adapter === "manual") {
                setTerminalState("manual_wait");
                // Ensure connected
                if (terminalService.getStatus(defaultDevice.id) === "disconnected") {
                    await terminalService.connect(defaultDevice.id);
                }
                manualAdapterRef.current = terminalService.getManualAdapter(defaultDevice.id);
            } else {
                setTerminalState("pending");
            }

            result = await terminalService.charge({
                amountInMicrounits,
                orderId: orderId ?? `ORDER_${Date.now()}`,
                description: `Commande POS`,
            });
        } catch (err) {
            setTerminalState("error");
            setTerminalError(err instanceof Error ? err.message : "Erreur terminal");
            return;
        }

        if (result.status === "approved") {
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
                printerService.openCashDrawer();
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
                    <div className="flex flex-col items-center justify-center p-16 md:p-24 space-y-10 animate-in fade-in slide-in-from-bottom-12 duration-1000 flex-1">
                        <div className="relative">
                            <div className="w-32 h-32 bg-accent-gold/10 rounded-full flex items-center justify-center text-accent-gold shadow-premium border border-accent-gold/20">
                                <CheckCircle className="w-16 h-16" strokeWidth={1} />
                            </div>
                            <div className="absolute -top-2 -right-2 w-10 h-10 bg-accent-gold rounded-2xl flex items-center justify-center text-text-primary shadow-premium animate-bounce">
                                <Sparkles className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="text-center space-y-4">
                            <h2 className="text-4xl font-serif font-black text-text-primary tracking-tighter italic">{t('pos.payment.transaction_success')}</h2>
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.4em]">{t('pos.payment.archive_updated')}</p>
                            <div className="mt-6 p-4 bg-surface-sidebar/40 rounded-2xl border border-accent-gold/20 backdrop-blur-md">
                                <p className="text-[8px] font-black text-accent-gold/60 uppercase tracking-widest mb-1">NF525 Certified Seal</p>
                                <p className="text-[10px] font-mono text-accent-gold break-all font-bold">
                                    SHA256: {certifiedHash?.substring(0, 32) || 'NOT_AVAILABLE'}...CERTIFIED
                                </p>
                            </div>
                        </div>
                        <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                        <div className="flex items-center gap-4 text-[10px] font-black uppercase text-accent-gold tracking-[0.3em] bg-accent-gold/5 px-6 py-3 rounded-full border border-accent-gold/10">
                            <Receipt className="w-4 h-4 ml-[-4px]" />
                            {t('pos.payment.generating_receipt')}
                        </div>
                    </div>

                ) : (
                    <>
                        {/* Header */}
                        <div className="relative p-10 md:p-14 pb-8 flex items-center justify-between shrink-0">
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-1.5 h-1.5 rounded-full bg-accent-gold" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent-gold">{t('pos.payment.subtitle')}</span>
                                </div>
                                <h1 className="text-4xl md:text-5xl font-serif font-black text-text-primary tracking-tighter italic">{t('pos.payment.title')}</h1>
                            </div>
                            {!isTerminalBusy && (
                                <button
                                    onClick={onClose}
                                    className="w-12 h-12 md:w-14 md:h-14 bg-bg-tertiary/50 hover:bg-accent-gold hover:text-text-primary rounded-2xl flex items-center justify-center text-text-muted transition-all border border-border/50 group"
                                >
                                    <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                                </button>
                            )}
                        </div>

                        {/* Amount */}
                        <div className="bg-bg-tertiary/40 border-y border-border/50 px-10 md:px-14 py-8 md:py-10 shrink-0">
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col items-center">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-primary/40 mb-1">Montant à régler</span>
                                    <span className="text-4xl md:text-5xl font-serif font-black text-accent-gold italic drop-shadow-sm">{formatCurrency(total)}</span>
                                </div>
                                {tvaInCents !== undefined && (
                                    <div className="flex flex-col items-center">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-text-primary/40 mb-1">TVA incluse</span>
                                        <span className="text-xl md:text-2xl font-serif font-black text-text-primary italic">{formatCurrency(tvaInCents)}</span>
                                    </div>
                                )}
                            </div>

                            {totalHTInMicrounits != null && totalHTInMicrounits >= INVOICE_THRESHOLD_HT_MU && !hasInvoiceRequest && (
                                <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center gap-3">
                                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                                    <p className="text-[10px] text-amber-600 font-medium flex-1">
                                        Montant HT &gt; 150 € — facture obligatoire si note de frais professionnelle
                                    </p>
                                    {onRequestInvoice && (
                                        <button onClick={onRequestInvoice} className="px-3 py-1.5 bg-amber-500/20 text-amber-700 text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-amber-500/30 transition shrink-0">
                                            Facturer
                                        </button>
                                    )}
                                </div>
                            )}

                            {!hasInvoiceRequest && onRequestInvoice && (totalHTInMicrounits == null || totalHTInMicrounits < INVOICE_THRESHOLD_HT_MU) && (
                                <button
                                    onClick={onRequestInvoice}
                                    className="mt-4 w-full flex items-center justify-center gap-2 py-2 px-4 bg-surface-sidebar/40 border border-border/30 rounded-xl text-[10px] font-bold uppercase tracking-wider text-text-muted hover:bg-surface-sidebar/60 hover:text-text-primary transition"
                                >
                                    <FileText className="w-3.5 h-3.5" />
                                    Le client demande une facture
                                </button>
                            )}

                            {hasInvoiceRequest && (
                                <div className="mt-4 p-3 bg-accent-gold/10 border border-accent-gold/20 rounded-xl flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-accent-gold" />
                                    <p className="text-[10px] text-accent-gold font-bold uppercase tracking-wider">
                                        Facture professionnelle demandée
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="p-10 md:p-14 space-y-8 flex-1 overflow-auto elegant-scrollbar">

                            {/* Terminal pending states */}
                            {terminalState === "pending" && (
                                <div className="flex flex-col items-center gap-4 py-8 rounded-[2rem] border border-accent-gold/20 bg-accent-gold/5">
                                    <Terminal className="w-10 h-10 text-accent-gold animate-pulse" strokeWidth={1.5} />
                                    <p className="text-sm font-black uppercase tracking-widest text-text-primary">En attente du terminal…</p>
                                    <p className="text-[10px] text-text-muted">Le client peut présenter sa carte</p>
                                    <button
                                        onClick={handleTerminalCancel}
                                        className="mt-2 px-6 h-10 rounded-full border border-border/50 text-[11px] font-black uppercase tracking-wider text-text-muted hover:text-status-error hover:border-status-error/30 transition-colors"
                                    >
                                        Annuler
                                    </button>
                                </div>
                            )}

                            {terminalState === "manual_wait" && (
                                <div className="flex flex-col items-center gap-4 py-8 rounded-[2rem] border border-border bg-bg-tertiary/40">
                                    <Loader2 className="w-10 h-10 text-text-muted animate-spin" strokeWidth={1.5} />
                                    <p className="text-sm font-black uppercase tracking-widest text-text-primary">En attente de confirmation</p>
                                    <p className="text-[10px] text-text-muted">Collectez le paiement sur votre terminal externe</p>
                                    <div className="flex gap-3 mt-2">
                                        <button
                                            onClick={handleManualCancel}
                                            className="px-6 h-10 rounded-full border border-border/50 text-[11px] font-black uppercase tracking-wider text-text-muted hover:text-status-error transition-colors"
                                        >
                                            Annuler
                                        </button>
                                        <button
                                            onClick={handleManualConfirm}
                                            className="px-6 h-10 rounded-full bg-accent-gold text-text-primary text-[11px] font-black uppercase tracking-wider hover:bg-accent-gold/90 transition-colors"
                                        >
                                            Paiement reçu
                                        </button>
                                    </div>
                                </div>
                            )}

                            {terminalState === "error" && (
                                <div className="flex items-center gap-3 p-4 rounded-2xl bg-status-error/10 border border-status-error/20">
                                    <AlertCircle className="w-5 h-5 text-status-error shrink-0" />
                                    <div>
                                        <p className="text-[11px] font-black uppercase tracking-wider text-status-error">Paiement refusé</p>
                                        <p className="text-[10px] text-text-muted mt-0.5">{terminalError ?? "Réessayez ou changez de mode"}</p>
                                    </div>
                                    <button
                                        onClick={() => { setTerminalState("idle"); setTerminalError(null); setMethod(null); }}
                                        className="ml-auto text-text-muted hover:text-text-primary"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            {/* Method selection (hidden while terminal busy) */}
                            {!isTerminalBusy && (
                                <div className="grid grid-cols-3 gap-5 md:gap-6">
                                    {[
                                        { id: 'card', name: t('pos.payment.methods.card'), icon: CreditCard },
                                        { id: 'cash', name: t('pos.payment.methods.cash'), icon: Banknote },
                                        { id: 'mobile', name: t('pos.payment.methods.mobile'), icon: Smartphone }
                                    ].map((meth) => (
                                        <button
                                            key={meth.id}
                                            onClick={() => { setTerminalState("idle"); setTerminalError(null); setMethod(meth.id as PaymentMethod); }}
                                            className={cn(
                                                "flex flex-col items-center justify-center gap-5 p-6 md:p-8 rounded-[32px] md:rounded-[40px] border transition-all duration-700 group relative overflow-hidden",
                                                method === meth.id
                                                    ? "border-accent-gold bg-surface-card dark:bg-surface-card/5 shadow-premium ring-4 ring-accent-gold/5 -translate-y-2"
                                                    : "border-border/60 bg-bg-tertiary/40 hover:border-accent-gold/40 hover:bg-bg-tertiary/60"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-12 h-12 md:w-16 md:h-16 rounded-[24px] flex items-center justify-center transition-all duration-700 shadow-sm",
                                                method === meth.id
                                                    ? "bg-accent-gold text-text-primary"
                                                    : "bg-surface-card dark:bg-surface-sidebar text-text-muted group-hover:scale-110"
                                            )}>
                                                <meth.icon className="w-6 h-6 md:w-8 md:h-8" strokeWidth={1} />
                                            </div>
                                            <span className={cn("font-black text-[10px] md:text-[11px] uppercase tracking-[0.3em] transition-colors", method === meth.id ? "text-text-primary" : "text-text-muted")}>
                                                {meth.name}
                                            </span>
                                        </button>
                                    ))}
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
                                                ? "bg-text-primary text-text-primary hover:bg-surface-sidebar dark:hover:bg-surface-card dark:hover:text-primary"
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
                                            <p className="text-[10px] text-text-muted font-black uppercase tracking-[0.4em] flex items-center gap-3">
                                                <Sparkles className="w-3.5 h-3.5 text-accent-gold" />
                                                {t('pos.payment.security_seal')}
                                            </p>
                                            <div className="h-px w-8 bg-border/50" />
                                        </div>
                                        <p className="text-[8px] text-text-muted/40 font-black uppercase tracking-[0.2em]">{t('pos.payment.encryption_protocol')}</p>
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
