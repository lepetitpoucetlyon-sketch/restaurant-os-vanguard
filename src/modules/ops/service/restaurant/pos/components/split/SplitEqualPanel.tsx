"use client";

import { Minus, Plus, Sparkles } from "lucide-react";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { formatCurrency } from "@/lib/formatters";
import { SovereignMath } from "@/shared/services/SovereignMath";

interface SplitEqualPanelProps {
    splitCount: number;
    amountPerPerson: number;
    onSplitCountChange: (count: number) => void;
}

export function SplitEqualPanel({ splitCount, amountPerPerson, onSplitCountChange }: SplitEqualPanelProps) {
    const { t } = useLanguage();

    return (
        <div className="p-12 border-b border-white/5 shrink-0">
            <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-nano font-black text-accent-gold uppercase tracking-[0.5em] mb-3">
                        {t('pos.split.seats_control')}
                    </span>
                    <span className="text-2xl font-serif italic font-black text-text-primary">
                        {t('pos.split.convive_count')}
                    </span>
                </div>
                <div className="flex items-center gap-8 bg-surface-card/[0.02] rounded-[32px] p-3 border border-white/5 shadow-inner">
                    <button
                        onClick={() => onSplitCountChange(Math.max(2, splitCount - 1))}
                        className="w-14 h-14 rounded-[22px] bg-surface-glass border border-border shadow-premium flex items-center justify-center hover:text-accent-gold transition-all duration-300 active:scale-90"
                    >
                        <Minus className="w-6 h-6" />
                    </button>
                    <span className="w-16 text-center text-5xl font-serif font-black italic text-accent-gold drop-shadow-glow">
                        {splitCount}
                    </span>
                    <button
                        onClick={() => onSplitCountChange(splitCount + 1)}
                        className="w-14 h-14 rounded-[22px] bg-surface-glass border border-border shadow-premium flex items-center justify-center hover:text-accent-gold transition-all duration-300 active:scale-90"
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
                    <span className="text-micro font-black text-text-primary/60 uppercase tracking-[0.4em]">
                        {t('pos.split.investment_per_seat')}
                    </span>
                </div>
                <span className="text-5xl font-serif font-black italic text-accent-gold drop-shadow-glow">
                    {formatCurrency(SovereignMath.toCents(BigInt(Math.round(amountPerPerson))))}
                </span>
            </div>
        </div>
    );
}
