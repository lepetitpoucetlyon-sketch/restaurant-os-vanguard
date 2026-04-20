// @ts-nocheck
"use client";

import { useState } from "react";
import { X, Users, DivideCircle, Check, ArrowRight, User, Minus, Plus, CheckCircle2, CreditCard, Banknote, Smartphone, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/ui.foundations";;
import { Modal } from "@/components/ui/Modal";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { formatCurrency } from "@/lib/formatters";;

interface CartItem {
    cartId: string;
    productId: string;
    name: string;
    priceInCents: number;
    quantity: number;
    notes?: string;
    modifiers?: string[];
}

interface SplitBillDialogProps {
    isOpen: boolean;
    items: CartItem[];
    total: number;
    coverCount: number;
    onClose: () => void;
    onPaySplit: (amount: number, conviveIndex: number) => void;
}

type SplitMode = 'equal' | 'by-item' | 'custom';
type PaymentMethod = 'card' | 'cash' | 'mobile';

interface ConvivePayment {
    paid: boolean;
    amount: number;
    method?: PaymentMethod;
}

function createEqualPayments(count: number, totalInCents: number): ConvivePayment[] {
    const baseAmount = Math.floor(totalInCents / count);
    const remainder = totalInCents % count;
    
    return Array.from({ length: count }, (_, i) => ({ 
        paid: false, 
        amount: i < remainder ? baseAmount + 1 : baseAmount 
    }));
}

export function SplitBillDialog({ isOpen, items, total, coverCount, onClose, onPaySplit }: SplitBillDialogProps) {
    const [mode, setMode] = useState<SplitMode>('equal');
    const [splitCount, setSplitCount] = useState(coverCount || 2);
    const [convivePayments, setConvivePayments] = useState<ConvivePayment[]>(() => createEqualPayments(coverCount || 2, total));
    const [selectedConvive, setSelectedConvive] = useState<number | null>(null);
    const [selectedItems, setSelectedItems] = useState<Record<number, string[]>>({}); // conviveIndex -> cartIds
    const [customAmounts, setCustomAmounts] = useState<number[]>(() => Array(coverCount || 2).fill(total / (coverCount || 2)));
    const [payingConvive, setPayingConvive] = useState<number | null>(null);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
    const { t } = useLanguage();

    const syncSplitState = (nextSplitCount: number) => {
        setSplitCount(nextSplitCount);
        setConvivePayments(createEqualPayments(nextSplitCount, total));
        setCustomAmounts(Array(nextSplitCount).fill(total / nextSplitCount));
        setSelectedItems({});
        setSelectedConvive(null);
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

    const handleSelectItem = (conviveIndex: number, cartId: string) => {
        setSelectedItems(prev => {
            const conviveItems = prev[conviveIndex] || [];
            if (conviveItems.includes(cartId)) {
                return { ...prev, [conviveIndex]: conviveItems.filter(id => id !== cartId) };
            } else {
                // Remove from other convives first
                const newState = { ...prev };
                Object.keys(newState).forEach(key => {
                    newState[parseInt(key)] = newState[parseInt(key)].filter(id => id !== cartId);
                });
                return { ...newState, [conviveIndex]: [...(newState[conviveIndex] || []), cartId] };
            }
        });
    };

    const getConviveTotal = (conviveIndex: number): number => {
        if (mode === 'equal') return amountPerPerson;
        if (mode === 'custom') return customAmounts[conviveIndex] || 0;
        // by-item mode
        const conviveItems = selectedItems[conviveIndex] || [];
        return items
            .filter(item => conviveItems.includes(item.cartId))
            .reduce((sum, item) => sum + (item.priceInCents * item.quantity), 0);
    };

    const handlePayConvive = (conviveIndex: number) => {
        setPayingConvive(conviveIndex);
        setSelectedPaymentMethod(null);
    };

    const handleConfirmPayment = () => {
        if (payingConvive !== null && selectedPaymentMethod) {
            setConvivePayments(prev => prev.map((g, i) =>
                i === payingConvive ? { ...g, paid: true, method: selectedPaymentMethod } : g
            ));
            onPaySplit(getConviveTotal(payingConvive), payingConvive);
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
            <div className="bg-black border border-accent-gold/20 rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.8),0_0_50px_rgba(197,160,89,0.1)] w-full overflow-hidden relative flex flex-col h-[85vh]">
                {/* Visual Background Glow */}
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-accent-gold/5 blur-[120px] pointer-events-none" />

                {/* Header - Museum Masterpiece */}
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
                            <h1 className="text-4xl font-serif font-black text-white italic tracking-tight leading-none">{t('pos.split.title')}</h1>
                            <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.4em] mt-4">
                                <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mb-1">Résumé de la Table</span>
                                Total TTC: <span className="text-white">{formatCurrency(total)}</span> • <span className="text-accent-gold">{paidCount}/{splitCount} {t('pos.split.signatures')}</span>
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-14 h-14 bg-white/5 hover:bg-white/10 hover:rotate-90 rounded-2xl flex items-center justify-center text-white/40 hover:text-white transition-all duration-500 border border-white/10 group">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Payment for Convive Master Modal */}
                {payingConvive !== null ? (
                    <div className="flex-1 p-16 flex flex-col items-center justify-center space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-700 relative z-10">
                        <div className="text-center space-y-8">
                            <div className="w-24 h-24 rounded-[32px] bg-accent-gold/10 flex items-center justify-center mx-auto mb-8 shadow-premium border border-accent-gold/20">
                                <User className="w-12 h-12 text-accent-gold" strokeWidth={1} />
                            </div>
                            <h2 className="text-3xl font-serif font-black text-white italic tracking-tighter">{t('pos.split.convive_signature_title')}<br />{t('pos.split.convive')} {payingConvive + 1}</h2>
                            <div className="relative">
                                <p className="text-7xl font-serif font-black text-accent-gold italic drop-shadow-glow">{formatCurrency(getConviveTotal(payingConvive || 0))}</p>
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
                                            : "border-white/5 bg-white/[0.02] hover:border-accent-gold/30 hover:bg-white/[0.05]"
                                    )}
                                >
                                    <div className={cn(
                                        "w-16 h-16 rounded-[22px] flex items-center justify-center transition-all duration-700 shadow-sm",
                                        selectedPaymentMethod === method.id ? "bg-accent-gold text-black rotate-6" : "bg-black/40 text-accent-gold border border-accent-gold/20 group-hover:scale-110"
                                    )}>
                                        <method.icon className="w-7 h-7" strokeWidth={1.5} />
                                    </div>
                                    <span className={cn("text-[10px] font-black uppercase tracking-[0.3em] transition-colors", selectedPaymentMethod === method.id ? "text-white" : "text-white/20 group-hover:text-white/40")}>
                                        {method.name}
                                    </span>
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-6 w-full max-w-2xl pb-10">
                            <button
                                onClick={() => setPayingConvive(null)}
                                className="flex-1 h-16 rounded-[28px] bg-white/5 text-white/40 font-black text-[11px] uppercase tracking-[0.4em] hover:bg-white/10 hover:text-white transition-all duration-500 border border-white/10"
                            >
                                {t('pos.split.back')}
                            </button>
                            <button
                                onClick={handleConfirmPayment}
                                disabled={!selectedPaymentMethod}
                                className="flex-[2] h-16 rounded-[28px] bg-accent-gold text-black font-black text-[12px] uppercase tracking-[0.5em] shadow-glow transition-all duration-500 disabled:opacity-20 disabled:grayscale group relative overflow-hidden"
                            >
                                <span className="relative z-10 flex items-center justify-center gap-4">
                                    <CheckCircle2 className="w-5 h-5" />
                                    {t('pos.split.seal_transaction')}
                                </span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Mode Selector - Luxury Archive Tabs */}
                        <div className="p-8 border-b border-white/5 bg-white/[0.02] relative z-10 shrink-0">
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
                                                ? "bg-accent-gold text-black border-accent-gold shadow-glow"
                                                : "bg-white/[0.02] text-white/40 hover:border-accent-gold/30 hover:text-accent-gold border-white/5"
                                        )}
                                    >
                                        <m.icon className={cn("w-4 h-4", mode === m.id ? "text-black" : "text-accent-gold")} strokeWidth={2} />
                                        {m.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Split Configuration - Precision Archive */}
                        <div className="flex-1 flex flex-col overflow-hidden relative z-10">
                            {mode === 'equal' && (
                                <div className="p-12 border-b border-white/5 shrink-0">
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-accent-gold uppercase tracking-[0.5em] mb-3">{t('pos.split.seats_control')}</span>
                                            <span className="text-2xl font-serif italic font-black text-white">{t('pos.split.convive_count')}</span>
                                        </div>
                                        <div className="flex items-center gap-8 bg-white/[0.02] rounded-[32px] p-3 border border-white/5 shadow-inner">
                                            <button
                                                onClick={() => syncSplitState(Math.max(2, splitCount - 1))}
                                                className="w-14 h-14 rounded-[22px] bg-black/40 border border-white/10 shadow-premium flex items-center justify-center hover:text-accent-gold transition-all duration-300 active:scale-90"
                                            >
                                                <Minus className="w-6 h-6" />
                                            </button>
                                            <span className="w-16 text-center text-5xl font-serif font-black italic text-accent-gold drop-shadow-glow">{splitCount}</span>
                                            <button
                                                onClick={() => syncSplitState(splitCount + 1)}
                                                className="w-14 h-14 rounded-[22px] bg-black/40 border border-white/10 shadow-premium flex items-center justify-center hover:text-accent-gold transition-all duration-300 active:scale-90"
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
                                            <span className="text-[11px] font-black text-white/60 uppercase tracking-[0.4em]">{t('pos.split.investment_per_seat')}</span>
                                        </div>
                                        <span className="text-5xl font-serif font-black italic text-accent-gold drop-shadow-glow">{formatCurrency(amountPerPerson)}</span>
                                    </div>
                                </div>
                            )}

                            {/* Convive Gallery - Immersive Scroll */}
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
                                                    : "bg-white/[0.02] border-white/5 hover:border-accent-gold/20 hover:bg-white/[0.05]"
                                            )}
                                        >
                                            <div className="flex items-center justify-between mb-8">
                                                <div className="flex items-center gap-2 text-white/60 font-mono text-xs">
                                                    {getConviveTotal(index) / 100}€
                                                </div>
                                                <div className={cn(
                                                    "w-12 h-12 rounded-[20px] flex items-center justify-center font-serif font-black italic text-xl shadow-sm transition-all duration-700",
                                                    convive.paid ? "bg-accent-gold text-black rotate-12" : "bg-black/40 text-white/40 border border-white/5 group-hover/card:scale-110"
                                                )}>
                                                    {convive.paid ? <Check className="w-6 h-6" /> : index + 1}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-accent-gold uppercase tracking-[0.3em] mb-1">{t('pos.split.convive_spirit')}</span>
                                                    <span className="font-serif italic font-black text-white text-lg">{t('pos.split.master')} {index + 1}</span>
                                                </div>
                                            </div>

                                            <div className="text-4xl font-serif font-black italic text-white mb-8 transition-colors group-hover/card:text-accent-gold group-hover/card:translate-x-2 duration-500">
                                                {formatCurrency(getConviveTotal(index))}
                                            </div>

                                            {!convive.paid && (
                                                <button
                                                    onClick={() => handlePayConvive(index)}
                                                    className="w-full h-14 rounded-[24px] bg-accent-gold text-black hover:bg-white font-black text-[11px] uppercase tracking-[0.4em] transition-all duration-500 shadow-glow flex items-center justify-center gap-4 active:scale-95 group/btn"
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

                        {/* Footer - Archive Summary Masterpiece */}
                        <div className="p-12 bg-white/[0.03] backdrop-blur-3xl border-t border-white/5 flex items-center justify-between relative z-10 h-32 shrink-0">
                            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent-gold/40 to-transparent" />

                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-accent-gold uppercase tracking-[0.6em] mb-2">{t('pos.split.remaining')}</span>
                                <div className="flex items-end gap-3">
                                    <span className="text-5xl font-serif font-black italic text-white leading-none tracking-tighter">{formatCurrency(remainingAmount)}</span>
                                    <span className="text-xs font-black text-white/20 uppercase tracking-widest mb-1 pb-1">Restant</span>
                                </div>
                            </div>

                            {allPaid ? (
                                <button
                                    onClick={onClose}
                                    className="h-16 px-12 rounded-[28px] bg-accent-gold text-black font-black text-[12px] uppercase tracking-[0.4em] hover:bg-white shadow-glow transition-all duration-700 flex items-center gap-5 group relative overflow-hidden"
                                >
                                    <CheckCircle2 className="w-6 h-6 group-hover:scale-125 transition-transform duration-500" />
                                    {t('pos.split.close_archive')}
                                </button>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.5em] mb-4">À encaisser maintenant</span>
                                    <p className="text-7xl font-serif font-black text-accent-gold italic drop-shadow-glow">{formatCurrency(remainingAmount)}</p>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
}
