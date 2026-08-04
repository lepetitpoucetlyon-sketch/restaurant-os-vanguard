import { Users, DivideCircle, CreditCard, Minus, Plus, Sparkles } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { formatCurrency } from "@/lib/formatters";
import { SovereignMath } from "@/shared/services/SovereignMath";
import { SplitMode, ConvivePayment } from "./SplitBillTypes";
import { CartItem } from "@/verticals/restaurant/ops/workflow/engine/types";

interface SplitBillMethodsProps {
    mode: SplitMode;
    setMode: (mode: SplitMode) => void;
    splitCount: number;
    syncSplitState: (count: number) => void;
    amountPerPerson: number;
    items: CartItem[];
    convivePayments: ConvivePayment[];
    selectedItems: Record<number, string[]>;
    setSelectedItems: (updater: (prev: Record<number, string[]>) => Record<number, string[]>) => void;
    customAmounts: number[];
    setCustomAmounts: (updater: (prev: number[]) => number[]) => void;
}

export function SplitBillMethods({
    mode,
    setMode,
    splitCount,
    syncSplitState,
    amountPerPerson,
    items,
    convivePayments,
    selectedItems,
    setSelectedItems,
    customAmounts,
    setCustomAmounts
}: SplitBillMethodsProps) {
    const { t } = useLanguage();

    return (
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

            {mode === 'equal' && (
                <div className="p-12 border-b border-white/5 shrink-0 relative z-10 bg-surface-sidebar/10">
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
                <div className="px-12 py-8 border-b border-white/5 shrink-0 overflow-y-auto max-h-56 elegant-scrollbar relative z-10 bg-surface-sidebar/10">
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
                <div className="px-12 py-8 border-b border-white/5 shrink-0 relative z-10 bg-surface-sidebar/10">
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
        </>
    );
}
