"use client";

import { motion } from "framer-motion";
import { Users, Calendar, Clock, Euro, ArrowUpRight } from "lucide-react";
import { StatusBadge } from "./StatusBadge";

import { Group } from "@nexus/contracts";

export function EventCard({ group }: { group: Group }) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="p-8 rounded-[2.5rem] bg-bg-secondary border border-border group hover:border-purple-500/30 transition-all"
        >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                        <StatusBadge status={group.status} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted px-4 py-1.5 rounded-full bg-bg-tertiary border border-border">
                            {group.type}
                        </span>
                    </div>
                    <h3 className="text-3xl font-serif italic font-black text-text-primary mb-4 group-hover:text-purple-500 transition-colors">
                        {group.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-6">
                        <div className="flex items-center gap-2 text-text-muted">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm font-bold">{group.date ? new Date(group.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : 'Date à confirmer'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-text-muted">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm font-bold">{group.time || '--:--'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-text-primary">
                            <Users className="w-4 h-4 text-purple-500" />
                            <span className="text-sm font-black">{group.pax || 0} Personnes</span>
                        </div>
                        <div className="flex items-center gap-2 text-status-success">
                            <Euro className="w-4 h-4" />
                            <span className="text-sm font-black">{group.budget}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {(group.tags || []).map((tag: string, tid: number) => (
                        <span key={tid} className="text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-xl bg-purple-500/5 text-purple-600 dark:text-purple-400 border border-purple-500/10">
                            {tag}
                        </span>
                    ))}
                    <button className="w-14 h-14 rounded-full bg-bg-tertiary border border-border flex items-center justify-center hover:bg-purple-500 hover:text-white transition-all duration-500 group/btn">
                        <ArrowUpRight className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
