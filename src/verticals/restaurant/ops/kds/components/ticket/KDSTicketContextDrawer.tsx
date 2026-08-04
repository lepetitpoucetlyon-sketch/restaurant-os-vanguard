import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Order } from "@nexus/contracts";
import { cn } from "@/lib/ui.foundations";
import { resolveStation } from "@verticals/restaurant/ops/kds";

interface KDSTicketContextDrawerProps {
    ticket: Order;
    fullOrder?: Order;
    fullOrderGroupedBySeat: Record<string, { id?: string, name?: string }[]>;
    isContextOpen: boolean;
    setIsContextOpen: (open: boolean) => void;
}

export function KDSTicketContextDrawer({
    ticket,
    fullOrder,
    fullOrderGroupedBySeat,
    isContextOpen,
    setIsContextOpen
}: KDSTicketContextDrawerProps) {
    if (Object.keys(fullOrderGroupedBySeat).length === 0) return null;

    return (
        <div className="border-t border-subtle bg-surface-bg/30">
            <button
                onClick={() => setIsContextOpen(!isContextOpen)}
                className="w-full flex items-center justify-between p-4 text-secondary hover:text-primary hover:bg-surface-bg transition-colors"
            >
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.15em]">Commande Complète (Accords)</span>
                    <span className="px-2 py-0.5 rounded-full bg-surface-card border border-subtle text-[9px] font-black">
                        {fullOrder?.items.length}
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
                                    <div className="text-[10px] font-bold text-muted uppercase tracking-wider pl-1 border-b border-subtle pb-1">
                                        {seat === 'Partagé' ? 'À Partager' : `Convive ${seat}`}
                                    </div>
                                    {items.map((cItem: { id?: string, name?: string, quantity?: number }, i: number) => {
                                        const station = resolveStation(cItem.name as string);
                                        const isActiveStation = ticket.items.some(ti => (ti.id || ti.name) === (cItem.id || cItem.name));
                                        return (
                                            <div key={`${cItem.id || cItem.name}-${i}`} 
                                                 className={cn(
                                                     "flex items-center justify-between p-2 rounded-lg border",
                                                     isActiveStation 
                                                         ? "bg-surface-card border-accent-gold/30 shadow-sm" 
                                                         : "bg-surface-bg/50 border-subtle opacity-75 grayscale-[0.5]"
                                                 )}>
                                                <div className="flex items-center gap-3">
                                                    <div className={cn("w-1.5 h-1.5 rounded-full", isActiveStation ? "bg-accent-gold" : "bg-secondary")} />
                                                    <div className="flex flex-col">
                                                        <span className={cn("text-xs font-bold", isActiveStation ? "text-primary" : "text-secondary")}>
                                                            {cItem.quantity && (cItem.quantity as number) > 1 ? `${cItem.quantity}x ` : ''}{cItem.name as string}
                                                        </span>
                                                        <span className="text-[9px] text-muted uppercase tracking-wider">{station}</span>
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
