'use client';

import { ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/ui.foundations";
import type { Order, OrderItem } from "@nexus/contracts";
import type { CartItem } from '../../../../workflow/engine/types';
import { resolveStation } from '../../contracts/kds-constants';
import { useLanguage } from "@/shared/hooks";

interface KDSContextDrawerProps {
    ticket: Order;
    fullOrderGroupedBySeat: Record<string, CartItem[]>;
    isContextOpen: boolean;
    onToggle: () => void;
}

/**
 * kds-7 — Tiroir "Commande Complète" affichant tous les articles regroupés par siège.
 * Permet au chef de voir les accords mets/boissons pour toute la table.
 */
export function KDSContextDrawer({
    ticket,
    fullOrderGroupedBySeat,
    isContextOpen,
    onToggle,
}: KDSContextDrawerProps) {
  const { t } = useLanguage();
    if (Object.keys(fullOrderGroupedBySeat).length === 0) return null;

    return (
        <div className="border-t border-subtle bg-surface-bg/30">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-4 text-secondary hover:text-primary hover:bg-surface-bg transition-colors"
            >
                <div className="flex items-center gap-2">
                    <span className="text-nano font-black uppercase tracking-[0.15em]">{t('kitchen.kds.completeOrder')}</span>
                    <span className="px-2 py-0.5 rounded-full bg-surface-card border border-subtle text-nano font-black">
                        {ticket.items.length}
                    </span>
                </div>
                {isContextOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            <AnimatePresence>
                {isContextOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 pt-0 flex flex-col gap-4">
                            {Object.entries(fullOrderGroupedBySeat).map(([seat, items]) => (
                                <div key={seat} className="flex flex-col gap-2">
                                    <div className="text-nano font-bold text-muted uppercase tracking-wider pl-1 border-b border-subtle pb-1">
                                        {seat === 'Partagé' ? 'À Partager' : `Convive ${seat}`}
                                    </div>
                                    {items.map((cItem, i: number) => {
                                        const station = resolveStation(cItem.name as string);
                                        const cItemKey = (cItem as { cartId?: string }).cartId || cItem.name;
                                        const isActiveStation = ticket.items.some(
                                            (ti: OrderItem) => ((ti as { cartId?: string }).cartId || ti.name) === cItemKey
                                        );
                                        return (
                                            <div
                                                key={`${cItemKey}-${i}`}
                                                className={cn(
                                                    "flex items-center justify-between p-2 rounded-lg border",
                                                    isActiveStation
                                                        ? "bg-surface-card border-accent-gold/30 shadow-sm"
                                                        : "bg-surface-bg/50 border-subtle opacity-75 grayscale-[0.5]"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={cn("w-1.5 h-1.5 rounded-full", isActiveStation ? "bg-accent-gold" : "bg-secondary")} />
                                                    <div className="flex flex-col">
                                                        <span className={cn("text-xs font-bold", isActiveStation ? "text-primary" : "text-secondary")}>
                                                            {cItem.quantity && (cItem.quantity as number) > 1 ? `${cItem.quantity}x ` : ''}{cItem.name as string}
                                                        </span>
                                                        <span className="text-nano text-muted uppercase tracking-wider">{station}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
