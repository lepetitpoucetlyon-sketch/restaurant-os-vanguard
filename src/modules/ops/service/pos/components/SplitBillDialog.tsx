"use client";

import { useState } from "react";
import { X, Users, DivideCircle, Check, ArrowRight, User, Minus, Plus, CheckCircle2, CreditCard, Banknote, Smartphone, Sparkles } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { Modal } from "@ui/Modal";
import { motion } from "framer-motion";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { formatCurrency } from "@/lib/formatters";

import { CartItem } from '../../../workflow/engine/types';
export type SplitCartItem = CartItem;
import { SovereignMath } from "@/shared/services/SovereignMath";
import { terminalService } from "@/modules/ops/service/pos/infrastructure/payment-terminal/PaymentTerminalService";
import { printerService } from "@/modules/ops/service/printers/hardware/PrintingService";
import { Loader2, AlertCircle } from "lucide-react";

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

export type SplitMode = 'equal' | 'by-item' | 'custom';
export type PaymentMethod = 'card' | 'cash' | 'mobile';

export interface ConvivePayment {
    paid: boolean;
    amount: number;
    method?: PaymentMethod;
}

import { SplitCalculator } from "../domain/splitCalculator";

export function SplitBillDialog({ isOpen, items, total, coverCount, onClose, onPaySplit, onSplitComplete }: SplitBillDialogProps) {
    const [mode, setMode] = useState<SplitMode>('equal');
    const [splitCount, setSplitCount] = useState(coverCount || 2);
    const [convivePayments, setConvivePayments] = useState<ConvivePayment[]>(() => SplitCalculator.createEqualPayments(coverCount || 2, total));
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
        setConvivePayments(SplitCalculator.createEqualPayments(nextSplitCount, total));
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
    const remainingAmount = SplitCalculator.calculateRemainingAmount(total, convivePayments);

    const getConviveTotal = (conviveIndex: number): number => {
        return SplitCalculator.getConviveTotal(mode, conviveIndex, amountPerPerson, customAmounts, selectedItems, items);
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
                    <div className="flex-1 p-16 flex flex-col items-center justify-center space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700 relative z-10">
                        <div className="text-center space-y-8">
                            <div className="w-24 h-24 rounded-[32px] bg-accent-gold/10 flex items-center justify-center mx-auto mb-8 shadow-premium border border-accent-gold/20">
                                <User className="w-12 h-12 text-accent-gold" strokeWidth={1} />
                            </div>
                            <h2 className="text-3xl font-serif font-black text-text-primary italic tracking-tighter">{t('pos.split.convive_signature_title')}<br />{t('pos.split.convive')} {payingConvive + 1}</h2>
                            <div className="relative">
                                <p className="text-7xl font-serif font-black text-accent-gold italic drop-shadow-glow">{formatCurrency(SovereignMath.toCents(BigInt(getConviveTotal(payingConvive || 0))))}</p>
                                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-32 h-1 bg-accent-gold/20 rounded-full blur-sm" />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-6 w-full max-w-2xl">
                            {[
                                { id: 'card', name: t('pos.split.methods.card'), icon: CreditCard },
                                { id: 'cash', name: t('pos.split.methods.cash'), icon: Banknote },
                                { id: 'mobile', name: t('pos.split.methods.mobile'), icon: Smartphone }
                            ].map((method) => (
                                <button
                                    key={method.id}
                                    onClick={() => setSelectedPaymentMethod(method.id as PaymentMethod)}
                                    className={cn(
                                        "flex flex-col items-center gap-6 p-8 rounded-[40px] border transition-all duration-500 group",
                                        selectedPaymentMethod === method.id
                                            ? "border-accent-gold bg-accent-gold/10 shadow-glow translate-y-[-8px]"
                                            : "border-white/5 bg-surface-card/[0.02] hover:border-accent-gold/30 hover:bg-surface-card/[0.05]"
                                    )}
                                >
                                    <div className={cn(
                                        "w-16 h-16 rounded-[22px] flex items-center justify-center transition-all duration-700 shadow-sm",
                                        selectedPaymentMethod === method.id ? "bg-accent-gold text-primary rotate-6" : "bg-surface-sidebar/40 text-accent-gold border border-accent-gold/20 group-hover:scale-110"
                                    )}>
                                        <method.icon className="w-7 h-7" strokeWidth={1.5} />
                                    </div>
                                    <span className={cn("text-[10px] font-black uppercase tracking-[0.3em] transition-colors", selectedPaymentMethod === method.id ? "text-text-primary" : "text-text-primary/20 group-hover:text-text-primary/40")}>
                                        {method.name}
                                    </span>
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-col items-center gap-6 w-full max-w-2xl pb-10">
                            {terminalState !== 'idle' && (
                                <div className="w-full p-6 rounded-3xl border border-accent-gold/20 bg-accent-gold/5 flex flex-col items-center gap-4 animate-in zoom-in duration-500">
                                    {terminalState === 'pending' || terminalState === 'manual_wait' ? (
                                        <>
                                            <div className="w-12 h-12 rounded-full bg-accent-gold/20 flex items-center justify-center">
                                                <Loader2 className="w-6 h-6 text-accent-gold animate-spin" />
                                            </div>
                                            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-accent-gold">
                                                {terminalState === 'manual_wait' ? "Veuillez valider sur le TPE physique" : "Connexion au TPE en cours..."}
                                            </p>
                                        </>
                                    ) : terminalState === 'error' ? (
                                        <>
                                            <div className="w-12 h-12 rounded-full bg-status-error/20 flex items-center justify-center">
                                                <AlertCircle className="w-6 h-6 text-status-error" />
                                            </div>
                                            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-status-error text-center">
                                                Erreur de paiement<br/>
                                                <span className="text-[9px] opacity-70">{terminalError}</span>
                                            </p>
                                            <button onClick={() => setTerminalState('idle')} className="px-6 py-2 rounded-full bg-surface-card border border-white/10 text-text-primary/50 text-[10px] font-bold uppercase hover:bg-white/10 transition-colors mt-2">Réessayer</button>
                                        </>
                                    ) : null}
                                </div>
                            )}

                            <div className="flex gap-6 w-full">
                                <button
                                    onClick={() => { setPayingConvive(null); setTerminalState('idle'); }}
                                    disabled={isProcessing}
                                    className="flex-1 h-16 rounded-[28px] bg-surface-card/5 text-text-primary/40 font-black text-[11px] uppercase tracking-[0.4em] hover:bg-surface-card/10 hover:text-text-primary transition-all duration-500 border border-subtle disabled:opacity-20"
                                >
                                    {t('pos.split.back')}
                                </button>
                                <button
                                    onClick={handleConfirmPayment}
                                    disabled={!selectedPaymentMethod || isProcessing}
                                    className="flex-[2] h-16 rounded-[28px] bg-accent-gold text-primary font-black text-[12px] uppercase tracking-[0.5em] shadow-glow transition-all duration-500 disabled:opacity-20 disabled:grayscale group relative overflow-hidden flex items-center justify-center"
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-4">
                                        {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                        {isProcessing ? "Encaissement..." : t('pos.split.seal_transaction')}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>
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
                                                                className={cn(
                                                                    "w-7 h-7 rounded-xl text-[10px] font-black transition-all duration-300 border",
                                                                    isAssigned
                                                                        ? "bg-accent-gold text-primary border-accent-gold"
                                                                        : "bg-transparent border-white/10 text-text-primary/40 hover:border-accent-gold/40 hover:text-accent-gold"
                                                                )}
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

                            <div className="flex-1 p-12 overflow-y-auto elegant-scrollbar">
                                <div className="grid grid-cols-2 gap-8">
                                    {convivePayments.map((convive, index) => (
                                        <motion.div
                                            layout
                                            key={index}
                                            className={cn(
                                                "group/card p-8 rounded-[40px] border transition-all duration-700 relative overflow-hidden",
                                                convive.paid
                                                    ? "bg-accent-gold/10 border-accent-gold/30 shadow-glow"
                                                    : "bg-surface-card/[0.02] border-white/5 hover:border-accent-gold/20 hover:bg-surface-card/[0.05]"
                                            )}
                                        >
                                            <div className="flex items-center justify-between mb-8">
                                                <div className="flex items-center gap-2 text-text-primary/60 font-mono text-xs">
                                                    {(SovereignMath.toCents(BigInt(getConviveTotal(index))) / 100).toFixed(2)}€
                                                </div>
                                                <div className={cn(
                                                    "w-12 h-12 rounded-[20px] flex items-center justify-center font-serif font-black italic text-xl shadow-sm transition-all duration-700",
                                                    convive.paid ? "bg-accent-gold text-primary rotate-12" : "bg-surface-sidebar/40 text-text-primary/40 border border-white/5 group-hover/card:scale-110"
                                                )}>
                                                    {convive.paid ? <Check className="w-6 h-6" /> : index + 1}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-accent-gold uppercase tracking-[0.3em] mb-1">{t('pos.split.convive_spirit')}</span>
                                                    <span className="font-serif italic font-black text-text-primary text-lg">{t('pos.split.master')} {index + 1}</span>
                                                </div>
                                            </div>

                                            <div className="text-4xl font-serif font-black italic text-text-primary mb-8 transition-colors group-hover/card:text-accent-gold group-hover/card:translate-x-2 duration-500">
                                                {formatCurrency(SovereignMath.toCents(BigInt(getConviveTotal(index))))}
                                            </div>

                                            {!convive.paid && (
                                                <button
                                                    onClick={() => handlePayConvive(index)}
                                                    className="w-full h-14 rounded-[24px] bg-accent-gold text-primary hover:bg-surface-card font-black text-[11px] uppercase tracking-[0.4em] transition-all duration-500 shadow-glow flex items-center justify-center gap-4 active:scale-95 group/btn"
                                                >
                                                    {t('pos.split.collect')}
                                                    <ArrowRight className="w-5 h-5 transition-transform group-hover/btn:translate-x-2" strokeWidth={2.5} />
                                                </button>
                                            )}

                                            {convive.paid && convive.method && (
                                                <div className="flex items-center gap-4 text-[10px] text-accent-gold font-black uppercase tracking-[0.2em] mt-2">
                                                    <div className="w-8 h-8 rounded-xl bg-accent-gold/10 flex items-center justify-center border border-accent-gold/20">
                                                        {convive.method === 'card' && <CreditCard className="w-4 h-4" />}
                                                        {convive.method === 'cash' && <Banknote className="w-4 h-4" />}
                                                        {convive.method === 'mobile' && <Smartphone className="w-4 h-4" />}
                                                    </div>
                                                    <span>{t('pos.split.signature')} {t(`pos.split.methods.${convive.method}`)}</span>
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
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
