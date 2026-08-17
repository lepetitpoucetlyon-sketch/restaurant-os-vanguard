"use client";

import { motion } from "framer-motion";
import { Calendar, Sparkles, ShieldCheck, X } from "lucide-react";

interface ReservationHeaderProps {
    step: number;
    onClose: () => void;
}

export function ReservationHeader({ step, onClose }: ReservationHeaderProps) {
    return (
        <div className="px-12 py-10 bg-bg-secondary text-text-primary relative overflow-hidden shrink-0 border-b border-border">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(212,175,55,0.1),transparent)]" />
            </div>

            <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <div className="w-16 h-16 rounded-3xl bg-accent flex items-center justify-center shadow-xl shadow-amber-500/20">
                        <Calendar strokeWidth={1.5} className="w-8 h-8 text-bg-primary" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-serif font-black tracking-tight flex items-center gap-3 italic">
                            Brigade <span className="text-accent not-italic">Premium</span>
                            <Sparkles className="w-5 h-5 text-accent animate-pulse" />
                        </h2>
                        <div className="flex items-center gap-4 mt-1">
                            <span className="text-text-muted text-[10px] font-black uppercase tracking-[0.3em]">Signature Client Management</span>
                            <div className="h-1 w-1 rounded-full bg-accent/40" />
                            <div className="flex items-center gap-2">
                                <ShieldCheck className="w-3 h-3 text-accent" />
                                <span className="text-accent text-[10px] font-black uppercase tracking-[0.2em]">IA Ops Active</span>
                            </div>
                        </div>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="w-12 h-12 rounded-2xl bg-bg-tertiary hover:bg-bg-primary border border-border flex items-center justify-center transition-all group"
                >
                    <X className="w-6 h-6 text-text-muted group-hover:text-text-primary" />
                </button>
            </div>

            {/* Progress Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-surface-card/10">
                <motion.div
                    className="h-full bg-accent shadow-[0_0_15px_rgba(197,160,89,0.5)]"
                    initial={{ width: "50%" }}
                    animate={{ width: step === 1 ? "50%" : "100%" }}
                    transition={{ duration: 0.6, ease: "circOut" }}
                />
            </div>
        </div>
    );
}
