"use client";

import { CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { formatCurrency } from "@/lib/formatters";
import { SovereignMath } from "@/shared/services/SovereignMath";

interface SplitSummaryFooterProps {
    remainingAmount: number;
    allPaid: boolean;
    onComplete: () => void;
}

export function SplitSummaryFooter({
    remainingAmount,
    allPaid,
    onComplete,
}: SplitSummaryFooterProps) {
    const { t } = useLanguage();

    return (
        <div className="p-12 bg-surface-card/[0.03] backdrop-blur-3xl border-t border-white/5 flex items-center justify-between relative z-10 h-32 shrink-0">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent-gold/40 to-transparent" />

            <div className="flex flex-col">
                <span className="text-nano font-black text-accent-gold uppercase tracking-[0.6em] mb-2">
                    {t('pos.split.remaining')}
                </span>
                <div className="flex items-end gap-3">
                    <span className="text-5xl font-serif font-black italic text-text-primary leading-none tracking-tighter">
                        {formatCurrency(SovereignMath.toCents(BigInt(Math.round(remainingAmount))))}
                    </span>
                    <span className="text-xs font-black text-text-primary/20 uppercase tracking-widest mb-1 pb-1">
                        Restant
                    </span>
                </div>
            </div>

            {allPaid ? (
                <button
                    onClick={onComplete}
                    className="h-16 px-12 rounded-[28px] bg-accent-gold text-primary font-black text-[12px] uppercase tracking-[0.4em] hover:bg-surface-card shadow-glow transition-all duration-700 flex items-center gap-5 group relative overflow-hidden"
                >
                    <CheckCircle2 className="w-6 h-6 group-hover:scale-125 transition-transform duration-500" />
                    {t('pos.split.close_archive')}
                </button>
            ) : (
                <div className="flex flex-col items-center">
                    <span className="text-nano font-black text-text-primary/30 uppercase tracking-[0.5em] mb-4">
                        À encaisser maintenant
                    </span>
                    <p className="text-7xl font-serif font-black text-accent-gold italic drop-shadow-glow">
                        {formatCurrency(SovereignMath.toCents(BigInt(Math.round(remainingAmount))))}
                    </p>
                </div>
            )}
        </div>
    );
}
