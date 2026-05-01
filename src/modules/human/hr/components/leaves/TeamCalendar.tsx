"use client";

import React, { useState } from 'react';
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { cn } from "@/lib/ui.foundations";
import type { LeaveRequest } from "@nexus/contracts";
import { isWithinInterval, parseISO, startOfDay } from 'date-fns';


export function TeamCalendar() {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const days = [];

        // Add padding for first week
        const startPadding = (firstDay.getDay() + 6) % 7; // Monday = 0
        for (let i = 0; i < startPadding; i++) {
            days.push(null);
        }

        // Add days of month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push(new Date(year, month, i));
        }

        return days;
    };

    const days = getDaysInMonth(currentMonth);
    const weekDays = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];

    const monthName = currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

    // Purged team absences.
    const teamAbsences: LeaveRequest[] = [];

    const getAbsencesForDate = (date: Date | null) => {
        if (!date) return [];
        const targetDate = startOfDay(date);
        return teamAbsences.filter(a => {
            const start = startOfDay(parseISO(a.startDate));
            const end = startOfDay(parseISO(a.endDate));
            return isWithinInterval(targetDate, { start, end });
        });
    };

    return (
        <div className="bg-bg-secondary border border-border rounded-[2.5rem] p-8 shadow-premium">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-bg-primary border border-border flex items-center justify-center text-accent shadow-sm">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-serif italic text-text-primary">Planning d'Équipe</h3>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Vue d'ensemble</p>
                    </div>
                </div>

                <div className="flex items-center bg-bg-primary rounded-xl border border-border p-1 shadow-sm">
                    <button
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                        className="p-2 rounded-lg hover:bg-bg-secondary text-text-muted hover:text-text-primary transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-text-primary font-serif font-medium w-36 text-center capitalize text-lg">
                        {monthName}
                    </span>
                    <button
                        onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                        className="p-2 rounded-lg hover:bg-bg-secondary text-text-muted hover:text-text-primary transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-2">
                {/* Header */}
                {weekDays.map(day => (
                    <div key={day} className="text-center text-[10px] font-bold text-text-muted uppercase tracking-widest py-3">
                        {day}
                    </div>
                ))}

                {/* Days */}
                {days.map((date, i) => {
                    const absences = getAbsencesForDate(date);
                    const isToday = date && date.toDateString() === new Date().toDateString();
                    const isWeekend = date && (date.getDay() === 0 || date.getDay() === 6);

                    return (
                        <div
                            key={i}
                            className={cn(
                                "aspect-square p-2 rounded-2xl relative transition-all duration-300",
                                !date ? '' : isWeekend ? 'bg-bg-tertiary/30' : 'bg-bg-primary border border-border hover:border-accent/30 hover:shadow-md cursor-pointer',
                                isToday && "ring-2 ring-accent ring-offset-2 ring-offset-bg-secondary"
                            )}
                        >
                            {date && (
                                <>
                                    <span className={cn(
                                        "text-sm font-medium",
                                        isWeekend ? "text-text-muted/50" : "text-text-primary"
                                    )}>
                                        {date.getDate()}
                                    </span>
                                    {absences.length > 0 && (
                                        <div className="absolute bottom-2 left-2 right-2 flex gap-1">
                                            {absences.slice(0, 3).map((a, j) => (
                                                <div
                                                    key={j}
                                                    className={cn(
                                                        "h-1.5 flex-1 rounded-full",
                                                        a.type === 'paid' ? 'bg-blue-400' :
                                                            a.type === 'sick' ? 'bg-rose-400' : 'bg-amber-400'
                                                    )}
                                                    title={a.employeeName}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="mt-8 pt-6 border-t border-border flex items-center justify-center gap-8">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-400 ring-2 ring-blue-400/20" />
                    <span className="text-xs font-bold text-text-muted uppercase tracking-wide">Congés Payés</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-400 ring-2 ring-amber-400/20" />
                    <span className="text-xs font-bold text-text-muted uppercase tracking-wide">RTT</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-400 ring-2 ring-rose-400/20" />
                    <span className="text-xs font-bold text-text-muted uppercase tracking-wide">Maladie</span>
                </div>
            </div>
        </div>
    );
}
