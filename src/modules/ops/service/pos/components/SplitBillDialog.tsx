"use client";

import { useState } from "react";
import { X, Users, DivideCircle, CreditCard } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { Modal } from "@ui/Modal";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { formatCurrency } from "@/lib/formatters";
import { SovereignMath } from "@/shared/services/SovereignMath";

import { SplitEqualPanel } from "./split/SplitEqualPanel";
import { SplitByItemPanel } from "./split/SplitByItemPanel";
import { SplitCustomPanel } from "./split/SplitCustomPanel";
import { SplitPayingView } from "./split/SplitPayingView";
import { SplitConviveCard } from "./split/SplitConviveCard";
import { SplitSummaryFooter } from "./split/SplitSummaryFooter";
import { useSplitPaymentExecution } from "./split/useSplitPaymentExecution";
import type { SplitBillDialogProps, SplitMode, PaymentMethod, ConvivePayment, SplitCartItem } from "./split/types";

export type { SplitCartItem, SplitMode, PaymentMethod, ConvivePayment, SplitBillDialogProps };

function createEqualPayments(count: number, total: number): ConvivePayment[] {
    const parts = SovereignMath.splitRemainder(total, Math.max(1, count));
    return parts.map(amount => ({ paid: false, amount }));
}

export function SplitBillDialog({
    isOpen,
    items,
    total,
    coverCount,
    onClose,
    onPaySplit,
    onSplitComplete,
}: SplitBillDialogProps) {
    const [mode, setMode] = useState<SplitMode>('equal');
    const [splitCount, setSplitCount] = useState(coverCount || 2);
    const [convivePayments, setConvivePayments] = useState<ConvivePayment[]>(() => createEqualPayments(coverCount || 2, total));
    const [selectedItems, setSelectedItems] = useState<Record<number, string[]>>({});
    const [customAmounts, setCustomAmounts] = useState<number[]>(() => Array(coverCount || 2).fill(total / (coverCount || 2)));
    const [payingConvive, setPayingConvive] = useState<number | null>(null);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
    const { t } = useLanguage();

    const {
        isProcessing,
        terminalState,
        terminalError,
        setTerminalState,
        executePayment,
    } = useSplitPaymentExecution({ onPaySplit });

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
        const conviveItems = selectedItems[conviveIndex] || [];
        return items
            .filter(item => conviveItems.includes(item.cartId))
            .reduce((sum, item) => sum + Number(SovereignMath.multiply(item.unitPriceInMicrounits, item.quantity)), 0);
    };

    const handleConfirmPayment = async () => {
        if (payingConvive === null || !selectedPaymentMethod) return;
        const amountInCents = getConviveTotal(payingConvive);
        const success = await executePayment(amountInCents, payingConvive, selectedPaymentMethod);
        if (success) {
            setConvivePayments(prev => prev.map((g, i) =>
                i === payingConvive ? { ...g, paid: true, method: selectedPaymentMethod } : g
            ));
            setPayingConvive(null);
            setSelectedPaymentMethod(null);
        }
    };

    const allPaid = convivePayments.every(g => g.paid);

    return (
        <Modal isOpen={isOpen} onClose={handleClose} size="lg" className="p-0 border-none bg-transparent" showClose={false} noPadding>
            <div className="bg-surface-sidebar border border-accent-gold/20 rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.8),0_0_50px_rgba(197,160,89,0.1)] w-full overflow-hidden relative flex flex-col h-[85vh]">
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-accent-gold/5 blur-[120px] pointer-events-none" />

                {/* En-tête */}
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

                {/* Corps */}
                {payingConvive !== null ? (
                    <SplitPayingView
                        payingConvive={payingConvive}
                        payingAmount={getConviveTotal(payingConvive || 0)}
                        selectedPaymentMethod={selectedPaymentMethod}
                        onSelectPaymentMethod={setSelectedPaymentMethod}
                        terminalState={terminalState}
                        terminalError={terminalError}
                        onResetTerminalState={() => setTerminalState('idle')}
                        isProcessing={isProcessing}
                        onCancel={() => { setPayingConvive(null); setTerminalState('idle'); }}
                        onConfirm={handleConfirmPayment}
                    />
                ) : (
                    <>
                        <div className="p-8 border-b border-white/5 bg-surface-card/[0.02] relative z-10 shrink-0">
                            <div className="flex gap-4">
                                {[
                                    { id: 'equal', label: t('pos.split.modes.equal'), icon: Users },
                                    { id: 'by-item', label: t('pos.split.modes.by_item'), icon: DivideCircle },
                                    { id: 'custom', label: t('pos.split.modes.custom'), icon: CreditCard }
                                ].map((m) => (
                                    <button
                                        key={m.id}
                                        onClick={() => setMode(m.id as SplitMode)}
                                        className={cn(
                                            "flex-1 flex items-center justify-center gap-4 py-5 px-8 rounded-[28px] font-black text-[10px] uppercase tracking-[0.3em] transition-all duration-700 border",
                                            mode === m.id
                                                ? "bg-accent-gold text-primary border-accent-gold shadow-glow"
                                                : "bg-surface-card/[0.02] text-text-primary/40 hover:border-accent-gold/30 hover:text-accent-gold border-white/5"
                                        )}
                                    >
                                        <m.icon className={cn("w-4 h-4", mode === m.id ? "text-primary" : "text-accent-gold")} strokeWidth={2} />
                                        {m.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col overflow-hidden relative z-10">
                            {mode === 'equal' && (
                                <SplitEqualPanel
                                    splitCount={splitCount}
                                    amountPerPerson={amountPerPerson}
                                    onSplitCountChange={syncSplitState}
                                />
                            )}

                            {mode === 'by-item' && (
                                <SplitByItemPanel
                                    items={items}
                                    convivePayments={convivePayments}
                                    selectedItems={selectedItems}
                                    onToggleItem={(conviveIdx, cartId) => {
                                        setSelectedItems(prev => {
                                            const updated: Record<number, string[]> = {};
                                            for (const k in prev) updated[k] = prev[k].filter((id: string) => id !== cartId);
                                            const isAssigned = (prev[conviveIdx] || []).includes(cartId);
                                            if (!isAssigned) updated[conviveIdx] = [...(updated[conviveIdx] || []), cartId];
                                            return updated;
                                        });
                                    }}
                                />
                            )}

                            {mode === 'custom' && (
                                <SplitCustomPanel
                                    convivePayments={convivePayments}
                                    customAmounts={customAmounts}
                                    onAmountChange={(idx, microunits) => {
                                        setCustomAmounts(prev => {
                                            const updated = [...prev];
                                            updated[idx] = microunits;
                                            return updated;
                                        });
                                    }}
                                />
                            )}

                            <div className="flex-1 p-12 overflow-y-auto elegant-scrollbar">
                                <div className="grid grid-cols-2 gap-8">
                                    {convivePayments.map((convive, index) => (
                                        <SplitConviveCard
                                            key={index}
                                            index={index}
                                            convive={convive}
                                            totalAmount={getConviveTotal(index)}
                                            onPay={setPayingConvive}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <SplitSummaryFooter
                            remainingAmount={remainingAmount}
                            allPaid={allPaid}
                            onComplete={() => { if (onSplitComplete) onSplitComplete(); else onClose(); }}
                        />
                    </>
                )}
            </div>
        </Modal>
    );
}
