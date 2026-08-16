"use client";

import { useLanguage } from "@/shared/hooks/useLanguage";
import type { ConvivePayment } from './types';

interface SplitCustomPanelProps {
    convivePayments: ConvivePayment[];
    customAmounts: number[];
    onAmountChange: (conviveIndex: number, amountInMicrounits: number) => void;
}

export function SplitCustomPanel({
    convivePayments,
    customAmounts,
    onAmountChange,
}: SplitCustomPanelProps) {
    const { t } = useLanguage();

    return (
        <div className="px-12 py-8 border-b border-white/5 shrink-0">
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-text-primary/40 mb-4">
                {t('pos.split.custom_amounts')}
            </p>
            <div className="space-y-3">
                {convivePayments.map((_, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-text-primary/50">
                            {t('pos.split.master')} {idx + 1}
                        </span>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min={0}
                                step={0.01}
                                value={((customAmounts[idx] ?? 0) / 1_000_000).toFixed(2)}
                                onChange={e => {
                                    const euros = parseFloat(e.target.value);
                                    if (isNaN(euros)) return;
                                    onAmountChange(idx, Math.round(euros * 1_000_000));
                                }}
                                className="w-24 text-right bg-surface-card/[0.04] border border-white/10 rounded-xl px-3 py-2 text-accent-gold font-serif font-black text-base focus:outline-none focus:border-accent-gold/60"
                            />
                            <span className="text-text-primary/40 text-sm font-black">€</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
