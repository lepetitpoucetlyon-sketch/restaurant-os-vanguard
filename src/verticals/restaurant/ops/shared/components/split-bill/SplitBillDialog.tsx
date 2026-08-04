"use client";

import { useState } from "react";
import { X, DivideCircle, CheckCircle2 } from "lucide-react";
import { Modal } from "@ui/Modal";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { formatCurrency } from "@/lib/formatters";
import { SovereignMath } from "@/shared/services/SovereignMath";
import { terminalService } from "@/infrastructure/hardware/payment-terminal/PaymentTerminalService";
import { printerService } from "@/infrastructure/hardware/printers/PrintingService";

import { CartItem } from "@/verticals/restaurant/ops/workflow/engine/types";
export type SplitCartItem = CartItem;

import { SplitMode, PaymentMethod, ConvivePayment } from "./SplitBillTypes";
import { SplitBillMethods } from "./SplitBillMethods";
import { SplitBillConviveList } from "./SplitBillConviveList";
import { SplitBillPaymentView } from "./SplitBillPaymentView";

interface SplitBillDialogProps {
    isOpen: boolean;
    items: CartItem[];
    total: number;
    coverCount: number;
    onClose: () => void;
    onPaySplit: (amount: number, conviveIndex: number) => void;
    /** Appelé quand toutes les parts sont réglées → scelle la vente (NF525). */
    onSplitComplete?: () => void;
}

function createEqualPayments(count: number, total: number): ConvivePayment[] {
    const baseAmount = Math.floor(total / count);
    const remainder = total % count;
    
    return Array.from({ length: count }, (_, i) => ({ 
        paid: false, 
        amount: i < remainder ? baseAmount + 1 : baseAmount 
    }));
}

export function SplitBillDialog({ isOpen, items, total, coverCount, onClose, onPaySplit, onSplitComplete }: SplitBillDialogProps) {
    const [mode, setMode] = useState<SplitMode>('equal');
    const [splitCount, setSplitCount] = useState(coverCount || 2);
    const [convivePayments, setConvivePayments] = useState<ConvivePayment[]>(() => createEqualPayments(coverCount || 2, total));
    const [selectedItems, setSelectedItems] = useState<Record<number, string[]>>({}); // conviveIndex -> cartIds
    const [customAmounts, setCustomAmounts] = useState<number[]>(() => Array(coverCount || 2).fill(total / (coverCount || 2)));
    const [payingConvive, setPayingConvive] = useState<number | null>(null);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [terminalState, setTerminalState] = useState<'idle' | 'pending' | 'manual_wait' | 'error'>('idle');
    const [terminalError, setTerminalError] = useState<string | null>(null);
    const { t } = useLanguage();

    const syncSplitState = (nextSplitCount: number) => {
        setSplitCount(nextSplitCount);
        setConvivePayments(createEqualPayments(nextSplitCount, total));
        setCustomAmounts(Array(nextSplitCount).fill(total / nextSplitCount));
        setSelectedItems({});
        setPayingConvive(null);
        setSelectedPaymentMethod(null);
    };

    const handleClose = () => {
        const initialSplitCount = coverCount || 2;
        setMode('equal');
        syncSplitState(initialSplitCount);
        onClose();
    };

    if (!isOpen) return null;

    const amountPerPerson = total / splitCount;
    const paidCount = convivePayments.filter(g => g.paid).length;
    const remainingAmount = total - convivePayments.filter(g => g.paid).reduce((sum, g) => sum + g.amount, 0);

    const getConviveTotal = (conviveIndex: number): number => {
        if (mode === 'equal') return amountPerPerson;
        if (mode === 'custom') return customAmounts[conviveIndex] || 0;
        // by-item mode
        const conviveItems = selectedItems[conviveIndex] || [];
        return items
            .filter(item => conviveItems.includes(item.cartId))
            .reduce((sum, item) => sum + Number(SovereignMath.multiply(item.unitPriceInMicrounits, item.quantity)), 0);
    };

    const handlePayConvive = (conviveIndex: number) => {
        setPayingConvive(conviveIndex);
        setSelectedPaymentMethod(null);
    };

    const handleConfirmPayment = async () => {
        if (payingConvive !== null && selectedPaymentMethod) {
            const amountInCents = getConviveTotal(payingConvive);

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
                        return; // Stop here if not approved
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

            // Success (Cash/Mobile, or Card Approved)
            setIsProcessing(false);
            setTerminalState('idle');
            
            setConvivePayments(prev => prev.map((g, i) =>
                i === payingConvive ? { ...g, paid: true, method: selectedPaymentMethod } : g
            ));
            onPaySplit(amountInCents, payingConvive);
            setPayingConvive(null);
            setSelectedPaymentMethod(null);
        }
    };

    const allPaid = convivePayments.every(g => g.paid);

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            size="lg"
            className="p-0 border-none bg-transparent"
            showClose={false}
            noPadding
        >
            <div className="bg-surface-sidebar border border-accent-gold/20 rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.8),0_0_50px_rgba(197,160,89,0.1)] w-full overflow-hidden relative flex flex-col h-[85vh]">
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-accent-gold/5 blur-[120px] pointer-events-none" />

                <div className="p-12 border-b border-white/5 flex items-center justify-between relative z-10 shrink-0">
                    <div className="flex items-center gap-8">
                        <div className="w-16 h-16 rounded-[22px] bg-accent-gold/10 flex items-center justify-center border border-accent-gold/20 shadow-glow transition-all duration-700 hover:rotate-6">
                            <DivideCircle className="w-8 h-8 text-accent-gold" strokeWidth={1.5} />
                        </div>
                        <div>
                            <div className="flex items-center gap-4 mb-3">
                                <div className="w-10 h-0.5 bg-accent-gold rounded-full" />
                                <span className="text-[11px] font-black uppercase tracking-[0.5em] text-accent-gold">{t('pos.split.subtitle')}</span>
                            </div>
                            <h1 className="text-4xl font-serif font-black text-text-primary italic tracking-tight leading-none">{t('pos.split.title')}</h1>
                             <p className="text-[11px] font-black text-text-primary/30 uppercase tracking-[0.4em] mt-4">
                                <span className="text-[10px] font-black text-text-primary/30 uppercase tracking-[0.4em] mb-1">Résumé de la Table</span>
                                Total TTC: <span className="text-text-primary">{formatCurrency(SovereignMath.toCents(BigInt(total)))}</span> • <span className="text-accent-gold">{paidCount}/{splitCount} {t('pos.split.signatures')}</span>
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-14 h-14 bg-surface-card/5 hover:bg-surface-card/10 hover:rotate-90 rounded-2xl flex items-center justify-center text-text-primary/40 hover:text-text-primary transition-all duration-500 border border-subtle group">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {payingConvive !== null ? (
                    <SplitBillPaymentView
                        payingConvive={payingConvive}
                        getConviveTotal={getConviveTotal}
                        selectedPaymentMethod={selectedPaymentMethod}
                        setSelectedPaymentMethod={setSelectedPaymentMethod}
                        terminalState={terminalState}
                        terminalError={terminalError}
                        isProcessing={isProcessing}
                        handleConfirmPayment={handleConfirmPayment}
                        setPayingConvive={setPayingConvive}
                        setTerminalState={setTerminalState}
                    />
                ) : (
                    <>
                        <SplitBillMethods 
                            mode={mode}
                            setMode={setMode}
                            splitCount={splitCount}
                            syncSplitState={syncSplitState}
                            amountPerPerson={amountPerPerson}
                            items={items}
                            convivePayments={convivePayments}
                            selectedItems={selectedItems}
                            setSelectedItems={setSelectedItems}
                            customAmounts={customAmounts}
                            setCustomAmounts={setCustomAmounts}
                        />

                        <SplitBillConviveList 
                            convivePayments={convivePayments}
                            getConviveTotal={getConviveTotal}
                            handlePayConvive={handlePayConvive}
                        />

                        <div className="p-12 bg-surface-card/[0.03] backdrop-blur-3xl border-t border-white/5 flex items-center justify-between relative z-10 h-32 shrink-0">
                            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent-gold/40 to-transparent" />

                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-accent-gold uppercase tracking-[0.6em] mb-2">{t('pos.split.remaining')}</span>
                                <div className="flex items-end gap-3">
                                    <span className="text-5xl font-serif font-black italic text-text-primary leading-none tracking-tighter">{formatCurrency(SovereignMath.toCents(BigInt(Math.round(remainingAmount))))}</span>
                                    <span className="text-xs font-black text-text-primary/20 uppercase tracking-widest mb-1 pb-1">Restant</span>
                                </div>
                            </div>

                            {allPaid ? (
                                <button
                                    onClick={() => { if (onSplitComplete) onSplitComplete(); else onClose(); }}
                                    className="h-16 px-12 rounded-[28px] bg-accent-gold text-primary font-black text-[12px] uppercase tracking-[0.4em] hover:bg-surface-card shadow-glow transition-all duration-700 flex items-center gap-5 group relative overflow-hidden"
                                >
                                    <CheckCircle2 className="w-6 h-6 group-hover:scale-125 transition-transform duration-500" />
                                    {t('pos.split.close_archive')}
                                </button>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <span className="text-[10px] font-black text-text-primary/30 uppercase tracking-[0.5em] mb-4">À encaisser maintenant</span>
                                    <p className="text-7xl font-serif font-black text-accent-gold italic drop-shadow-glow">{formatCurrency(SovereignMath.toCents(BigInt(Math.round(remainingAmount))))}</p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
}
