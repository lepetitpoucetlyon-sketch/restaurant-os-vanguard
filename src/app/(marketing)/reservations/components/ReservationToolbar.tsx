// @ts-nocheck
"use client";

import React from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
    PanelLeft, 
    Calendar as CalendarIcon, 
    LayoutGrid, 
    Users as UsersIcon, 
    Plus 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/ui.foundations";
import { useLanguage } from "@/context/LanguageContext";

interface ReservationToolbarProps {
    view: 'day' | 'week';
    setView: (view: 'day' | 'week') => void;
    activeSection: 'reservations' | 'customers';
    setActiveSection: (section: 'reservations' | 'customers') => void;
    currentDate: Date;
    isCalendarOpen: boolean;
    setIsCalendarOpen: (open: boolean) => void;
    setIsNewReservationModalOpen: (open: boolean) => void;
    isSidebarVisible: boolean;
    setIsSidebarVisible: (visible: boolean) => void;
}

export function ReservationToolbar({
    view,
    setView,
    activeSection,
    setActiveSection,
    currentDate,
    isCalendarOpen,
    setIsCalendarOpen,
    setIsNewReservationModalOpen,
    isSidebarVisible,
    setIsSidebarVisible
}: ReservationToolbarProps) {
    const { t, language } = useLanguage();

    return (
        <div className="h-28 md:h-32 border-b border-border bg-bg-primary/50 backdrop-blur-3xl flex items-center justify-between px-6 md:px-12 relative z-30">
            <div className="flex items-center gap-4 md:gap-10">
                {!isSidebarVisible && (
                    <motion.button
                        layoutId="sidebar-toggle"
                        onClick={() => setIsSidebarVisible(true)}
                        className="w-10 h-10 md:w-12 md:h-12 bg-white dark:bg-white/10 rounded-2xl shadow-xl border border-black/5 flex items-center justify-center text-text-primary hover:scale-105 active:scale-95 transition-all"
                    >
                        <PanelLeft className="w-5 md:w-6 h-5 md:h-6" />
                    </motion.button>
                )}
                <div className="relative">
                    <button
                        onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                        className="flex flex-col group cursor-pointer"
                    >
                        <span className="text-[8px] md:text-[10px] font-black text-text-muted uppercase tracking-[0.4em] group-hover:text-accent transition-colors">
                            {format(currentDate, 'EEEE', { locale: language === 'fr' ? fr : undefined })}
                        </span>
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl md:text-3xl font-serif font-light italic text-text-primary pr-3 border-r border-border">
                                {format(currentDate, 'd MMMM', { locale: language === 'fr' ? fr : undefined })}
                            </h2>
                            <CalendarIcon strokeWidth={1.5} className="w-5 h-5 md:w-6 md:h-6 text-accent group-hover:scale-110 transition-transform" />
                        </div>
                    </button>
                </div>

                <div className="hidden md:flex bg-bg-secondary p-1.5 rounded-full border border-border shadow-inner ml-4">
                    <button
                        onClick={() => setView('day')}
                        className={cn(
                            "px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all",
                            view === 'day' ? "bg-accent text-bg-primary shadow-lg shadow-amber-500/20" : "text-text-muted hover:text-text-primary"
                        )}
                    >
                        {t('reservations.toolbar.day')}
                    </button>
                    <button
                        onClick={() => setView('week')}
                        className={cn(
                            "px-6 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all",
                            view === 'week' ? "bg-accent text-bg-primary shadow-lg shadow-amber-500/20" : "text-text-muted hover:text-text-primary"
                        )}
                    >
                        {t('reservations.toolbar.week')}
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-4 md:gap-8">
                <div className="flex bg-bg-secondary p-1.5 rounded-full border border-border">
                    <button
                        onClick={() => setActiveSection('reservations')}
                        className={cn(
                            "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all",
                            activeSection === 'reservations' ? "bg-accent text-bg-primary shadow-lg shadow-amber-500/10" : "text-text-muted hover:text-text-primary"
                        )}
                    >
                        <LayoutGrid strokeWidth={1.5} className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                    <button
                        onClick={() => setActiveSection('customers')}
                        className={cn(
                            "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all",
                            activeSection === 'customers' ? "bg-accent text-bg-primary shadow-lg shadow-amber-500/10" : "text-text-muted hover:text-text-primary"
                        )}
                    >
                        <UsersIcon strokeWidth={1.5} className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                </div>

                <Button
                    onClick={() => setIsNewReservationModalOpen(true)}
                    className="h-10 md:h-12 px-6 md:px-8 bg-accent hover:bg-white text-bg-primary rounded-full font-black text-[9px] md:text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-amber-500/20 transition-all flex items-center gap-3"
                >
                    <Plus className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="hidden sm:inline">{t('reservations.toolbar.new_reservation')}</span>
                </Button>
            </div>
        </div>
    );
}
