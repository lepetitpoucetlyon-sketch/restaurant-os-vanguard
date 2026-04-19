"use client";

import { motion, Variants } from "framer-motion";
import { Users } from "lucide-react";
import { cn } from "@/lib/ui.foundations";;
import { easing } from "@/lib/motion";

const cinematicItem: Variants = {
    hidden: { opacity: 0, scale: 0.98, y: 10 },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: { duration: 0.5, ease: easing.easeOutExpo },
    },
};

interface TableData {
    id: string;
    seats: number;
    type: "vip" | "terrace" | "standard";
    status: "available" | "occupied" | "reserved" | "web-reserved";
    number: string;
}

interface TableGridProps {
    tables: Record<string, TableData[]>;
    onTableClick: (table: TableData) => void;
}

export function TableGrid({ tables, onTableClick }: TableGridProps) {
    return (
        <div className="flex-1 w-full relative p-4 md:p-8 pb-32">
            <div className="max-w-[1800px] mx-auto space-y-12">
                {Object.entries(tables).map(([zone, tableList]) => (
                    <div key={zone}>
                        {/* Zone Header */}
                        <div className="flex items-center gap-4 mb-6">
                            {zone === "VIP" && (
                                <div className="w-2.5 h-2.5 rounded-full bg-accent shadow-[0_0_15px_rgba(197,160,89,0.4)]" />
                            )}
                            {zone === "TERRACE" && (
                                <div className="w-2.5 h-2.5 rounded-full bg-[#00D9A6] shadow-[0_0_15px_rgba(0,217,166,0.3)]" />
                            )}
                            {zone === "STANDARD" && (
                                <div className="w-2.5 h-2.5 rounded-full bg-text-muted/20" />
                            )}

                            <span
                                className={cn(
                                    "text-[10px] font-black uppercase tracking-[0.3em]",
                                    zone === "VIP"
                                        ? "text-accent"
                                        : zone === "TERRACE"
                                            ? "text-emerald-500"
                                            : "text-text-muted/60"
                                )}
                            >
                                ZONE {zone}
                            </span>
                            <div className="h-px flex-1 bg-border/40" />
                        </div>

                        {/* Tables Grid */}
                        <div
                            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-6"
                            data-tutorial="reservations-1-1-1"
                        >
                            {tableList.map((table) => (
                                <motion.div
                                    key={table.id}
                                    variants={cinematicItem}
                                    onClick={() => onTableClick(table)}
                                    whileHover={{ scale: 1.02, y: -4 }}
                                    className={cn(
                                        "relative min-h-[180px] rounded-[24px] p-6 flex flex-col justify-between transition-all duration-700 cursor-pointer group shadow-lg border",
                                        table.status === "web-reserved"
                                            ? "bg-bg-tertiary border-blue-500/40 hover:border-blue-500 hover:shadow-blue-500/10"
                                            : table.type === "vip"
                                                ? "bg-bg-tertiary border-accent/20 hover:border-accent hover:shadow-accent/10"
                                                : table.type === "terrace"
                                                    ? "bg-bg-tertiary border-emerald-500/20 hover:border-emerald-500 hover:shadow-emerald-500/5"
                                                    : "bg-bg-tertiary border-border hover:border-text-muted hover:shadow-black/10"
                                    )}
                                >
                                    {/* Card Header - Status Indicators */}
                                    <div className="flex justify-between items-start">
                                        <div className="flex gap-1">
                                            {Array.from({ length: 3 }).map((_, i) => (
                                                <div
                                                    key={i}
                                                    className={cn(
                                                        "w-1 h-1 rounded-full",
                                                        i < table.seats / 2
                                                            ? table.type === "vip"
                                                                ? "bg-accent"
                                                                : table.type === "terrace"
                                                                    ? "bg-[#00D9A6]"
                                                                    : "bg-text-muted/40"
                                                            : "bg-white/5"
                                                    )}
                                                />
                                            ))}
                                        </div>
                                        {table.status === "occupied" && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse" />
                                        )}
                                        {table.status === "reserved" && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
                                        )}
                                        {table.status === "web-reserved" && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] animate-pulse" />
                                        )}
                                        {table.type === "terrace" && table.status === "available" && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#00D9A6] shadow-[0_0_10px_rgba(0,217,166,0.5)]" />
                                        )}
                                    </div>

                                    {/* Main Content - Table Number */}
                                    <div className="flex flex-col items-center justify-center py-2">
                                        <div
                                            className={cn(
                                                "w-12 h-10 flex items-center justify-center border rounded-[12px] mb-2 bg-bg-primary",
                                                table.type === "vip"
                                                    ? "border-accent/30 text-accent"
                                                    : table.type === "terrace"
                                                        ? "border-emerald-500/30 text-emerald-500"
                                                        : "border-border text-text-muted"
                                            )}
                                        >
                                            <span className="font-serif font-black text-xl italic">
                                                {table.id}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Footer - Capacity and VIP Badge */}
                                    <div className="flex items-end justify-between">
                                        <div>
                                            <p className="text-[8px] font-black uppercase tracking-[0.3em] text-text-muted/40 mb-1">
                                                CAP.
                                            </p>
                                            <div className="flex items-center gap-1.5 text-text-muted">
                                                <Users className="w-2.5 h-2.5" />
                                                <span className="text-[10px] font-bold group-hover:text-text-primary transition-colors">
                                                    {table.seats}p
                                                </span>
                                            </div>
                                        </div>

                                        {table.type === "vip" && (
                                            <div className="px-2 py-0.5 rounded-full bg-accent text-bg-primary text-[7px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20">
                                                VIP
                                            </div>
                                        )}
                                    </div>

                                    {/* Hover Glow Effect */}
                                    {table.type === "vip" && (
                                        <div className="absolute inset-0 rounded-[24px] bg-gradient-to-tr from-[#C5A059]/0 via-[#C5A059]/5 to-[#C5A059]/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
