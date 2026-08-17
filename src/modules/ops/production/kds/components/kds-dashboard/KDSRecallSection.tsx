"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/ui.foundations";
import type { Order } from "@nexus/contracts";

interface KDSRecallSectionProps {
    isRecallMode: boolean;
    setIsRecallMode: (v: boolean) => void;
    isRecallLoading: boolean;
    recalledOrders: Order[];
    gridColumns: number;
    handleRenvoyer: (ticket: Order) => void;
}

export function KDSRecallSection({
    isRecallMode,
    setIsRecallMode,
    isRecallLoading,
    recalledOrders,
    gridColumns,
    handleRenvoyer,
}: KDSRecallSectionProps) {
    if (!isRecallMode) return null;

    return (
        <motion.div
            key="recall-section"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-10 mb-10"
        >
            {/* Recall header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-px h-6 bg-action-primary/50" />
                    <h2 className="text-sm font-black uppercase tracking-[0.3em] text-action-primary">
                        Rappel — {isRecallLoading ? '…' : `${recalledOrders.length} ticket${recalledOrders.length !== 1 ? 's' : ''}`}
                    </h2>
                </div>
                <button
                    onClick={() => setIsRecallMode(false)}
                    className="flex items-center gap-2 px-4 h-9 rounded-full text-[10px] font-black uppercase tracking-widest text-muted hover:text-primary border border-subtle hover:border-default bg-surface-card transition-all"
                >
                    Fermer rappel
                </button>
            </div>

            {isRecallLoading ? (
                <div className="flex items-center justify-center py-12 text-muted text-sm font-medium">
                    Chargement…
                </div>
            ) : recalledOrders.length === 0 ? (
                <div className="flex items-center justify-center py-12 text-muted text-sm font-medium">
                    Aucun ticket servi récemment
                </div>
            ) : (
                <div
                    className="grid gap-4 relative z-10"
                    style={{ gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))` }}
                >
                    {recalledOrders.map(ticket => (
                        <div
                            key={ticket.id}
                            className="relative flex flex-col rounded-[20px] border border-subtle bg-surface-bg/50 grayscale-[0.4] opacity-70 hover:opacity-90 hover:grayscale-0 transition-all duration-300 overflow-hidden"
                        >
                            {/* Muted ticket summary */}
                            <div className="flex items-center justify-between p-4 border-b border-subtle">
                                <div>
                                    <span className="font-serif italic text-2xl text-primary font-medium">
                                        Table <span className="text-accent-gold font-bold not-italic">{ticket.tableNumber ?? '?'}.</span>
                                    </span>
                                    <p className="text-[10px] font-black uppercase tracking-wider text-muted mt-0.5">
                                        {ticket.items.length} article{ticket.items.length !== 1 ? 's' : ''}
                                        {ticket.serverName ? ` · ${ticket.serverName}` : ''}
                                    </p>
                                </div>
                                <span className={cn(
                                    "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                    ticket.status === 'delivered'
                                        ? "bg-status-success/10 text-status-success border-status-success/30"
                                        : "bg-surface-card text-muted border-subtle"
                                )}>
                                    {ticket.status}
                                </span>
                            </div>

                            {/* Item list summary */}
                            <div className="flex-1 px-4 py-3 flex flex-col gap-1">
                                {(ticket.items || []).slice(0, 4).map((item, i) => (
                                    <div key={i} className="flex items-center gap-2 text-[11px] text-secondary">
                                        <span className="w-5 h-5 rounded-full bg-surface-card border border-subtle flex items-center justify-center text-[9px] font-black text-muted shrink-0">
                                            {item.quantity}
                                        </span>
                                        <span className="truncate font-medium">{item.name}</span>
                                    </div>
                                ))}
                                {ticket.items.length > 4 && (
                                    <p className="text-[10px] text-muted mt-1">+{ticket.items.length - 4} autre{ticket.items.length - 4 > 1 ? 's' : ''}</p>
                                )}
                            </div>

                            {/* Renvoyer button */}
                            <div className="p-3 pt-0">
                                <button
                                    onClick={() => handleRenvoyer(ticket)}
                                    className="w-full h-10 rounded-[14px] font-black text-[10px] uppercase tracking-[0.2em] bg-action-primary/10 text-action-primary border border-action-primary/30 hover:bg-action-primary hover:text-text-primary transition-all duration-200 active:scale-95"
                                >
                                    Renvoyer
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Divider */}
            <div className="mt-10 flex items-center gap-4">
                <div className="flex-1 h-px bg-border/40" />
                <span className="text-[9px] font-black uppercase tracking-[0.4em] text-muted">Production en cours</span>
                <div className="flex-1 h-px bg-border/40" />
            </div>
        </motion.div>
    );
}
