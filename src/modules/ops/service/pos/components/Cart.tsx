"use client";

import { useMemo } from "react";
import { Minus, Plus, ChefHat, CreditCard, Users, X, MoreHorizontal } from "lucide-react";
import { ScrollArea } from "@ui/ScrollArea";
import { cn } from "@/lib/ui.foundations";;
import { motion, AnimatePresence } from "framer-motion";

import { usePageSetting, SettingsGearButton } from "@/shared/components/settings/ContextualSettings";
import { useIntelligence } from '../../../providers/hooks/catalogHooks';
import { useNexusFleet } from "@/shared/providers/fleet/NexusFleetProvider";
import { ActionGuard } from '@/shared/components/rbac/ActionGuard';
import { formatMu } from "@/lib/formatters";
import { useLanguage } from "@/shared/hooks/useLanguage";
import { useIsMobile } from "@/shared/hooks/useIsMobile";
import { CartItem } from '../../../workflow/engine/types';
import { SovereignMath } from "@/shared/services/SovereignMath";
import { FiscalReceiptSealZone } from "@/shared/components/ui/FiscalReceiptSealZone";

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
    const itemTotalMicro = Math.round(Number(item.unitPriceInMicrounits) * priceMultiplier) * item.quantity;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="group relative overflow-hidden rounded-xl bg-surface-card dark:bg-bg-secondary border border-border/70 dark:border-white/10 mb-2.5 p-3"
        >
            <div className="flex justify-between items-start gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-action-primary/10 text-action-primary flex items-center justify-center font-mono font-bold text-xs shrink-0">
                            {item.quantity}
                        </span>
                        <h4 className="text-sm font-semibold text-text-primary truncate">
                            {item.name}
                        </h4>
                    </div>

                    {(item.modifiers?.length || 0) > 0 && (
                        <p className="text-xs text-text-muted mt-1 truncate pl-7">
                            {item.modifiers?.map(m => m.name).join(", ")}
                        </p>
                    )}
                </div>

                <div className="text-right shrink-0">
                    <span className="text-sm font-bold font-mono text-text-primary tabular-nums">
                        {formatMu(itemTotalMicro)}
                    </span>
                    {item.isOffer && (
                        <span className="block text-[10px] font-bold uppercase text-status-success bg-status-success/10 px-1.5 py-0.5 rounded">
                            Offert
                        </span>
                    )}
                    {!item.isOffer && (item.discountPercent ?? 0) > 0 && (
                        <span className="block text-[10px] font-bold uppercase text-action-primary bg-action-primary/10 px-1.5 py-0.5 rounded">
                            -{item.discountPercent}%
                        </span>
                    )}
                </div>
            </div>

            {/* Actions: Steppers + Ellipsis */}
            <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-border/40">
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => onUpdateQuantity(item.cartId, -1)}
                        className="w-7 h-7 rounded-lg bg-bg-tertiary hover:bg-border flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
                        title="Diminuer"
                    >
                        <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-mono font-bold">{item.quantity}</span>
                    <button
                        onClick={() => onUpdateQuantity(item.cartId, 1)}
                        className="w-7 h-7 rounded-lg bg-bg-tertiary hover:bg-border flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
                        title="Augmenter"
                    >
                        <Plus className="w-3 h-3" />
                    </button>
                </div>

                {onItemContextMenu && (
                    <button
                        onClick={() => onItemContextMenu(item.cartId, item)}
                        className="w-7 h-7 rounded-lg bg-bg-tertiary/60 hover:bg-bg-tertiary flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
                        title="Actions (remise / offrir / annuler)"
                    >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
        </motion.div>
    );
};


export function Cart({ items, onUpdateQuantity, onClearCart: _onClearCart, onCheckout, onSendToKitchen, onSplitBill, tableNumber, guestCount, showClose, onClose, onItemContextMenu }: CartProps) {
    const { t } = useLanguage();
    const isMobile = useIsMobile();
    const splitBillEnabled = usePageSetting('pos', 'split_bill_enabled', true);
    const { data: config } = useIntelligence();
    const globalInflationRate = config?.globalInflationRate || 0;
    const { priceMultiplier } = useNexusFleet();

    const { totalInMicrounits, htInMicrounits } = useMemo(() => {
        let totalMicro = BigInt(0);
        let htMicro = BigInt(0);

        items.forEach(item => {
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
        };
    }, [items, priceMultiplier]);

    return (
        <div className={cn(
            "flex flex-col h-full bg-surface-card dark:bg-bg-secondary transition-colors duration-200",
            !isMobile ? "border-l border-border w-[380px] lg:w-[420px]" : "w-full"
        )}>
            {/* Cart Header */}
            <div className="p-5 border-b border-border flex items-center justify-between bg-surface-card dark:bg-bg-secondary">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-action-primary">Commande</span>
                    </div>
                    <h2 className="text-xl font-bold text-text-primary tracking-tight mt-0.5">
                        {t('pos.table')} {tableNumber || '--'}
                    </h2>
                    <div className="flex items-center gap-2 text-xs text-text-muted mt-1 font-medium">
                        <Users className="w-3.5 h-3.5 text-action-primary" />
                        <span>{guestCount || 0} {t('common.covers')}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <SettingsGearButton pageKey="pos" className="h-9 w-9 shrink-0" />
                    {showClose && isMobile && (
                        <button aria-label="Fermer" onClick={onClose} className="w-9 h-9 rounded-lg bg-bg-tertiary flex items-center justify-center">
                            <X className="w-4 h-4 text-text-muted" />
                        </button>
                    )}
                </div>
            </div>

            {/* Items List */}
            <ScrollArea className="flex-1 bg-bg-primary/30 p-4">
                <AnimatePresence mode="popLayout">
                    {items.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center justify-center min-h-[220px] text-center p-6 text-text-muted"
                        >
                            <ChefHat className="w-10 h-10 mb-3 opacity-30" />
                            <p className="text-sm font-medium">{t('pos.cart.empty')}</p>
                            <p className="text-xs text-text-muted mt-1">Sélectionnez des articles pour commencer</p>
                        </motion.div>
                    ) : (
                        <div>
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
            <div className="p-5 border-t border-border bg-surface-card dark:bg-bg-secondary space-y-3">
                <FiscalReceiptSealZone zoneId="fiscal-seal-receipt-total">
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-text-muted font-medium">
                            <span>Total HT</span>
                            <span className="font-mono">{formatMu(htInMicrounits)}</span>
                        </div>
                        <div className="flex justify-between items-baseline pt-2 border-t border-border">
                            <span className="text-sm font-bold text-text-primary">Total TTC</span>
                            <span className="text-2xl font-bold font-mono text-text-primary tracking-tight tabular-nums">
                                {formatMu(totalInMicrounits)}
                            </span>
                        </div>
                    </div>
                </FiscalReceiptSealZone>

                {splitBillEnabled && (
                    <ActionGuard page="pos" action="split_payment" disabledMode="disable" disabledReason="Split — réservé au serveur ou plus">
                    <button
                        onClick={onSplitBill}
                        disabled={items.length === 0}
                        className="w-full py-2.5 flex items-center justify-center gap-2 bg-bg-tertiary hover:bg-border text-text-secondary hover:text-text-primary text-xs font-semibold rounded-xl disabled:opacity-40 transition-colors border border-border"
                    >
                        <Users className="w-3.5 h-3.5" />
                        <span>{t('pos.split_bill', "Partager l'addition")}</span>
                    </button>
                    </ActionGuard>
                )}

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                    <button
                        onClick={onSendToKitchen}
                        disabled={items.length === 0}
                        className="min-h-[var(--density-min-target,44px)] py-3 flex items-center justify-center gap-2 bg-bg-tertiary hover:bg-border active:scale-[var(--motion-tap-scale,0.97)] text-text-primary font-semibold text-xs rounded-xl disabled:opacity-40 transition-all border border-border"
                    >
                        <ChefHat className="w-4 h-4" />
                        <span>Cuisine</span>
                    </button>
                    <button
                        onClick={onCheckout}
                        disabled={items.length === 0}
                        className="min-h-[var(--density-min-target,44px)] py-3 flex items-center justify-center gap-2 bg-action-primary hover:opacity-95 active:scale-[var(--motion-tap-scale,0.97)] text-text-on-primary font-semibold text-xs rounded-xl disabled:opacity-40 transition-all shadow-sm"
                    >
                        <CreditCard className="w-4 h-4" />
                        <span>Encaisser</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
