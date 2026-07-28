"use client";

import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { LeaveBalance, LEAVE_TYPE_ICONS, LEAVE_TYPE_LABELS } from "@nexus/contracts";

interface LeaveBalanceCardProps {
    balance: LeaveBalance;
}

export function LeaveBalanceCard({ balance }: LeaveBalanceCardProps) {
    const percentage = balance.entitled > 0 ? ((balance.acquired - balance.taken) / balance.entitled) * 100 : 0;
    const icon = LEAVE_TYPE_ICONS[balance.type];
    const label = LEAVE_TYPE_LABELS[balance.type];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative overflow-hidden bg-bg-secondary border border-border rounded-[2.5rem] p-8 shadow-premium hover:shadow-2xl transition-all duration-500"
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />

            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-bg-primary shadow-sm border border-border flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-500">
                        {icon}
                    </div>
                    <span className="font-serif italic text-text-primary text-xl">{label}</span>
                </div>
                {balance.pending > 0 && (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-status-warning/10 border border-action-primary/20 text-status-warning text-[10px] uppercase font-bold tracking-wider">
                        <Clock className="w-3 h-3" />
                        {balance.pending} en attente
                    </span>
                )}
            </div>

            <div className="mb-6 relative z-10">
                <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-serif font-medium text-text-primary tracking-tight">{balance.remaining.toFixed(1)}</span>
                    <span className="text-text-muted font-bold text-sm uppercase tracking-widest">Jours</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-text-muted/60 text-xs font-bold uppercase tracking-widest">Sur {balance.entitled} annuels</span>
                    {balance.carriedOver > 0 && (
                        <>
                            <span className="w-1 h-1 rounded-full bg-border" />
                            <span className="text-status-success/80 text-xs font-bold uppercase tracking-widest">Dont {balance.carriedOver}j reportés</span>
                        </>
                    )}
                </div>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-bg-tertiary rounded-full overflow-hidden relative z-10">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(percentage, 100)}%` }}
                    transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                    className={cn(
                        "h-full rounded-full shadow-lg relative overflow-hidden",
                        percentage > 50 ? 'bg-status-success' : percentage > 25 ? 'bg-status-warning' : 'bg-status-danger'
                    )}
                >
                    <div className="absolute inset-0 bg-[--color-surface-primary]/20 w-full h-full animate-shimmer" />
                </motion.div>
            </div>
        </motion.div>
    );
}
