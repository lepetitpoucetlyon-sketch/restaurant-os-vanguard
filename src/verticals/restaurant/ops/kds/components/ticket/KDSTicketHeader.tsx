import React from "react";
import { Clock, ChefHat, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { Order } from "@nexus/contracts";
import { hasAllergens } from "../kdsUtils";

interface KDSTicketHeaderProps {
    ticket: Order;
    elapsedSeconds: number;
    elapsedMinutes: number;
    isUrgent: boolean;
    isWarning: boolean;
    rushMode: boolean;
    gridColumns: number;
}

function formatElapsed(totalSeconds: number): string {
    const m = Math.floor(Math.max(0, totalSeconds) / 60);
    const s = Math.max(0, totalSeconds) % 60;
    return `${m}m ${s}s`;
}

function timerColorClass(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    if (minutes < 5) return "text-status-success";
    if (minutes < 10) return "text-orange-400";
    return "text-status-danger animate-pulse";
}

export function KDSTicketHeader({
    ticket,
    elapsedSeconds,
    elapsedMinutes,
    isUrgent,
    isWarning,
    rushMode,
    gridColumns
}: KDSTicketHeaderProps) {
    const allergens = hasAllergens(ticket.items);

    return (
        <div className={cn(
            "flex flex-col gap-3 p-5 md:p-6 border-b transition-all duration-700 relative overflow-hidden",
            "bg-surface-bg border-border/50"
        )}>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent-gold/40 to-transparent" />

            {/* kds-3: Allergen banner */}
            {allergens.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-status-danger/10 border border-red-500/40 text-status-danger text-[10px] font-black uppercase tracking-wider animate-pulse">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />
                    <span>ALLERGIE: {allergens.join(', ')}</span>
                </div>
            )}

            <div className="relative z-10 flex flex-col gap-3">
                {/* Row 1: Table number + kds-1 timer badge (top-right) */}
                <div className="flex items-center justify-between w-full min-h-[40px]">
                    <div className="flex items-center gap-2 min-w-0">
                        <h3 className={cn(
                            "font-serif font-medium tracking-tight italic text-primary leading-none truncate drop-shadow-sm translate-y-0.5",
                            gridColumns >= 5 ? "text-2xl" : "text-3xl lg:text-4xl"
                        )}>
                            Table <span className="text-accent-gold not-italic font-bold">{ticket.tableNumber}.</span>
                        </h3>
                        {(isUrgent || rushMode) && (
                            <div className="flex gap-1 shrink-0 self-center mt-1">
                                <span className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-error" />
                                </span>
                            </div>
                        )}
                    </div>

                    {/* kds-1: Live timer badge — top-right of card */}
                    <div className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-mono text-[11px] font-black border border-current/20 bg-surface-card/70 backdrop-blur-sm shadow-sm shrink-0 transition-colors duration-300",
                        timerColorClass(elapsedSeconds)
                    )}>
                        <Clock className="w-3 h-3" strokeWidth={2.5} />
                        <span>{formatElapsed(elapsedSeconds)}</span>
                    </div>
                </div>

                {/* Row 2: Old urgency clock + server info (kept for urgency context) */}
                <div className="flex items-center justify-between w-full gap-2 h-8">
                    <div className={cn(
                        "h-full px-3 rounded-lg font-mono border transition-all duration-500 flex items-center gap-2 shadow-sm shrink-0 whitespace-nowrap",
                        isUrgent || (rushMode && elapsedMinutes > 5)
                            ? "bg-error text-text-primary border-error shadow-error/20"
                            : isWarning
                                ? "bg-warning text-text-primary border-warning shadow-warning/20"
                                : "bg-surface-card text-primary border-subtle"
                    )}>
                        <Clock className={cn("w-3.5 h-3.5", (isUrgent || rushMode) && "animate-spin-slow")} strokeWidth={2.5} />
                        <span className="text-xs font-black pt-0.5">
                            {elapsedMinutes}<span className="text-[9px] opacity-70 ml-0.5 font-normal">MIN</span>
                        </span>
                    </div>

                    <div className="flex items-center gap-3 min-w-0 justify-end h-full">
                        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-secondary truncate text-right leading-none pt-0.5">
                            {ticket.serverName}
                        </span>
                        <div className="w-8 h-8 rounded-full bg-surface-card flex items-center justify-center border border-subtle shrink-0 shadow-sm">
                            <ChefHat className="w-4 h-4 text-primary" strokeWidth={2} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
