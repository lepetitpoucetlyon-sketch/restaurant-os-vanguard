"use client";

import { cn } from "@/lib/ui.foundations";
import { useLanguage } from "@/shared/hooks/useLanguage";
import type { CartItem } from '../../../../workflow/engine/types';
import type { ConvivePayment } from './types';
import { Button } from "@/shared/components/ui/Button";

interface SplitByItemPanelProps {
    items: CartItem[];
    convivePayments: ConvivePayment[];
    selectedItems: Record<number, string[]>;
    onToggleItem: (conviveIdx: number, cartId: string) => void;
}

export function SplitByItemPanel({
    items,
    convivePayments,
    selectedItems,
    onToggleItem,
}: SplitByItemPanelProps) {
    const { t } = useLanguage();

    return (
        <div className="px-12 py-8 border-b border-white/5 shrink-0 overflow-y-auto max-h-56 elegant-scrollbar">
            <p className="text-nano font-black uppercase tracking-[0.3em] text-text-primary/40 mb-4">
                {t('pos.split.assign_items')}
            </p>
            <div className="space-y-2">
                {items.map((item) => (
                    <div
                        key={item.cartId}
                        className="flex items-center justify-between gap-4 px-5 py-3 rounded-2xl bg-surface-card/[0.04] border border-white/5"
                    >
                        <span className="text-xs font-semibold text-text-primary/80 truncate max-w-[140px]">
                            {item.name} ×{item.quantity}
                        </span>
                        <div className="flex gap-2 shrink-0">
                            {convivePayments.map((_, idx) => {
                                const isAssigned = (selectedItems[idx] || []).includes(item.cartId);
                                return (
                                    <Button variant="ghost"
                                        key={idx}
                                        onClick={() => onToggleItem(idx, item.cartId)}
                                        className={cn(
                                            "w-7 h-7 rounded-xl text-nano font-black transition-all duration-300 border",
                                            isAssigned
                                                ? "bg-accent-gold text-primary border-accent-gold"
                                                : "bg-transparent border-white/10 text-text-primary/40 hover:border-accent-gold/40 hover:text-accent-gold"
                                        )}
                                    >
                                        {idx + 1}
                                    </Button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
