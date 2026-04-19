"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/ui.foundations";

export function StatCard({
    label,
    value,
    icon: Icon,
    change
}: {
    label: string;
    value: string | number;
    icon: any;
    change?: { value: number; isPositive: boolean };
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-[2rem] bg-bg-secondary border border-border group hover:shadow-lg transition-all"
        >
            <div className="flex items-start justify-between mb-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">{label}</p>
                <div className="w-10 h-10 rounded-xl bg-bg-tertiary flex items-center justify-center text-text-muted group-hover:bg-[#00D9A6]/10 group-hover:text-[#00D9A6] transition-all">
                    <Icon className="w-5 h-5" />
                </div>
            </div>
            <p className="text-4xl font-serif italic font-black text-text-primary">{value}</p>
            {change && (
                <p className={cn(
                    "text-[10px] font-bold uppercase tracking-widest mt-2",
                    change.isPositive ? 'text-[#00D9A6]' : 'text-rose-500'
                )}>
                    {change.isPositive ? '↑' : '↓'} {Math.abs(change.value)}% vs semaine dernière
                </p>
            )}
        </motion.div>
    );
}
