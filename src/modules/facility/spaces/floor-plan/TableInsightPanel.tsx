"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users,
    Calendar,
    ChevronRight,
    Timer,
    CheckCircle2,
    Star,
    Wallet,
    Clock,
    AlertTriangle,
    Loader2,
} from "lucide-react";
import { useSovereignCollection } from "@/kernel/hooks/useSovereignCollection";
import { useTenant } from "@/shared/hooks";
import { NexusEventBus } from "@/shared/eventBus/NexusEventBus";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/formatters";
import { SovereignMath } from "@/shared/services/SovereignMath";
import { cn } from "@/lib/ui.foundations";
import { ScrollArea } from "@ui/ScrollArea";

import { Table, Order, Reservation, TableStatus } from "@nexus/contracts";

interface TableInsightPanelProps {
    selectedTable: Table | null;
    onClose: () => void;
    onCheckout?: (total: number) => void;
}

export function TableInsightPanel({ selectedTable, onClose, onCheckout }: TableInsightPanelProps) {
    const { activeTenantId } = useTenant();
    const { data: orders = [], isLoading: ordersLoading } = useSovereignCollection<Order>('orders', { tenantId: activeTenantId ?? undefined, autoSync: true });
    const { data: reservations = [], isLoading: resLoading } = useSovereignCollection<Reservation>('reservations', { tenantId: activeTenantId ?? undefined, autoSync: true });
    const { update: updateTable } = useSovereignCollection<Table>('tables', { tenantId: activeTenantId ?? undefined, autoSync: true });
    const [welcoming, setWelcoming] = useState(false);

    const data = useMemo(() => {
        if (!selectedTable || !orders || !reservations) return null;

        const tableOrders = (orders || []).filter((o: Order) => o.tableId === selectedTable.id && o.status !== 'paid' && o.status !== 'cancelled');
        const activeOrder = tableOrders[0];
        
        const tableReservations = (reservations || []).filter((r: Reservation) => r.tableId === selectedTable.id);
        const today = new Date();
        const activeReservation = tableReservations?.find((r: Reservation) => {
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

    const handleWelcomeGuest = async () => {
        if (!activeReservation || !selectedTable) return;
        setWelcoming(true);
        try {
            const declaredAllergens: string[] = (activeReservation as unknown as { allergens?: string[] }).allergens ?? [];

            await NexusEventBus.emitDurable('reservation.matched', {
                v: 1,
                tenantId: activeTenantId || 'tenant_default',
                reservationId: activeReservation.id,
                customerId: activeReservation.customerId,
                tableId: selectedTable.id,
                allergens: declaredAllergens,
                covers: activeReservation.covers ?? selectedTable.seats,
                matchedAt: Date.now(),
            });

            updateTable(selectedTable.id, { status: 'seated' as TableStatus });
            toast.success(`Client ${activeReservation.customerName} accueilli — Allergènes transmis au KDS`);
        } catch {
            toast.error("Échec lors de l'accueil du client");
        } finally {
            setWelcoming(false);
        }
    };

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={selectedTable.id}
                initial={{ x: "100%", opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: "100%", opacity: 0 }}
                transition={{ type: "spring", damping: 30, stiffness: 200 }}
                className="fixed top-24 right-2 sm:right-8 w-[calc(100vw-1rem)] sm:w-[380px] lg:w-[420px] bg-bg-secondary/95 backdrop-blur-3xl rounded-[24px] sm:rounded-[40px] shadow-[20px_40px_100px_rgba(0,0,0,0.1)] dark:shadow-[20px_40px_100px_rgba(0,0,0,0.5)] border border-black/5 dark:border-subtle z-[100] overflow-hidden flex flex-col h-[calc(100vh-140px)] max-h-[85dvh] sm:max-h-none"
            >
                {/* Header with Close Button */}
                <div className="p-8 pb-4 flex items-start justify-between relative z-10">
                    <button
                        onClick={onClose}
                        className="w-12 h-12 rounded-2xl bg-surface-glass border border-border flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-glass-hover transition-all active:scale-95 shadow-lg shrink-0"
                    >
                        <ChevronRight strokeWidth={2.5} className="w-5 h-5" />
                    </button>
                    <div className="flex flex-col items-end text-right">
                        <p className="text-nano font-black text-accent uppercase tracking-[0.3em] mb-3">Intelligence Table • Direct</p>
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "px-4 py-1.5 rounded-full text-chip-label-sm border shadow-sm",
                                activeOrder
                                    ? "bg-action-primary/10 text-brand border-focus/20"
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
                            <div className="absolute left-[23px] top-6 bottom-6 w-px bg-gradient-to-b from-accent/50 via-action-primary/50 to-status-success/50 opacity-20" />

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
                                    <h4 className="text-chip-label-sm text-text-muted/60 mb-1">Status Réservation</h4>
                                    <p className="text-[14px] font-bold text-text-primary tracking-tight">
                                        {activeReservation ? activeReservation.customerName : "Aucune résa détectée"}
                                    </p>
                                </div>
                            </div>

                            {/* Step 2: Presence Analysis */}
                            <div className={cn(
                                "group flex items-center gap-6 p-5 rounded-[28px] transition-all duration-500 border relative z-10",
                                activeOrder
                                    ? "bg-bg-primary border-focus/30 shadow-xl shadow-indigo-500/10"
                                    : "bg-bg-primary/40 border-border opacity-60"
                            )}>
                                <div className={cn(
                                    "w-12 h-12 rounded-[18px] flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110",
                                    activeOrder
                                        ? "bg-action-primary text-text-primary shadow-indigo-500/20"
                                        : "bg-bg-tertiary text-text-muted"
                                )}>
                                    <Users strokeWidth={2} className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-chip-label-sm text-text-muted/60 mb-1">Détection de Présence</h4>
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
                                        ? "bg-status-success text-text-primary shadow-emerald-500/20"
                                        : "bg-bg-tertiary text-text-muted"
                                )}>
                                    <CheckCircle2 strokeWidth={2} className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-chip-label-sm text-text-muted/60 mb-1">Verdict Logique</h4>
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
                                    <span className="text-nano font-black uppercase tracking-[0.2em] text-accent/80">Intelligence Client</span>
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
                                className="bg-surface-card p-8 rounded-[40px] space-y-8 shadow-2xl relative overflow-hidden ring-1 ring-border"
                            >
                                <div className="absolute top-0 right-0 w-64 h-64 bg-accent/10 -mr-32 -mt-32 rounded-full blur-[100px] pointer-events-none" />
                                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-action-primary/5 rounded-full blur-[80px] pointer-events-none" />

                                <div className="flex items-center justify-between relative z-10">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2 opacity-60">
                                            <Wallet className="w-3.5 h-3.5 text-accent" />
                                            <span className="text-nano font-black uppercase tracking-[0.3em] text-text-primary">RELEVÉ TICKET</span>
                                        </div>
                                        <p className="text-micro font-black uppercase tracking-widest text-text-muted">Intelligence Financière</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-4xl font-mono font-light text-status-success tracking-tighter shadow-glow-accent">{formatCurrency(SovereignMath.orderTotalMicrounits(activeOrder) / 1000000)}</span>
                                        <span className="text-nano font-black text-text-muted uppercase tracking-widest mt-1">Total TTC Direct</span>
                                    </div>
                                </div>

                                <div className="space-y-6 relative z-10">
                                    {activeOrder.items.map((item: import('@nexus/contracts/ops.types').OrderItem, i: number) => (
                                        <div key={i} className="flex justify-between items-start group">
                                            <div className="flex flex-col gap-1.5 flex-1">
                                                <div className="flex items-baseline gap-2">
                                                    <span className="w-6 h-6 rounded-lg bg-surface-glass flex items-center justify-center text-nano font-mono text-text-muted border border-border">{item.quantity}</span>
                                                    <span className="text-[14px] font-medium text-text-primary group-hover:text-action-primary transition-colors">{item.name}</span>
                                                </div>
                                                {item.notes && (
                                                    <div className="ml-8 flex items-start gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-status-warning/50 mt-1.5 shrink-0" />
                                                        <span className="text-micro text-status-warning/70 italic leading-snug">"{item.notes}"</span>
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-[13px] font-mono font-bold text-text-muted mt-1">{formatCurrency(((item as { unitPriceInMicrounits?: number }).unitPriceInMicrounits! * item.quantity) / 1000000)}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-8 border-t border-border flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-2xl bg-surface-glass flex items-center justify-center border border-border">
                                            <Timer className="w-4 h-4 text-text-muted" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-chip-label-sm text-text-muted">Durée Table</span>
                                            <span className="text-[12px] font-mono font-bold text-text-primary italic">45:12</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => onCheckout?.(SovereignMath.toCents(BigInt(SovereignMath.orderTotalMicrounits(activeOrder))))}
                                        className="h-14 px-8 rounded-2xl bg-action-primary hover:bg-action-primary-hover text-text-on-primary text-chip-label transition-all shadow-lg shadow-action-primary/10 active:scale-95"
                                    >
                                        Encaisser
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {/* Pre-arrival Alert & Welcome Guest Button */}
                        {!activeOrder && activeReservation && (
                            <div className="p-6 bg-status-warning/10 border border-action-primary/20 rounded-[32px] space-y-4 shadow-inner">
                                <div className="flex gap-4 items-center">
                                    <div className="w-12 h-12 rounded-2xl bg-status-warning/20 flex items-center justify-center shrink-0">
                                        <Clock className="w-6 h-6 text-status-warning" />
                                    </div>
                                    <div>
                                        <p className="text-[13px] font-bold text-status-warning/90 leading-relaxed italic font-serif">
                                            "Arrivée imminente. Protocoles VIP confirmés pour {activeReservation.customerName}."
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={handleWelcomeGuest}
                                    disabled={welcoming}
                                    className="w-full h-12 rounded-2xl bg-accent hover:bg-accent/90 text-bg-primary font-black text-micro uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50"
                                >
                                    {welcoming ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Transmission KDS...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="w-4 h-4" />
                                            Accueillir le Client (Check-In & Allergènes KDS)
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={() => {
                                        updateTable(selectedTable.id, { status: 'available' as TableStatus });
                                        toast.info(`Table ${selectedTable.label || selectedTable.id} libérée pour Walk-In (Scission d'urgence)`);
                                    }}
                                    className="w-full h-10 rounded-xl bg-status-danger/10 hover:bg-status-danger/20 text-status-danger font-bold text-nano uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all border border-status-danger/20"
                                >
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    Scinder / Libérer Table (No-Show Partiel)
                                </button>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </motion.div>
        </AnimatePresence>
    );
}
