"use client";

import { motion } from "framer-motion";

interface Stat {
    label: string;
    value: string;
    icon: React.ElementType;
    change: number;
}

export function GroupStatCard({ stat }: { stat: Stat }) {
    const Icon = stat.icon;
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 rounded-[2.5rem] bg-bg-secondary border border-border group hover:border-purple-500/30 transition-all cursor-default"
        >
            <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover:bg-purple-500 group-hover:text-white transition-all duration-500">
                    <Icon className="w-6 h-6" />
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Evolution</p>
                    <p className="text-sm font-bold text-status-success">+{stat.change}%</p>
                </div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted mb-1">{stat.label}</p>
            <p className="text-4xl font-serif italic font-black text-text-primary">{stat.value}</p>
        </motion.div>
    );
}
