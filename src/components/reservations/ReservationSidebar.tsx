"use client";

import { motion, AnimatePresence, Variants } from "framer-motion";
import { Search, Filter, Clock, Users, MoreHorizontal, UserCheck } from "lucide-react";
import { cn } from "@/lib/ui.foundations";;
import { ScrollArea } from "@/components/ui/scroll-area";
import { Reservation } from "@/types";
import { fadeInUp, easing } from "@/lib/motion";

const cinematicContainer: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2,
        },
    },
};

const cinematicItem: Variants = {
    hidden: { opacity: 0, scale: 0.98, y: 10 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { duration: 0.5, ease: easing.easeOutExpo },
    },
};

interface ReservationSidebarProps {
    isVisible: boolean;
    reservations: Reservation[];
}

export function ReservationSidebar({
    isVisible,
    reservations,
}: ReservationSidebarProps) {
    return (
        <motion.div
            initial={{ width: 0, opacity: 0, x: -50 }}
            animate={{
                width: isVisible ? 400 : 0,
                opacity: isVisible ? 1 : 0,
                x: isVisible ? 0 : -50,
            }}
            exit={{ width: 0, opacity: 0, x: -50 }}
            transition={{ duration: 0.4, ease: easing.easeOutExpo }}
            className="hidden lg:flex border-r border-border bg-bg-secondary flex-col relative z-20 overflow-hidden shrink-0 h-full"
        >
            {/* Search Header */}
            <div className="p-8 space-y-6 bg-bg-secondary border-b border-border">
                <div className="relative group">
                    <Search
                        strokeWidth={1.5}
                        className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted group-focus-within:text-accent transition-colors"
                    />
                    <input
                        type="text"
                        placeholder="IDENTIFICATION NOMINATIVE..."
                        className="w-full bg-bg-primary border border-border rounded-full pl-14 pr-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/40 transition-all"
                    />
                </div>
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                        <span className="text-[9px] font-black text-text-muted uppercase tracking-[0.3em]">
                            MANIFESTE{" "}
                            <span className="text-accent">{reservations.length}</span>
                        </span>
                    </div>
                    <button className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2 hover:text-accent transition-colors">
                        <Filter strokeWidth={1.5} className="w-3.5 h-3.5" />
                        TRIER
                    </button>
                </div>
            </div>

            {/* Reservations List */}
            <ScrollArea className="flex-1 elegant-scrollbar">
                <motion.div
                    variants={cinematicContainer}
                    initial="hidden"
                    animate="visible"
                    className="p-8 space-y-6"
                >
                    {reservations.length === 0 ? (
                        <motion.div
                            variants={fadeInUp}
                            className="flex flex-col items-center justify-center py-24 text-center"
                        >
                            <div className="w-16 h-16 rounded-[2rem] bg-bg-tertiary flex items-center justify-center mb-6 border border-border">
                                <Clock strokeWidth={1} className="w-8 h-8 text-text-muted/50" />
                            </div>
                            <p className="text-[9px] font-black text-text-muted/50 uppercase tracking-[0.3em] italic">
                                Agenda Vacant
                            </p>
                        </motion.div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {reservations.map((res) => (
                                <motion.div
                                    key={res.id}
                                    variants={cinematicItem}
                                    whileHover={{ y: -5, transition: { duration: 0.3 } }}
                                    data-tutorial="reservations-0-1-0"
                                    className="bg-bg-tertiary rounded-[2.5rem] p-6 border border-border hover:border-accent/40 hover:shadow-2xl hover:shadow-black/10 transition-all duration-500 cursor-pointer group relative overflow-hidden"
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-5">
                                            <div className="w-14 h-14 rounded-2xl bg-accent flex flex-col items-center justify-center shadow-lg shadow-amber-500/10 group-hover:bg-white transition-all">
                                                <span className="text-[14px] font-mono font-light text-bg-primary italic tracking-tighter group-hover:text-bg-primary transition-colors">
                                                    {res.time}
                                                </span>
                                            </div>
                                            <div>
                                                <h3 className="font-serif font-light text-xl text-text-primary italic leading-tight group-hover:text-accent transition-colors">
                                                    {res.customerName}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <div
                                                        className={cn(
                                                            "w-1.5 h-1.5 rounded-full",
                                                            res.status === "seated"
                                                                ? "bg-emerald-500"
                                                                : "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.3)]"
                                                        )}
                                                    />
                                                    <span className="text-[8px] font-black text-text-muted uppercase tracking-[0.2em]">
                                                        {res.status === "seated" ? "En Cuisine" : "Attendu"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <button className="p-2 text-neutral-400 hover:text-accent transition-all">
                                            <MoreHorizontal strokeWidth={1.5} className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="flex justify-between items-center pt-5 border-t border-white/5">
                                        <div className="flex items-center gap-6">
                                            <div className="flex items-center gap-2">
                                                <Users strokeWidth={1.5} className="h-4 w-4 text-accent" />
                                                <span className="text-[13px] font-mono font-light italic text-text-muted">
                                                    {res.covers}p
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-xl bg-bg-primary flex items-center justify-center text-[10px] font-mono font-bold text-text-primary border border-border">
                                                    {res.tableId.replace(/^t/, "")}
                                                </div>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-text-muted/50 italic">
                                                    Unité
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </motion.div>
            </ScrollArea>

            {/* Footer Stats */}
            <div className="p-8 bg-bg-secondary border-t border-border">
                <div className="flex items-center justify-between bg-bg-tertiary border border-border p-6 rounded-[2.5rem] shadow-2xl group hover:border-accent/40 transition-all cursor-pointer">
                    <div>
                        <span className="text-[8px] font-black text-text-muted uppercase tracking-[0.3em]">
                            SERVICES ENGAGÉS
                        </span>
                        <p className="text-3xl font-mono font-light text-accent italic leading-none mt-2">
                            {reservations.reduce((acc, r) => acc + r.covers, 0)}
                        </p>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center text-bg-primary shadow-lg shadow-amber-500/10 group-hover:scale-110 transition-transform">
                        <UserCheck strokeWidth={1.5} className="w-6 h-6" />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
