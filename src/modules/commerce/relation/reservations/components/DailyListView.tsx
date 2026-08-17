"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Clock, Users, UserCheck, UserX, X, MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { Reservation } from "@nexus/contracts";

interface DailyListViewProps {
    reservations: Reservation[];
    onMarkArrived: (id: string) => void;
    onMarkNoShow: (id: string) => void;
    onCancel: (id: string) => void;
    noShowConfirmId: string | null;
    setNoShowConfirmId: (id: string | null) => void;
    isLoading?: boolean;
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
    pending:   { label: 'En attente', color: 'bg-status-warning/10 text-status-warning border-status-warning/20' },
    confirmed: { label: 'Confirmée',  color: 'bg-accent/10 text-accent border-accent/20' },
    arrived:   { label: 'Arrivé',     color: 'bg-status-success/10 text-status-success border-status-success/20' },
    seated:    { label: 'En salle',   color: 'bg-status-success/10 text-status-success border-status-success/20' },
    cancelled: { label: 'Annulée',    color: 'bg-status-error/10 text-status-error border-status-error/20' },
    no_show:   { label: 'No-show',    color: 'bg-status-error/10 text-status-error border-status-error/20' },
};

export function DailyListView({
    reservations,
    onMarkArrived,
    onMarkNoShow,
    onCancel,
    noShowConfirmId,
    setNoShowConfirmId,
    isLoading,
}: DailyListViewProps) {
    const sorted = [...reservations].sort((a, b) => (a.time ?? '').localeCompare(b.time ?? ''));

    return (
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {sorted.length === 0 && isLoading ? (
                <div className="flex items-center justify-center py-24 gap-3 text-text-muted">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Chargement…</span>
                </div>
            ) : sorted.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-16 h-16 rounded-[2rem] bg-bg-tertiary flex items-center justify-center mb-6 border border-border">
                        <Clock strokeWidth={1} className="w-8 h-8 text-text-muted/50" />
                    </div>
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em]">
                        Aucune réservation pour cette journée
                    </p>
                </div>
            ) : (
                <AnimatePresence mode="popLayout">
                    {sorted.map((res, idx) => {
                        const statusInfo = STATUS_LABEL[res.status] ?? STATUS_LABEL['pending'];
                        const isActive = res.status !== 'cancelled' && res.status !== 'no_show';
                        const isConfirmingNoShow = noShowConfirmId === res.id;

                        return (
                            <motion.div
                                key={res.id}
                                layout
                                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -12, scale: 0.96 }}
                                whileHover={{ scale: 1.012, y: -2 }}
                                whileTap={{ scale: 0.995 }}
                                transition={{ type: "spring", stiffness: 260, damping: 24, delay: idx * 0.03 }}
                                className={cn(
                                    "bg-bg-secondary/70 backdrop-blur-xl border border-white/10 rounded-2xl p-4 transition-all shadow-lg hover:shadow-accent/10 hover:border-accent/30",
                                    !isActive && "opacity-50"
                                )}
                            >
                                <div className="flex items-center justify-between gap-4">
                                    {/* Time + customer */}
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-14 h-14 rounded-xl bg-accent flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/10">
                                            <span className="text-[13px] font-mono font-light text-bg-primary italic">
                                                {res.time}
                                            </span>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-serif font-light text-lg text-text-primary italic truncate leading-tight">
                                                {res.customerName}
                                            </p>
                                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                                                <span className={cn(
                                                    "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border",
                                                    statusInfo.color
                                                )}>
                                                    {statusInfo.label}
                                                </span>
                                                <span className="flex items-center gap-1 text-[10px] text-text-muted">
                                                    <Users className="w-3 h-3" />
                                                    {res.covers ?? res.partySize ?? 0}p
                                                </span>
                                                {res.tableId && (
                                                    <span className="flex items-center gap-1 text-[10px] text-text-muted">
                                                        <MapPin className="w-3 h-3" />
                                                        {String(res.tableId).replace(/^t/, '#')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions — only for active reservations */}
                                    {isActive && (
                                        <div className="flex items-center gap-1 shrink-0">
                                            {/* Mark arrived */}
                                            {res.status !== 'arrived' && res.status !== 'seated' && (
                                                <button
                                                    title="Marquer arrivée"
                                                    onClick={() => onMarkArrived(res.id)}
                                                    className="w-9 h-9 rounded-xl bg-bg-tertiary flex items-center justify-center hover:bg-status-success/10 hover:text-status-success text-text-muted transition-all"
                                                >
                                                    <UserCheck className="w-4 h-4" />
                                                </button>
                                            )}

                                            {/* No-show inline confirm */}
                                            {isConfirmingNoShow ? (
                                                <div className="flex items-center gap-1 bg-status-error/10 border border-status-error/20 rounded-xl px-2 py-1">
                                                    <span className="text-[9px] text-status-error font-black uppercase tracking-wider">
                                                        No-show ?
                                                    </span>
                                                    <button
                                                        onClick={() => { onMarkNoShow(res.id); setNoShowConfirmId(null); }}
                                                        className="w-6 h-6 rounded-lg bg-status-error flex items-center justify-center text-text-primary transition-all hover:opacity-80"
                                                        title="Confirmer no-show"
                                                    >
                                                        <UserX className="w-3 h-3" />
                                                    </button>
                                                    <button
                                                        onClick={() => setNoShowConfirmId(null)}
                                                        className="w-6 h-6 rounded-lg bg-bg-tertiary flex items-center justify-center text-text-muted transition-all hover:text-text-primary"
                                                        title="Annuler"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    title="No-show"
                                                    onClick={() => setNoShowConfirmId(res.id)}
                                                    className="w-9 h-9 rounded-xl bg-bg-tertiary flex items-center justify-center hover:bg-status-error/10 hover:text-status-error text-text-muted transition-all"
                                                >
                                                    <UserX className="w-4 h-4" />
                                                </button>
                                            )}

                                            {/* Cancel */}
                                            <button
                                                title="Annuler la réservation"
                                                onClick={() => onCancel(res.id)}
                                                className="w-9 h-9 rounded-xl bg-bg-tertiary flex items-center justify-center hover:bg-status-error/10 hover:text-status-error text-text-muted transition-all"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            )}
        </div>
    );
}
