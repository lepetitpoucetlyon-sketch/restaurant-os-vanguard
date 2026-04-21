"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users,
    Calendar,
    ArrowDown,
    Info,
    ChevronLeft,
    ChevronRight,
    Timer,
    CheckCircle2,
    AlertCircle,
    Star,
    UtensilsCrossed,
    Wallet,
    Clock,
} from "lucide-react";
import { useOrders, useReservations } from "@/engines/ops/NexusOpsProvider";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/ui.foundations";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TableInsightPanelProps {
    selectedTable: import('@/types').Table | null;
    onClose: () => void;
    onCheckout?: (total: number) => void;
}

export function TableInsightPanel({ selectedTable, onClose, onCheckout }: TableInsightPanelProps) {
    const { data: orders, isLoading: ordersLoading } = useOrders();
    const { data: reservations, isLoading: resLoading } = useReservations();

    const data = useMemo(() => {
        if (!selectedTable || !orders || !reservations) return null;

        const tableOrders = (orders || []).filter((o: import('@/types').Order) => o.tableId === selectedTable.id && o.status !== 'paid' && o.status !== 'cancelled');
        const activeOrder = tableOrders[0];
        
        const tableReservations = (reservations || []).filter((r: import('@/types').Reservation) => r.tableId === selectedTable.id);
        const today = new Date();
        const activeReservation = tableReservations?.find((r: import('@/types').Reservation) => {
            const rDate = new Date(r.date);
            const diff = Math.abs(today.getTime() - rDate.getTime());
            return diff < (2 * 60 * 60 * 1000);
        });

        const isSeatedWithReservation = !!activeOrder && !!activeReservation;
        const displayName = activeReservation?.customerName || activeOrder?.customerName || (activeOrder ? "Client" : "Non assigné");

        return {
            activeOrder,
            activeReservation,
            isSeatedWithReservation,
            displayName,
            tableReservations
        };
    }, [selectedTable, orders, reservations]);

    if (ordersLoading || resLoading) return null;

    if (!selectedTable || !data) return null;

    const { activeOrder, activeReservation, isSeatedWithReservation, displayName } = data;

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={selectedTable.id}
                initial={{ x: "100%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "100%", opacity: 0 }}
                transition={{ type: "spring", damping: 30, stiffness: 200 }}
                className="fixed top-24 right-8 w-[420px] bg-bg-secondary/95 backdrop-blur-3xl rounded-[40px] shadow-[20px_40px_100px_rgba(0,0,0,0.1)] dark:shadow-[20px_40px_100px_rgba(0,0,0,0.5)] border border-black/5 dark:border-white/10 z-[100] overflow-hidden flex flex-col h-[calc(100vh-140px)]"
            >
                {/* Header with Close Button */}
                <div className="p-8 pb-4 flex items-start justify-between relative z-10">
                    <button
                        onClick={onClose}
                        className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center text-text-muted hover:text-text-primary dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 transition-all active:scale-95 shadow-lg shrink-0"
                    >
                        <ChevronRight strokeWidth={2.5} className="w-5 h-5" />
                    </button>
                    <div className="flex flex-col items-end text-right">
                        <p className="text-[10px] font-black text-accent uppercase tracking-[0.3em] mb-3">Intelligence Table • Direct</p>
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm",
                                activeOrder
                                    ? "bg-indigo-500/10 text-indigo-500 border-indigo-500/20"
                                    : "bg-bg-tertiary text-text-muted border-border"
                            )}>
                                {activeOrder ? "Occupée" : "Libre"}
                            </div>
                            <h2 className="text-4xl font-serif font-light text-text-primary italic tracking-tight">Table {selectedTable.number}</h2>
                        </div>
                    </div>
                </div>

                <ScrollArea className="flex-1 elegant-scrollbar px-8 pb-32">
                    <div className="space-y-10 py-6">
                        {/* Diagnostic Flow Section */}
                        <div className="relative space-y-4">
                            <div className="absolute left-[23px] top-6 bottom-6 w-px bg-gradient-to-b from-accent/50 via-indigo-500/50 to-emerald-500/50 opacity-20" />

                            {/* Step 1: Reservation Status */}
                            <div className={cn(
                                "group flex items-center gap-6 p-5 rounded-[28px] transition-all duration-500 border relative z-10",
                                activeReservation
                                    ? "bg-bg-primary border-accent/30 shadow-xl shadow-accent/10"
                                    : "bg-bg-primary/40 border-border opacity-60"
                            )}>
                                <div className={cn(
                                    "w-12 h-12 rounded-[18px] flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110",
                                    activeReservation
                                        ? "bg-accent text-bg-primary shadow-accent/20"
                                        : "bg-bg-tertiary text-text-muted"
                                )}>
                                    <Calendar strokeWidth={2} className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-[9px] font-black uppercase tracking-widest text-text-muted/60 mb-1">Status Réservation</h4>
                                    <p className="text-[14px] font-bold text-text-primary tracking-tight">
                                        {activeReservation ? activeReservation.customerName : "Aucune résa détectée"}
                                    </p>
                                </div>
                            </div>

                            {/* Step 2: Presence Analysis */}
                            <div className={cn(
                                "group flex items-center gap-6 p-5 rounded-[28px] transition-all duration-500 border relative z-10",
                                activeOrder
                                    ? "bg-bg-primary border-indigo-500/30 shadow-xl shadow-indigo-500/10"
                                    : "bg-bg-primary/40 border-border opacity-60"
                            )}>
                                <div className={cn(
                                    "w-12 h-12 rounded-[18px] flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110",
                                    activeOrder
                                        ? "bg-indigo-500 text-white shadow-indigo-500/20"
                                        : "bg-bg-tertiary text-text-muted"
                                )}>
                                    <Users strokeWidth={2} className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-[9px] font-black uppercase tracking-widest text-text-muted/60 mb-1">Détection de Présence</h4>
                                    <p className="text-[14px] font-bold text-text-primary tracking-tight">
                                        {activeOrder ? (displayName || "Client Détecté") : "Capteurs Inactifs"}
                                    </p>
                                </div>
                            </div>

                            {/* Step 3: Correlation Verdict */}
                            <div className={cn(
                                "group flex items-center gap-6 p-5 rounded-[28px] transition-all duration-500 border relative z-10",
                                isSeatedWithReservation
                                    ? "bg-bg-primary border-emerald-500/30 shadow-xl shadow-emerald-500/10"
                                    : "bg-bg-primary/40 border-border opacity-60"
                            )}>
                                <div className={cn(
                                    "w-12 h-12 rounded-[18px] flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110",
                                    isSeatedWithReservation
                                        ? "bg-emerald-500 text-white shadow-emerald-500/20"
                                        : "bg-bg-tertiary text-text-muted"
                                )}>
                                    <CheckCircle2 strokeWidth={2} className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-[9px] font-black uppercase tracking-widest text-text-muted/60 mb-1">Verdict Logique</h4>
                                    <p className="text-[14px] font-serif italic font-medium text-text-primary leading-tight">
                                        {isSeatedWithReservation ? "Réservation Honorée" : activeOrder ? "Passage Spontané" : "Table Disponible"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Preferences Insight Card */}
                        {activeReservation?.notes && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-6 bg-accent/5 border border-accent/20 rounded-[32px] space-y-3 shadow-inner"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                                        <Star className="w-4 h-4 text-accent" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent/80">Intelligence Client</span>
                                </div>
                                <p className="text-[14px] text-text-primary leading-relaxed font-serif italic pl-11">
                                    "{activeReservation.notes}"
                                </p>
                            </motion.div>
                        )}

                        {/* Financial Intelligence (Ticket) */}
                        {activeOrder && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-bg-tertiary dark:bg-neutral-900 p-8 rounded-[40px] space-y-8 shadow-2xl relative overflow-hidden ring-1 ring-black/5 dark:ring-white/10"
                            >
                                {/* Visual Polish */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 -mr-32 -mt-32 rounded-full blur-[100px] pointer-events-none" />
                                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />

                                <div className="flex items-center justify-between relative z-10">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2 opacity-60">
                                            <Wallet className="w-3.5 h-3.5 text-accent" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-text-primary dark:text-white">RELEVÉ TICKET</span>
                                        </div>
                                        <p className="text-[11px] font-black uppercase tracking-widest text-text-muted dark:text-white/30">Intelligence Financière</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-4xl font-mono font-light text-emerald-500 dark:text-[#00D9A6] tracking-tighter shadow-glow-accent">{formatCurrency(activeOrder.totalInCents / 100)}</span>
                                        <span className="text-[9px] font-black text-text-muted dark:text-white/20 uppercase tracking-widest mt-1">Total TTC Direct</span>
                                    </div>
                                </div>

                                <div className="space-y-6 relative z-10">
                                    {activeOrder.items.map((item, i) => (
                                        <div key={i} className="flex justify-between items-start group">
                                            <div className="flex flex-col gap-1.5 flex-1">
                                                <div className="flex items-baseline gap-2">
                                                    <span className="w-6 h-6 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-center text-[10px] font-mono text-text-muted dark:text-white/40 border border-black/5 dark:border-white/5">{item.quantity}</span>
                                                    <span className="text-[14px] font-medium text-text-primary dark:text-neutral-200 group-hover:text-black dark:group-hover:text-white transition-colors">{item.name}</span>
                                                </div>
                                                {item.notes && (
                                                    <div className="ml-8 flex items-start gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50 mt-1.5 shrink-0" />
                                                        <span className="text-[11px] text-amber-500/70 italic leading-snug">"{item.notes}"</span>
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-[13px] font-mono font-bold text-text-muted dark:text-white/40 mt-1">{formatCurrency((item.priceInCents * item.quantity) / 100)}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-8 border-t border-black/5 dark:border-white/5 flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-2xl bg-black/5 dark:bg-white/5 flex items-center justify-center border border-black/10 dark:border-white/10">
                                            <Timer className="w-4 h-4 text-text-muted dark:text-white/40" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-text-muted/40 dark:text-white/20">Durée Table</span>
                                            <span className="text-[12px] font-mono font-bold text-text-primary dark:text-white/70 italic">45:12</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => onCheckout?.(activeOrder.totalInCents / 100)}
                                        className="h-14 px-8 rounded-2xl bg-accent hover:bg-black dark:hover:bg-white text-bg-primary dark:text-bg-primary hover:text-white dark:hover:text-black text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-amber-500/10 active:scale-95"
                                    >
                                        Encaisser
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* Pre-arrival Alert */}
                        {!activeOrder && activeReservation && (
                            <div className="p-8 bg-amber-500/10 border border-amber-500/20 rounded-[32px] flex gap-5 shadow-inner">
                                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center shrink-0">
                                    <Clock className="w-6 h-6 text-amber-500" />
                                </div>
                                <div>
                                    <p className="text-[13px] font-bold text-amber-500/90 leading-relaxed italic font-serif">
                                        "Arrivée imminente (~12 min). Protocoles VIP confirmés pour {activeReservation.customerName}."
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </motion.div>
        </AnimatePresence>
    );
}
