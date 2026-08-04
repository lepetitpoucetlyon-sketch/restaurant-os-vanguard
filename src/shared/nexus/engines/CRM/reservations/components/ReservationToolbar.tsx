"use client";

import { motion } from "framer-motion";
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    LayoutGrid,
    Users,
} from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { easing } from "@/shared/utils/motion";

interface ReservationToolbarProps {
    activeSection: "reservations" | "customers";
    setActiveSection: (section: "reservations" | "customers") => void;
    view: "day" | "week";
    setView: (view: "day" | "week") => void;
    displayDate: string;
    handlePrev: () => void;
    handleNext: () => void;
    onNewReservation: () => void;
}

export function ReservationToolbar({
    activeSection,
    setActiveSection,
    view,
    setView,
    displayDate,
    handlePrev,
    handleNext,
    onNewReservation,
}: ReservationToolbarProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: easing.easeOutExpo }}
            className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-bg-secondary/50 backdrop-blur-md border-b border-border px-8 py-4 z-40 shrink-0 sticky top-0"
        >
            <div className="flex items-center gap-6 md:gap-10">
                {/* Tab Switcher */}
                <div className="flex items-center bg-bg-tertiary p-1 rounded-full border border-border shadow-sm">
                    <button
                        onClick={() => setActiveSection("reservations")}
                        className={cn(
                            "h-10 px-6 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2.5",
                            activeSection === "reservations"
                                ? "bg-bg-primary text-text-primary shadow-sm ring-1 ring-black/5 dark:ring-white/5"
                                : "text-text-muted hover:text-text-primary hover:bg-bg-primary/50"
                        )}
                    >
                        <LayoutGrid strokeWidth={2} className="w-3.5 h-3.5" />
                        PLAN
                    </button>
                    <button
                        onClick={() => setActiveSection("customers")}
                        className={cn(
                            "h-10 px-6 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2.5",
                            activeSection === "customers"
                                ? "bg-bg-primary text-text-primary shadow-sm ring-1 ring-black/5 dark:ring-white/5"
                                : "text-text-muted hover:text-text-primary hover:bg-bg-primary/50"
                        )}
                    >
                        <Users strokeWidth={2} className="w-3.5 h-3.5" />
                        LISTE
                    </button>
                </div>

                {/* Date Navigator */}
                <div className="flex items-center gap-4 bg-bg-tertiary/50 px-4 py-2 rounded-full border border-border/50">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={handlePrev}
                        className="p-2 hover:bg-bg-primary rounded-full text-text-muted hover:text-accent transition-all"
                    >
                        <ChevronLeft strokeWidth={2.5} className="h-3.5 w-3.5" />
                    </motion.button>
                    <span className="text-[12px] font-serif font-medium italic text-text-primary capitalize min-w-[140px] text-center">
                        {displayDate}
                    </span>
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={handleNext}
                        className="p-2 hover:bg-bg-primary rounded-full text-text-muted hover:text-accent transition-all"
                    >
                        <ChevronRight strokeWidth={2.5} className="h-3.5 w-3.5" />
                    </motion.button>
                </div>
            </div>

            <div className="flex items-center gap-6">
                {/* View Switcher */}
                <div className="flex items-center bg-bg-tertiary p-1 rounded-full border border-border">
                    {(["day", "week"] as const).map((v) => (
                        <button
                            key={v}
                            onClick={() => setView(v)}
                            className={cn(
                                "px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all",
                                view === v
                                    ? "bg-bg-primary text-text-primary shadow-sm"
                                    : "text-text-muted hover:text-text-primary"
                            )}
                        >
                            {v === "day" ? "JOUR" : "SEMAINE"}
                        </button>
                    ))}
                </div>

                {/* Action Button */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onNewReservation}
                    className="h-12 px-8 bg-accent text-bg-primary rounded-full font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-amber-500/10 hover:shadow-amber-500/20 flex items-center gap-3 border border-amber-300/20"
                >
                    <Plus strokeWidth={2.5} className="w-3.5 h-3.5" />
                    RÉSERVER
                </motion.button>
            </div>
        </motion.div>
    );
}
