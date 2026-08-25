"use client";

import { motion } from 'framer-motion';
import { cn } from "@/lib/ui.foundations";
import { PremiumSelect } from '@ui/PremiumSelect';
import type { DayPeriod, LeaveBalance } from '@nexus/contracts';

interface LeaveDateStepProps {
    startDate: string;
    setStartDate: (v: string) => void;
    endDate: string;
    setEndDate: (v: string) => void;
    startPeriod: DayPeriod;
    setStartPeriod: (v: DayPeriod) => void;
    endPeriod: DayPeriod;
    setEndPeriod: (v: DayPeriod) => void;
    workingDays: number;
    selectedBalance: LeaveBalance | undefined;
}

export function LeaveDateStep({
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    startPeriod,
    setStartPeriod,
    endPeriod,
    setEndPeriod,
    workingDays,
    selectedBalance,
}: LeaveDateStepProps) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
        >
            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-3">
                    <label className="block text-nano font-bold text-text-muted uppercase tracking-widest">
                        Début
                    </label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-border text-text-primary font-serif focus:scale-[1.02] focus:border-accent focus:ring-4 focus:ring-accent/5 transition-all outline-none shadow-sm"
                    />
                    <PremiumSelect
                        value={startPeriod}
                        onChange={val => setStartPeriod(val as DayPeriod)}
                        options={[
                            { value: 'full_day', label: 'Journée entière' },
                            { value: 'morning', label: 'Matin' },
                            { value: 'afternoon', label: 'Après-midi' }
                        ]}
                    />
                </div>
                <div className="space-y-3">
                    <label className="block text-nano font-bold text-text-muted uppercase tracking-widest">
                        Fin
                    </label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        min={startDate}
                        className="w-full px-4 py-3 rounded-xl bg-bg-secondary border border-border text-text-primary font-serif focus:scale-[1.02] focus:border-accent focus:ring-4 focus:ring-accent/5 transition-all outline-none shadow-sm"
                    />
                    <PremiumSelect
                        value={endPeriod}
                        onChange={val => setEndPeriod(val as DayPeriod)}
                        options={[
                            { value: 'full_day', label: 'Journée entière' },
                            { value: 'morning', label: 'Matin' },
                            { value: 'afternoon', label: 'Après-midi' }
                        ]}
                    />
                </div>
            </div>

            {startDate && endDate && (
                <div className="p-6 rounded-2xl bg-bg-secondary border border-border relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-accent/5 rounded-full blur-xl -mr-10 -mt-10" />
                    <div className="flex items-center justify-between relative z-10">
                        <span className="text-text-muted text-sm font-medium">Jours décomptés</span>
                        <span className="text-3xl font-serif italic text-text-primary">
                            {workingDays} <span className="text-sm font-sans not-italic text-text-muted font-bold uppercase tracking-wide">Jours</span>
                        </span>
                    </div>
                    {selectedBalance && (
                        <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between text-sm">
                            <span className="text-nano font-bold text-text-muted uppercase tracking-widest">Solde prévisionnel</span>
                            <span className={cn(
                                "font-bold font-mono px-2 py-0.5 rounded",
                                selectedBalance.remaining - workingDays >= 0
                                    ? "bg-status-success text-status-success"
                                    : "bg-status-danger text-status-danger"
                            )}>
                                {(selectedBalance.remaining - workingDays).toFixed(1)} j
                            </span>
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    );
}
