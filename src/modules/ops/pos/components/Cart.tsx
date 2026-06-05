"use client";

import { useMemo } from "react";
import { Minus, Plus, ChefHat, CreditCard, Users, Sparkles, X } from "lucide-react";
import { ScrollArea } from "@ui/scroll-area";
import { cn } from "@/lib/ui.foundations";;
import { motion, AnimatePresence } from "framer-motion";

import { usePageSetting } from "@/components/settings/ContextualSettings";
import { useIntelligence } from "@/engines/ops/NexusOpsProvider";
import { useNexusFleet } from "@/engines/fleet/NexusFleetProvider";
import { useLanguage } from "@/hooks";
import { formatCurrency } from "@/lib/formatters";
import { useIsMobile } from "@/hooks";
import { POSService } from "@/infrastructure/adapters/POSAdapter";
import { CartItem } from "@modules/ops";
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
}

export function Cart({ items, onUpdateQuantity, onClearCart: _onClearCart, onCheckout, onSendToKitchen, onSplitBill: _onSplitBill, tableNumber, guestCount, showClose, onClose }: CartProps) {
    const { t } = useLanguage();
    const isMobile = useIsMobile();
    const _splitBillEnabled = usePageSetting('pos', 'split_bill_enabled', true);
    const { data: config } = useIntelligence();
    const globalInflationRate = config?.globalInflationRate || 0;
    const { priceMultiplier } = useNexusFleet();

    const { totalInCents, htInCents } = useMemo(() => {
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
            totalInCents: SovereignMath.toCents(totalMicro), 
            htInCents: SovereignMath.toCents(htMicro) 
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
                            {items.map((item, _idx) => (
                                <motion.div
                                    key={item.cartId}
                                    layout
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="group"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex gap-4">
                                            <div className="w-8 h-8 rounded-xl bg-accent-gold/10 text-accent-gold flex items-center justify-center font-serif font-black italic text-xs">
                                                {item.quantity}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-[14px] font-black text-text-primary uppercase tracking-tight">{item.name}</h4>
                                                {(item.modifiers?.length || 0) > 0 && (
                                                    <p className="text-[8px] text-text-muted mt-1 uppercase font-black tracking-widest">{item.modifiers?.join(", ")}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-sm font-serif font-black italic">{formatCurrency(SovereignMath.toCents(BigInt(Math.round(Number(item.unitPriceInMicrounits) * priceMultiplier)) * BigInt(item.quantity)))}</span>
                                            <span className="text-[10px] opacity-40 font-mono">{formatCurrency(SovereignMath.toCents(BigInt(Math.round(Number(item.unitPriceInMicrounits) * priceMultiplier))))} unit</span>
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
                                    </div>
                                </motion.div>
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
                            {totalInCents > 0 && (
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-accent-gold/10 rounded-full border border-accent-gold/20">
                                    <Sparkles className="w-3 h-3 text-accent-gold" />
                                    <span className="text-accent-gold font-black">MARGE PROJETÉE : {POSService.getProjectedMargin(totalInCents / 100, globalInflationRate).toFixed(1)}%</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex justify-between text-text-muted mt-1 px-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Tax (HT)</span>
                        <span className="font-mono text-sm">{formatCurrency(htInCents)}</span>
                    </div>
                    <div className="flex justify-between items-baseline mt-2 pt-2 border-t border-subtle px-1">
                        <span className="text-sm font-serif font-black italic text-accent-gold">TOTAL TTC</span>
                        <span className="text-4xl font-serif font-black italic text-white tracking-tighter drop-shadow-glow">
                            {formatCurrency(totalInCents)}
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
                        className="h-16 flex flex-col items-center justify-center gap-1.5 bg-accent-gold text-white rounded-[2rem] shadow-xl shadow-accent-gold/20 disabled:opacity-30"
                    >
                        <CreditCard className="w-6 h-6" />
                        <span className="text-[8px] font-black uppercase tracking-[0.2em]">{t('pos.cart.checkout')}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
