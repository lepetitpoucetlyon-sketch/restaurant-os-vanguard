"use client";

import { useMemo } from "react";
import { Minus, Plus, ChefHat, CreditCard, Users, Sparkles, X, MoreHorizontal, Trash2, Percent } from "lucide-react";
import { ScrollArea } from "@ui/scroll-area";
import { cn } from "@/lib/ui.foundations";;
import { motion, AnimatePresence } from "framer-motion";

import { usePageSetting } from "@/shared/components/settings/ContextualSettings";
import { useIntelligence } from "@/modules/ops/providers";
        // FIXME (Modular Monolith): Remove cross-module import. Use domain/ or NexusEventBus.
        // eslint-disable-next-line vanguard/no-inter-module-imports
import { useNexusFleet } from "@/modules/intelligence/fleet";
import { useLanguage } from "@/shared/hooks";
        // FIXME (Modular Monolith): Remove cross-module import. Use domain/ or NexusEventBus.
        // eslint-disable-next-line vanguard/no-inter-module-imports
import { formatMu } from "@/modules/finance/components/financeUtils";
import { useIsMobile } from "@/shared/hooks";
import { POSService } from "@/infrastructure/adapters/POSAdapter";
import { CartItem } from "@modules/ops/engine/types";
import { SovereignMath } from "@/shared/services/SovereignMath";

interface CartProps {
    items: CartItem[];
    onUpdateQuantity: (cartId: string, delta: number) => void;
    onClearCart: () => void;
    onCheckout: () => void;
    onSendToKitchen: () => void;
    onSplitBill: () => void;
    tableNumber?: string;
    guestCount?: number;
    showClose?: boolean;
    onClose?: () => void;
    /** Called when staff taps the "⋯" action button on a cart item (discount / offer / cancel). */
    onItemContextMenu?: (cartId: string, item: CartItem) => void;
}

const SwipeableCartItem = ({ item, priceMultiplier, onUpdateQuantity, onItemContextMenu }: { item: CartItem, priceMultiplier: number, onUpdateQuantity: (id: string, d: number) => void, onItemContextMenu?: (id: string, item: CartItem) => void }) => {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="group relative overflow-hidden rounded-[20px] bg-bg-secondary mb-8"
        >
            {/* Background Actions (Revealed on Swipe) */}
            <div className="absolute inset-y-0 right-0 flex items-center justify-end px-4 gap-2 w-[120px] bg-surface-sidebar/50">
                <button
                    onClick={() => onItemContextMenu?.(item.cartId, item)}
                    className="w-10 h-10 rounded-full bg-accent-gold/20 flex items-center justify-center text-accent-gold hover:bg-accent-gold/40 transition-colors"
                >
                    <Percent className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onItemContextMenu?.(item.cartId, item)} // The context menu handles cancel/refund
                    className="w-10 h-10 rounded-full bg-status-error/20 flex items-center justify-center text-status-error hover:bg-status-error/40 transition-colors"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {/* Foreground Draggable Content */}
            <motion.div
                drag="x"
                dragConstraints={{ left: -120, right: 0 }}
                dragElastic={0.1}
                whileTap={{ cursor: "grabbing" }}
                className="relative bg-bg-secondary p-4 rounded-[20px] border border-border/30 flex flex-col gap-4 shadow-[0_5px_15px_-10px_rgba(0,0,0,0.3)] z-10"
            >
                <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-xl bg-accent-gold/10 text-accent-gold flex items-center justify-center font-serif font-black italic text-xs">
                            {item.quantity}
                        </div>
                        <div className="min-w-0">
                            <h4 className="text-[14px] font-black text-text-primary uppercase tracking-tight">{item.name}</h4>
                            {(item.modifiers?.length || 0) > 0 && (
                                <p className="text-[8px] text-text-muted mt-1 uppercase font-black tracking-widest">{item.modifiers?.map(m => m.name).join(", ")}</p>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                        {item.originalPriceInMicrounits && (
                            <span className="text-[10px] line-through opacity-40 font-mono text-status-error">
                                {formatMu(Math.round(Number(item.originalPriceInMicrounits) * priceMultiplier) * item.quantity)}
                            </span>
                        )}
                        <span className="text-sm font-serif font-black italic">{formatMu(Math.round(Number(item.unitPriceInMicrounits) * priceMultiplier) * item.quantity)}</span>
                        <span className="text-[10px] opacity-40 font-mono">{formatMu(Math.round(Number(item.unitPriceInMicrounits) * priceMultiplier))} unit</span>
                        
                        {item.isOffer && (
                            <span className="text-[8px] font-black uppercase tracking-widest bg-status-success/10 text-status-success border border-emerald-500/20 px-2 py-0.5 rounded-full">
                                OFFERT
                            </span>
                        )}
                        {!item.isOffer && (item.discountPercent ?? 0) > 0 && (
                            <span className="text-[8px] font-black uppercase tracking-widest bg-accent-gold/10 text-accent-gold border border-accent-gold/20 px-2 py-0.5 rounded-full">
                                -{item.discountPercent}%
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-end gap-2 pr-1">
                    <button onClick={() => onUpdateQuantity(item.cartId, -1)} className="w-8 h-8 rounded-lg bg-bg-tertiary flex items-center justify-center text-text-muted">
                        <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-mono font-bold">{item.quantity}</span>
                    <button onClick={() => onUpdateQuantity(item.cartId, 1)} className="w-8 h-8 rounded-lg bg-bg-tertiary flex items-center justify-center text-text-muted">
                        <Plus className="w-3 h-3" />
                    </button>
                    {/* Keep the ellipsis button for non-touch users or quick access */}
                    {onItemContextMenu && (
                        <button
                            onClick={() => onItemContextMenu(item.cartId, item)}
                            className="w-8 h-8 rounded-lg bg-bg-tertiary/60 flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-colors ml-4"
                            title="Actions (remise / offrir / annuler)"
                        >
                            <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};


export function Cart({ items, onUpdateQuantity, onClearCart: _onClearCart, onCheckout, onSendToKitchen, onSplitBill: _onSplitBill, tableNumber, guestCount, showClose, onClose, onItemContextMenu }: CartProps) {
    const { t } = useLanguage();
    const isMobile = useIsMobile();
    const _splitBillEnabled = usePageSetting('pos', 'split_bill_enabled', true);
    const { data: config } = useIntelligence();
    const globalInflationRate = config?.globalInflationRate || 0;
    const { priceMultiplier } = useNexusFleet();

    const { totalInMicrounits, htInMicrounits, totalInCents, htInCents } = useMemo(() => {
        let totalMicro = BigInt(0);
        let htMicro = BigInt(0);

        items.forEach(item => {
            // Application du multiplicateur de flotte sur les Microunités
            const basePriceMicro = BigInt(item.unitPriceInMicrounits);
            const multipliedPriceMicro = BigInt(Math.round(Number(basePriceMicro) * priceMultiplier));
            const itemTotalMicro = multipliedPriceMicro * BigInt(item.quantity);
            
            totalMicro = BigInt(SovereignMath.add(Number(totalMicro), Number(itemTotalMicro)));
            
            const rate = item.taxRate ? parseFloat(item.taxRate) : (item.categoryId === 'cocktails' ? 0.20 : 0.10);
            const itemHtMicro = BigInt(Math.round(Number(itemTotalMicro) / (1 + rate)));
            htMicro = BigInt(SovereignMath.add(Number(htMicro), Number(itemHtMicro)));
        });

        return {
            totalInMicrounits: Number(totalMicro),
            htInMicrounits: Number(htMicro),
            // Parity mirrors kept for legacy callers (POSService.getProjectedMargin)
            totalInCents: SovereignMath.toCents(totalMicro),
            htInCents: SovereignMath.toCents(htMicro),
        };
    }, [items, priceMultiplier]);


    return (
        <div className={cn(
            "flex flex-col h-full bg-bg-secondary transition-colors duration-500",
            !isMobile ? "border-l border-border w-[400px]" : "w-full"
        )}>
            {/* Cart Header */}
            <div className="p-6 lg:p-8 border-b border-border flex items-center justify-between bg-surface-card/50 dark:bg-bg-secondary/50 backdrop-blur-md">
                <div>
                    <h2 className="text-2xl lg:text-3xl font-serif font-black text-text-primary tracking-tight leading-none italic">
                        {t('pos.table')} <span className="text-accent-gold not-italic">{tableNumber || '--'}</span>.
                    </h2>
                    <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center gap-2 text-[9px] font-black text-text-muted uppercase tracking-[0.3em]">
                            <Users strokeWidth={1.5} className="w-3.5 h-3.5 text-accent-gold" />
                            {guestCount || 0} {t('common.covers')}
                        </div>
                    </div>
                </div>
                {showClose && isMobile && (
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-bg-tertiary flex items-center justify-center">
                        <X className="w-5 h-5 text-text-muted" />
                    </button>
                )}
            </div>

            {/* Items List */}
            <ScrollArea className="flex-1 bg-bg-primary/20 scrollbar-hide">
                <AnimatePresence mode="popLayout">
                    {items.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center min-h-[300px] text-center p-8"
                        >
                            <div className="w-16 h-16 rounded-[2rem] bg-bg-tertiary flex items-center justify-center mb-6">
                                <ChefHat strokeWidth={1} className="w-8 h-8 text-text-muted opacity-40" />
                            </div>
                            <h3 className="text-base font-serif font-black text-text-primary italic">{t('pos.cart.empty')}</h3>
                        </motion.div>
                    ) : (
                        <div className="p-6 lg:p-10 space-y-8">
                            {items.map((item) => (
                                <SwipeableCartItem
                                    key={item.cartId}
                                    item={item}
                                    priceMultiplier={priceMultiplier}
                                    onUpdateQuantity={onUpdateQuantity}
                                    onItemContextMenu={onItemContextMenu}
                                />
                            ))}
                        </div>
                    )}
                </AnimatePresence>
            </ScrollArea>

            {/* Bottom Panel */}
            <div className="p-6 lg:p-10 border-t border-border/50 bg-surface-card/50 dark:bg-surface-sidebar/20 backdrop-blur-3xl">
                <div className="space-y-4 mb-8">
                    <div className="flex justify-between items-center text-[10px] font-black text-text-muted uppercase tracking-widest">
                        <span>{t('pos.cart.subtotal')}</span>
                        <div className="flex items-center gap-4">
                            {totalInMicrounits > 0 && (
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-accent-gold/10 rounded-full border border-accent-gold/20">
                                    <Sparkles className="w-3 h-3 text-accent-gold" />
                                    <span className="text-accent-gold font-black">MARGE PROJETÉE : {POSService.getProjectedMargin(totalInCents / 100, globalInflationRate).toFixed(1)}%</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex justify-between text-text-muted mt-1 px-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Tax (HT)</span>
                        <span className="font-mono text-sm">{formatMu(htInMicrounits)}</span>
                    </div>
                    <div className="flex justify-between items-baseline mt-2 pt-2 border-t border-subtle px-1">
                        <span className="text-sm font-serif font-black italic text-accent-gold">TOTAL TTC</span>
                        <span className="text-4xl font-serif font-black italic text-text-primary tracking-tighter drop-shadow-glow">
                            {formatMu(totalInMicrounits)}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={onSendToKitchen}
                        disabled={items.length === 0}
                        className="h-16 flex flex-col items-center justify-center gap-1.5 bg-bg-tertiary text-text-muted rounded-[2rem] disabled:opacity-30"
                    >
                        <ChefHat className="w-5 h-5" />
                        <span className="text-[8px] font-black uppercase tracking-[0.2em]">{t('pos.cart.kitchen')}</span>
                    </button>
                    <button
                        onClick={onCheckout}
                        disabled={items.length === 0}
                        className="h-16 flex flex-col items-center justify-center gap-1.5 bg-accent-gold text-text-primary rounded-[2rem] shadow-xl shadow-accent-gold/20 disabled:opacity-30"
                    >
                        <CreditCard className="w-6 h-6" />
                        <span className="text-[8px] font-black uppercase tracking-[0.2em]">{t('pos.cart.checkout')}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
