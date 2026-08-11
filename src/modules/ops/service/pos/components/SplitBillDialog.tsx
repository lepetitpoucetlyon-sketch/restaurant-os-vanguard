"use client";

import React from "react";
import { Modal } from "@ui/Modal";
import { Minus, Plus, Sparkles, CheckCircle2 } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { SovereignMath } from "@/shared/services/SovereignMath";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { CartItem } from '../../workflow/engine/types';

import { useSplitBillState } from "./split-bill/useSplitBillState";
import { usePaymentTerminal } from "./split-bill/usePaymentTerminal";
import { SplitBillHeader } from "./split-bill/SplitBillHeader";
import { SplitModeSelector } from "./split-bill/SplitModeSelector";
import { PaymentMethodSelector } from "./split-bill/PaymentMethodSelector";
import { ConviveGrid } from "./split-bill/ConviveGrid";

export type SplitCartItem = CartItem;

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

export function SplitBillDialog({ isOpen, items, total, coverCount, onClose, onPaySplit, onSplitComplete }: SplitBillDialogProps) {
    const { t } = useLanguage();

    const {
        mode,
        setMode,
        splitCount,
        convivePayments,
        selectedItems,
        setSelectedItems,
        customAmounts,
        setCustomAmounts,
        payingConvive,
        setPayingConvive,
        syncSplitState,
        handleClose,
        amountPerPerson,
        paidCount,
        remainingAmount,
        getConviveTotal,
        handlePayConvive,
        markConvivePaid,
        allPaid,
    } = useSplitBillState({ total, coverCount, items, onClose });

    const {
        selectedPaymentMethod,
        setSelectedPaymentMethod,
        isProcessing,
        terminalState,
        setTerminalState,
        terminalError,
        resetTerminal,
        processPayment,
    } = usePaymentTerminal({
        onPaymentSuccess: (amount, conviveIndex, method) => {
            markConvivePaid(conviveIndex, method);
        }
    });

    if (!isOpen) return null;

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

                <SplitBillHeader
                    total={total}
                    paidCount={paidCount}
                    splitCount={splitCount}
                    t={t}
                    onClose={onClose}
                />

                {payingConvive !== null ? (
                    <PaymentMethodSelector
                        payingConvive={payingConvive}
                        conviveTotal={getConviveTotal(payingConvive)}
                        selectedPaymentMethod={selectedPaymentMethod}
                        isProcessing={isProcessing}
                        terminalState={terminalState}
                        terminalError={terminalError}
                        t={t}
                        onSelectPaymentMethod={setSelectedPaymentMethod}
                        onBack={() => { setPayingConvive(null); resetTerminal(); }}
                        onConfirmPayment={() => processPayment(payingConvive, getConviveTotal(payingConvive), onPaySplit)}
                        onResetTerminalState={() => setTerminalState('idle')}
                    />
                ) : (
                    <>
                        <SplitModeSelector
                            mode={mode}
                            t={t}
                            onSelectMode={setMode}
                        />

                        <div className="flex-1 flex flex-col overflow-hidden relative z-10">
                            {mode === 'equal' && (
                                <div className="p-12 border-b border-white/5 shrink-0">
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-accent-gold uppercase tracking-[0.5em] mb-3">{t('pos.split.seats_control')}</span>
                                            <span className="text-2xl font-serif italic font-black text-text-primary">{t('pos.split.convive_count')}</span>
                                        </div>
                                        <div className="flex items-center gap-8 bg-surface-card/[0.02] rounded-[32px] p-3 border border-white/5 shadow-inner">
                                            <button
                                                onClick={() => syncSplitState(Math.max(2, splitCount - 1))}
                                                className="w-14 h-14 rounded-[22px] bg-surface-sidebar/40 border border-subtle shadow-premium flex items-center justify-center hover:text-accent-gold transition-all duration-300 active:scale-90"
                                            >
                                                <Minus className="w-6 h-6" />
                                            </button>
                                            <span className="w-16 text-center text-5xl font-serif font-black italic text-accent-gold drop-shadow-glow">{splitCount}</span>
                                            <button
                                                onClick={() => syncSplitState(splitCount + 1)}
                                                className="w-14 h-14 rounded-[22px] bg-surface-sidebar/40 border border-subtle shadow-premium flex items-center justify-center hover:text-accent-gold transition-all duration-300 active:scale-90"
                                            >
                                                <Plus className="w-6 h-6" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="mt-12 p-8 bg-accent-gold/[0.03] rounded-[40px] border border-accent-gold/10 flex items-center justify-between group hover:bg-accent-gold/[0.05] transition-all duration-700">
                                        <div className="flex items-center gap-6">
                                            <div className="w-12 h-12 rounded-2xl bg-accent-gold/10 flex items-center justify-center">
                                                <Sparkles className="w-6 h-6 text-accent-gold animate-pulse" />
                                            </div>
                                            <span className="text-[11px] font-black text-text-primary/60 uppercase tracking-[0.4em]">{t('pos.split.investment_per_seat')}</span>
                                        </div>
                                        <span className="text-5xl font-serif font-black italic text-accent-gold drop-shadow-glow">{formatCurrency(SovereignMath.toCents(BigInt(Math.round(amountPerPerson))))}</span>
                                    </div>
                                </div>
                            )}

                            {mode === 'by-item' && (
                                <div className="px-12 py-8 border-b border-white/5 shrink-0 overflow-y-auto max-h-56 elegant-scrollbar">
                                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-text-primary/40 mb-4">{t('pos.split.assign_items')}</p>
                                    <div className="space-y-2">
                                        {items.map((item) => (
                                            <div key={item.cartId} className="flex items-center justify-between gap-4 px-5 py-3 rounded-2xl bg-surface-card/[0.04] border border-white/5">
                                                <span className="text-xs font-semibold text-text-primary/80 truncate max-w-[140px]">{item.name} ×{item.quantity}</span>
                                                <div className="flex gap-2 shrink-0">
                                                    {convivePayments.map((_, idx) => {
                                                        const isAssigned = (selectedItems[idx] || []).includes(item.cartId);
                                                        return (
                                                            <button
                                                                key={idx}
                                                                onClick={() => {
                                                                    setSelectedItems(prev => {
                                                                        const updated: Record<number, string[]> = {};
                                                                        for (const k in prev) updated[k] = prev[k].filter((id: string) => id !== item.cartId);
                                                                        if (!isAssigned) updated[idx] = [...(updated[idx] || []), item.cartId];
                                                                        return updated;
                                                                    });
                                                                }}
                                                                className={`w-7 h-7 rounded-xl text-[10px] font-black transition-all duration-300 border ${
                                                                    isAssigned
                                                                        ? "bg-accent-gold text-primary border-accent-gold"
                                                                        : "bg-transparent border-white/10 text-text-primary/40 hover:border-accent-gold/40 hover:text-accent-gold"
                                                                }`}
                                                            >{idx + 1}</button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {mode === 'custom' && (
                                <div className="px-12 py-8 border-b border-white/5 shrink-0">
                                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-text-primary/40 mb-4">{t('pos.split.custom_amounts')}</p>
                                    <div className="space-y-3">
                                        {convivePayments.map((_, idx) => (
                                            <div key={idx} className="flex items-center justify-between gap-4">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-text-primary/50">{t('pos.split.master')} {idx + 1}</span>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        step={0.01}
                                                        value={(customAmounts[idx] / 1_000_000).toFixed(2)}
                                                        onChange={e => {
                                                            const euros = parseFloat(e.target.value);
                                                            if (isNaN(euros)) return;
                                                            setCustomAmounts(prev => {
                                                                const updated = [...prev];
                                                                updated[idx] = Math.round(euros * 1_000_000);
                                                                return updated;
                                                            });
                                                        }}
                                                        className="w-24 text-right bg-surface-card/[0.04] border border-white/10 rounded-xl px-3 py-2 text-accent-gold font-serif font-black text-base focus:outline-none focus:border-accent-gold/60"
                                                    />
                                                    <span className="text-text-primary/40 text-sm font-black">€</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <ConviveGrid
                                convivePayments={convivePayments}
                                getConviveTotal={getConviveTotal}
                                t={t}
                                onPayConvive={handlePayConvive}
                            />
                        </div>

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
