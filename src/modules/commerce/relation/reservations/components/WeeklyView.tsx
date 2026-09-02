"use client";

import { useMemo } from "react";
import { format, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { Clock, Users, MapPin } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { Reservation } from "@nexus/contracts";

interface WeeklyViewProps {
    reservations: Reservation[];
    weekDays: Date[];
    selectedDate: Date;
    onDateClick: (date: Date) => void;
}

const STATUS_DOT: Record<string, string> = {
    pending:   "bg-status-warning",
    confirmed: "bg-accent",
    arrived:   "bg-status-success",
    seated:    "bg-status-success",
    cancelled: "bg-status-error",
    no_show:   "bg-status-error",
};

export function WeeklyView({ reservations, weekDays, selectedDate, onDateClick }: WeeklyViewProps) {
    const byDay = useMemo(() => {
        return weekDays.map((day) => {
            const dayStr = format(day, "yyyy-MM-dd");
            const dayRes = reservations
                .filter((r) => r.date === dayStr && r.status !== "cancelled" && r.status !== "no_show")
                .sort((a, b) => a.time.localeCompare(b.time));
            return { day, dayRes };
        });
    }, [reservations, weekDays]);

    return (
        <div className="flex-1 overflow-hidden flex flex-col p-4 md:p-6 bg-bg-primary">
            <div className="grid grid-cols-7 sm:grid-cols-7 gap-2 flex-1 overflow-hidden">
                {byDay.map(({ day, dayRes }) => {
                    const isToday = isSameDay(day, new Date());
                    const isSelected = isSameDay(day, selectedDate);
                    return (
                        <div
                            key={day.toISOString()}
                            className={cn(
                                "flex flex-col rounded-2xl border transition-all overflow-hidden cursor-pointer",
                                isSelected
                                    ? "border-accent/60 shadow-md shadow-accent/10"
                                    : "border-border hover:border-border/80",
                                "bg-bg-secondary"
                            )}
                            role="button"
                            tabIndex={0}
                            aria-label={`Voir réservations pour ${format(day, 'EEEE d MMMM', { locale: fr })}`}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    onDateClick(day);
                                }
                            }}
                            onClick={() => onDateClick(day)}
                        >
                            {/* Day header */}
                            <div
                                className={cn(
                                    "px-3 py-3 text-center border-b border-border shrink-0",
                                    isToday ? "bg-accent/10" : "bg-bg-tertiary"
                                )}
                            >
                                <p className="text-chip-label-sm text-text-muted">
                                    {format(day, "EEE", { locale: fr })}
                                </p>
                                <p
                                    className={cn(
                                        "text-xl font-mono font-light mt-0.5",
                                        isToday ? "text-accent" : "text-text-primary"
                                    )}
                                >
                                    {format(day, "d")}
                                </p>
                                <p className="text-nano font-black text-text-muted uppercase tracking-wider mt-0.5">
                                    {dayRes.length > 0 ? (
                                        <span className="text-accent">{dayRes.length} rés.</span>
                                    ) : (
                                        <span className="text-text-muted/40">—</span>
                                    )}
                                </p>
                            </div>

                            {/* Reservations list */}
                            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                                {dayRes.length === 0 ? (
                                    <div className="flex items-center justify-center h-full py-6">
                                        <Clock strokeWidth={1} className="w-5 h-5 text-text-muted/20" />
                                    </div>
                                ) : (
                                    dayRes.map((res) => (
                                        <div role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); (e.currentTarget as HTMLElement).click(); } }}
                                            key={res.id}
                                            className="bg-bg-tertiary rounded-xl p-2 border border-border/50 hover:border-accent/30 transition-all group"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <div
                                                    className={cn(
                                                        "w-1.5 h-1.5 rounded-full shrink-0",
                                                        STATUS_DOT[res.status] ?? "bg-text-muted"
                                                    )}
                                                />
                                                <span className="text-nano font-mono text-text-muted truncate">
                                                    {res.time}
                                                </span>
                                            </div>
                                            <p className="text-nano font-black text-text-primary truncate leading-tight">
                                                {res.customerName}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="flex items-center gap-0.5 text-nano text-text-muted">
                                                    <Users className="w-2.5 h-2.5" />
                                                    {res.covers ?? res.partySize ?? 0}
                                                </span>
                                                {res.tableId && (
                                                    <span className="flex items-center gap-0.5 text-nano text-text-muted">
                                                        <MapPin className="w-2.5 h-2.5" />
                                                        {String(res.tableId).replace(/^t/, "#")}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
