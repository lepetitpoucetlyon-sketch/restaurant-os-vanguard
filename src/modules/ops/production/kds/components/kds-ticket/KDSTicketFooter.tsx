"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Flame } from "lucide-react";
import type { Order, OrderStatus } from "@nexus/contracts";

interface KDSTicketFooterProps {
    ticket: Order;
    updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
    handleMarkReady: () => Promise<void>;
}

export function KDSTicketFooter({
    ticket,
    updateOrderStatus,
    handleMarkReady,
}: KDSTicketFooterProps) {
    return (
        <div className="p-6 pt-0 mt-auto">
            <div className="h-px w-full bg-surface-bg mb-6" />
            <AnimatePresence mode="wait">
                {ticket.status === "ready" ? (
                    <motion.button
                        key="delivered"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full h-16 rounded-[20px] font-black uppercase tracking-[0.3em] text-[11px] transition-all border border-subtle bg-surface-bg text-secondary hover:bg-surface-bg hover:border-default flex items-center justify-center gap-4 active:scale-[0.98] shadow-sm group"
                        onClick={() => updateOrderStatus(ticket.id, 'delivered')}
                    >
                        <CheckCircle2 className="w-5 h-5 group-hover:text-status-success transition-colors" strokeWidth={2.5} />
                        TERMINER
                    </motion.button>
                ) : (
                    <motion.div key="progress" className="flex gap-4">
                        {ticket.status === "new" ? (
                            <button
                                className="w-full h-16 rounded-[20px] font-black uppercase tracking-[0.3em] text-[11px] transition-all bg-surface-bg text-primary hover:bg-surface-bg active:scale-[0.98] shadow-premium flex items-center justify-center gap-3"
                                onClick={() => updateOrderStatus(ticket.id, 'preparing')}
                            >
                                <Flame className="w-5 h-5 text-status-warning" strokeWidth={2.5} />
                                LANCER
                            </button>
                        ) : (
                            <button
                                className="w-full h-16 rounded-[20px] font-black uppercase tracking-[0.3em] text-[11px] transition-all bg-status-success text-text-primary hover:bg-status-success active:scale-[0.98] shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3"
                                onClick={() => { void handleMarkReady(); }}
                            >
                                <span className="flex items-center gap-3">
                                    PRÊT <CheckCircle2 className="w-5 h-5" strokeWidth={2.5} />
                                </span>
                            </button>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
