"use client";

import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { cn } from "@/lib/ui.foundations";
import {
    LeaveBalance,
    LeaveType,
    LEAVE_TYPE_LABELS,
    LEAVE_TYPE_ICONS,
} from '@nexus/contracts';

interface LeaveTypeStepProps {
    selectedType: LeaveType;
    setSelectedType: (type: LeaveType) => void;
    balances: LeaveBalance[];
}

export function LeaveTypeStep({
    selectedType,
    setSelectedType,
    balances,
}: LeaveTypeStepProps) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
        >
            <label className="block text-sm font-bold text-text-muted uppercase tracking-widest mb-4">
                Type d'absence
            </label>
            <div className="grid grid-cols-2 gap-4">
                {Object.entries(LEAVE_TYPE_LABELS).map(([type, label]) => {
                    const balance = balances.find(b => b.type === type);
                    const icon = LEAVE_TYPE_ICONS[type as LeaveType];
                    const isSelected = selectedType === type;

                    return (
                        <button
                            key={type}
                            onClick={() => setSelectedType(type as LeaveType)}
                            className={cn(
                                "p-5 rounded-[2rem] border text-left transition-all relative overflow-hidden group h-full flex flex-col justify-between",
                                isSelected
                                    ? "border-accent bg-bg-secondary shadow-lg scale-[1.02]"
                                    : "border-border bg-[--color-surface-primary] hover:border-accent/30 hover:bg-bg-secondary/50"
                            )}
                        >
                            {isSelected && (
                                <div className="absolute top-4 right-4 z-20">
                                    <CheckCircle2 className="w-5 h-5 text-accent" />
                                </div>
                            )}

                            <div className="relative z-10 space-y-4">
                                <div className={cn(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all duration-500",
                                    isSelected ? "bg-[--color-surface-primary] text-accent shadow-premium scale-110" : "bg-bg-secondary text-text-muted group-hover:scale-105"
                                )}>
                                    {icon}
                                </div>
                                <div>
                                    <span className={cn(
                                        "block text-xl font-serif italic transition-colors leading-tight",
                                        isSelected ? "text-text-primary" : "text-text-primary/70"
                                    )}>{label}</span>
                                    {balance && (
                                        <span className="text-nano font-black text-text-muted/60 uppercase tracking-[0.2em] mt-1 block">
                                            {balance.remaining}j dispos.
                                        </span>
                                    )}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </motion.div>
    );
}
