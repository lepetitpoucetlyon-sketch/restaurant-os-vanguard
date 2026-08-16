"use client";

import { Check, ArrowRight, CreditCard, Banknote, Smartphone } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { motion } from "framer-motion";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { formatCurrency } from "@/lib/formatters";
import { SovereignMath } from "@/shared/services/SovereignMath";
import type { ConvivePayment } from './types';

interface SplitConviveCardProps {
    index: number;
    convive: ConvivePayment;
    totalAmount: number;
    onPay: (index: number) => void;
}

export function SplitConviveCard({
    index,
    convive,
    totalAmount,
    onPay,
}: SplitConviveCardProps) {
    const { t } = useLanguage();

    return (
        <motion.div
            layout
            className={cn(
                "group/card p-8 rounded-[40px] border transition-all duration-700 relative overflow-hidden",
                convive.paid
                    ? "bg-accent-gold/10 border-accent-gold/30 shadow-glow"
                    : "bg-surface-card/[0.02] border-white/5 hover:border-accent-gold/20 hover:bg-surface-card/[0.05]"
            )}
        >
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2 text-text-primary/60 font-mono text-xs">
                    {(SovereignMath.toCents(BigInt(totalAmount)) / 100).toFixed(2)}€
                </div>
                <div className={cn(
                    "w-12 h-12 rounded-[20px] flex items-center justify-center font-serif font-black italic text-xl shadow-sm transition-all duration-700",
                    convive.paid ? "bg-accent-gold text-primary rotate-12" : "bg-surface-sidebar/40 text-text-primary/40 border border-white/5 group-hover/card:scale-110"
                )}>
                    {convive.paid ? <Check className="w-6 h-6" /> : index + 1}
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-accent-gold uppercase tracking-[0.3em] mb-1">
                        {t('pos.split.convive_spirit')}
                    </span>
                    <span className="font-serif italic font-black text-text-primary text-lg">
                        {t('pos.split.master')} {index + 1}
                    </span>
                </div>
            </div>

            <div className="text-4xl font-serif font-black italic text-text-primary mb-8 transition-colors group-hover/card:text-accent-gold group-hover/card:translate-x-2 duration-500">
                {formatCurrency(SovereignMath.toCents(BigInt(totalAmount)))}
            </div>

            {!convive.paid && (
                <button
                    onClick={() => onPay(index)}
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
    );
}
