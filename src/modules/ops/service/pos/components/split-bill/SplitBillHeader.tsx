import React from "react";
import { DivideCircle, X } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { SovereignMath } from "@/lib/services/SovereignMath";

interface SplitBillHeaderProps {
    total: number;
    paidCount: number;
    splitCount: number;
    t: (key: string) => string;
    onClose: () => void;
}

export function SplitBillHeader({ total, paidCount, splitCount, t, onClose }: SplitBillHeaderProps) {
    return (
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
    );
}
