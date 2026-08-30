// @wip owner:commerce-team échéance:2026-Q4 — composant orphelin à intégrer ou supprimer (audit orphelins 2026-08-30)
"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, isSameDay, isSameMonth } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { useLanguage } from "@/shared/hooks";

interface ReservationCalendarPopupProps {
    isOpen: boolean;
    onClose: () => void;
    currentDate: Date;
    setCurrentDate: (date: Date) => void;
    calendarMonth: Date;
    setCalendarMonth: (date: Date | ((prev: Date) => Date)) => void;
    daysInMonth: Date[];
    getResCountForDate: (date: Date) => number;
}

export function ReservationCalendarPopup({
    isOpen,
    onClose,
    currentDate,
    setCurrentDate,
    calendarMonth,
    setCalendarMonth,
    daysInMonth,
    getResCountForDate
}: ReservationCalendarPopupProps) {
    const { language } = useLanguage();

    const handlePrevMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCalendarMonth(prev => {
            const date = new Date(prev);
            date.setMonth(date.getMonth() - 1);
            return date;
        });
    };

    const handleNextMonth = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCalendarMonth(prev => {
            const date = new Date(prev);
            date.setMonth(date.getMonth() + 1);
            return date;
        });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full mt-4 left-1/2 -translate-x-1/2 w-[350px] bg-bg-secondary backdrop-blur-2xl border border-border shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-[2.5rem] p-6 z-[60] overflow-hidden"
                >
                    <div className="flex items-center justify-between mb-6">
                        <button onClick={handlePrevMonth} className="p-2 hover:bg-bg-tertiary rounded-full text-text-muted hover:text-accent transition-all">
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <h4 className="text-micro font-serif font-bold italic text-text-primary uppercase tracking-[0.2em]">
                            {format(calendarMonth, 'MMMM yyyy', { locale: language === 'fr' ? fr : undefined })}
                        </h4>
                        <button onClick={handleNextMonth} className="p-2 hover:bg-bg-tertiary rounded-full text-text-muted hover:text-accent transition-all">
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
                            <div key={i} className="text-nano font-black text-text-muted/50 text-center uppercase tracking-widest py-2">
                                {d}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {daysInMonth.map((day, i) => {
                            const resCount = getResCountForDate(day);
                            const isCurrent = isSameDay(day, currentDate);
                            const isOtherMonth = !isSameMonth(day, calendarMonth);
                            
                            return (
                                <motion.div
                                    key={i}
                                    whileHover={{ scale: 1.1 }}
                                    onClick={() => {
                                        setCurrentDate(day);
                                        onClose();
                                    }}
                                    className={cn(
                                        "aspect-square rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all relative group/day",
                                        isCurrent ? "bg-accent text-bg-primary shadow-lg shadow-amber-500/20" : "hover:bg-bg-tertiary",
                                        isOtherMonth ? "opacity-20 pointer-events-none" : "opacity-100"
                                    )}
                                >
                                    <span className={cn(
                                        "text-nano font-mono font-bold",
                                        isCurrent ? "text-bg-primary" : "text-text-primary"
                                    )}>
                                        {format(day, 'd')}
                                    </span>
                                    {resCount > 0 && (
                                        <div className={cn(
                                            "absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-nano font-black border-2",
                                            isCurrent 
                                                ? "bg-white text-accent border-accent" 
                                                : "bg-accent text-bg-primary border-bg-secondary"
                                        )}>
                                            {resCount}
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
