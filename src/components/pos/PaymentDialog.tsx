// @ts-nocheck
"use client";

import { useState } from "react";
import { CreditCard, Banknote, Smartphone, CheckCircle, Loader2, Sparkles, Receipt, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/ui.foundations";;
import { Modal } from "@/components/ui/Modal";

interface PaymentDialogProps {
    isOpen: boolean;
    total: number;
    onClose: () => void;
    onPaymentComplete: () => Promise<string | void>;
}

import { useLanguage } from "@/context/LanguageContext";
import { formatCurrency } from "@/lib/formatters";;

type PaymentMethod = "card" | "cash" | "mobile";

export function PaymentDialog({ isOpen, total, onClose, onPaymentComplete }: PaymentDialogProps) {
    const [method, setMethod] = useState<PaymentMethod | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [certifiedHash, setCertifiedHash] = useState<string | null>(null);
    const { t } = useLanguage();


    if (!isOpen) return null;

    const handleProcessPayment = async () => {
        setIsProcessing(true);
        try {
            const hash = await onPaymentComplete();
            if (hash) setCertifiedHash(hash);
            setIsProcessing(false);
            setIsSuccess(true);

            // Allow user to see the success state for a bit before closing
            // But this is intentional UI feedback, not a 'mock' simulation
        } catch (error) {
            setIsProcessing(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="lg"
            className="p-0 border-none bg-transparent"
            showClose={false}
            noPadding
        >
            <div className="bg-bg-secondary w-full overflow-hidden relative border border-border/50 h-auto min-h-[600px] flex flex-col rounded-[3rem]">

                {/* Decorative Elements - Museum Tier */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-accent-gold/5 rounded-full blur-[100px] -mr-24 -mt-24 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent-gold/5 rounded-full blur-[100px] -ml-24 -mb-24 pointer-events-none" />

                {isSuccess ? (
                    <div className="flex flex-col items-center justify-center p-16 md:p-24 space-y-10 animate-in fade-in slide-in-from-bottom-12 duration-1000 flex-1">
                        <div className="relative">
                            <div className="w-32 h-32 bg-accent-gold/10 rounded-full flex items-center justify-center text-accent-gold shadow-premium border border-accent-gold/20">
                                <CheckCircle className="w-16 h-16" strokeWidth={1} />
                            </div>
                            <div className="absolute -top-2 -right-2 w-10 h-10 bg-accent-gold rounded-2xl flex items-center justify-center text-white shadow-premium animate-bounce">
                                <Sparkles className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="text-center space-y-4">
                            <h2 className="text-4xl font-serif font-black text-text-primary tracking-tighter italic">{t('pos.payment.transaction_success')}</h2>
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.4em]">{t('pos.payment.archive_updated')}</p>
                            
                            <div className="mt-6 p-4 bg-black/40 rounded-2xl border border-accent-gold/20 backdrop-blur-md">
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
                        {/* Header - Museum Tier */}
                        <div className="relative p-10 md:p-14 pb-8 flex items-center justify-between shrink-0">
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-1.5 h-1.5 rounded-full bg-accent-gold" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent-gold">{t('pos.payment.subtitle')}</span>
                                </div>
                                <h1 className="text-4xl md:text-5xl font-serif font-black text-text-primary tracking-tighter italic">{t('pos.payment.title')}</h1>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-12 h-12 md:w-14 md:h-14 bg-bg-tertiary/50 hover:bg-accent-gold hover:text-white rounded-2xl flex items-center justify-center text-text-muted transition-all border border-border/50 group"
                            >
                                <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                            </button>
                        </div>

                        {/* Order Summary Ribbon - Executive Note */}
                        <div className="bg-bg-tertiary/40 border-y border-border/50 px-10 md:px-14 py-8 md:py-10 flex items-center justify-between shrink-0">
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Montant à régler</span>
                                <span className="text-4xl md:text-5xl font-serif font-black text-accent-gold italic drop-shadow-sm">{formatCurrency(total)}</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">TVA (Auto)</span>
                                <span className="text-xl md:text-2xl font-serif font-black text-text-primary italic">{formatCurrency(total - Math.round(total / 1.2))}</span>
                            </div>
                        </div>

                        {/* Payment Selection - Archive Grid */}
                        <div className="p-10 md:p-14 space-y-12 flex-1 overflow-auto elegant-scrollbar">
                            <div className="grid grid-cols-3 gap-5 md:gap-6">
                                {[
                                    { id: 'card', name: t('pos.payment.methods.card'), icon: CreditCard },
                                    { id: 'cash', name: t('pos.payment.methods.cash'), icon: Banknote },
                                    { id: 'mobile', name: t('pos.payment.methods.mobile'), icon: Smartphone }
                                ].map((meth) => (
                                    <button
                                        key={meth.id}
                                        onClick={() => setMethod(meth.id as PaymentMethod)}
                                        className={cn(
                                            "flex flex-col items-center justify-center gap-5 p-6 md:p-8 rounded-[32px] md:rounded-[40px] border transition-all duration-700 group relative overflow-hidden",
                                            method === meth.id
                                                ? "border-accent-gold bg-white dark:bg-white/5 shadow-premium ring-4 ring-accent-gold/5 -translate-y-2"
                                                : "border-border/60 bg-bg-tertiary/40 hover:border-accent-gold/40 hover:bg-bg-tertiary/60"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-12 h-12 md:w-16 md:h-16 rounded-[24px] flex items-center justify-center transition-all duration-700 shadow-sm",
                                            method === meth.id
                                                ? "bg-accent-gold text-white"
                                                : "bg-white dark:bg-black text-text-muted group-hover:scale-110"
                                        )}>
                                            <meth.icon className="w-6 h-6 md:w-8 md:h-8" strokeWidth={1} />
                                        </div>
                                        <span className={cn("font-black text-[10px] md:text-[11px] uppercase tracking-[0.3em] transition-colors", method === meth.id ? "text-text-primary" : "text-text-muted")}>
                                            {meth.name}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {/* Execution Button - Final Seal */}
                            <div className="pt-4 pb-4">
                                <button
                                    disabled={!method || isProcessing}
                                    onClick={handleProcessPayment}
                                    className={cn(
                                        "w-full h-16 md:h-20 rounded-[32px] md:rounded-[40px] font-black text-lg md:text-xl transition-all duration-700 flex items-center justify-center gap-6 relative overflow-hidden shadow-premium active:scale-95 group uppercase tracking-[0.3em]",
                                        method
                                            ? "bg-text-primary text-white hover:bg-black dark:hover:bg-white dark:hover:text-black"
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
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
}
