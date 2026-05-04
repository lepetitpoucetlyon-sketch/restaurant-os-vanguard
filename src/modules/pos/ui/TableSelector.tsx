"use client";

import { useState, useEffect, useRef } from "react";
import { useTables } from "@/engines/ops/NexusOpsProvider";
import { Table, Zone } from "@nexus/contracts";
import { cn } from "@/lib/ui.foundations";
import { Users, AlertCircle, LayoutGrid, Layers, ChevronUp, ChevronDown, MousePointer2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TableSelectorProps {
    onSelectTable: (tableId: string) => void;
}

export function TableSelector({ onSelectTable }: TableSelectorProps) {
    const { tables, zones } = useTables();
    const [viewMode, setViewMode] = useState<'grid' | 'zones'>('grid');

    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const gridRef = useRef<HTMLDivElement>(null);

    // Cinematic Auto-Scroll Effect - Refined timing to avoid collision with entrance animation
    useEffect(() => {
        const timer = setTimeout(() => {
            if (gridRef.current && scrollContainerRef.current) {
                const top = gridRef.current.offsetTop;
                scrollContainerRef.current.scrollTo({
                    top: top - 40, // Increased buffer for better alignment with the top margin
                    behavior: 'smooth'
                });
            }
        }, 1200); // Delayed slightly to sync with the main entrance

        return () => clearTimeout(timer);
    }, []);

    const renderTableButton = (table: Table, index: number) => {
        const getStatusStyles = () => {
            switch (table.status) {
                case 'free':
                    return {
                        container: "bg-white/80 dark:bg-white/[0.03] border-white/20 dark:border-white/5 hover:border-accent-gold/50 hover:-translate-y-2 backdrop-blur-xl",
                        circle: "bg-bg-primary text-text-primary border-accent-gold/20 group-hover:bg-accent-gold group-hover:text-white",
                        icon: "text-accent-gold",
                        indicator: "bg-accent-gold",
                        bar: "bg-accent-gold",
                        spotlight: "bg-gradient-to-br from-accent-gold/10 to-transparent"
                    };
                case 'seated':
                    return {
                        container: "bg-accent-gold/5 border-accent-gold shadow-inner",
                        circle: "bg-accent-gold/20 text-accent-gold border-accent-gold/30",
                        icon: "text-accent-gold",
                        indicator: "bg-accent-gold",
                        bar: "bg-accent-gold",
                        spotlight: "bg-gradient-to-br from-accent-gold/10 to-transparent"
                    };
                case 'ordered':
                    return {
                        container: "bg-blue-500/5 border-blue-500 shadow-inner",
                        circle: "bg-blue-500/20 text-blue-500 border-blue-500/30",
                        icon: "text-blue-500",
                        indicator: "bg-blue-500",
                        bar: "bg-blue-500",
                        spotlight: "bg-gradient-to-br from-blue-500/10 to-transparent"
                    };
                case 'eating':
                    return {
                        container: "bg-orange-500/5 border-orange-500 shadow-inner",
                        circle: "bg-orange-500/20 text-orange-500 border-orange-500/30",
                        icon: "text-orange-500",
                        indicator: "bg-orange-500",
                        bar: "bg-orange-500",
                        spotlight: "bg-gradient-to-br from-orange-500/10 to-transparent"
                    };
                case 'paying':
                    return {
                        container: "bg-emerald-500/5 border-emerald-500 shadow-inner animate-pulse-subtle",
                        circle: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30",
                        icon: "text-emerald-500",
                        indicator: "bg-emerald-500",
                        bar: "bg-emerald-500",
                        spotlight: "bg-gradient-to-br from-emerald-500/10 to-transparent"
                    };
                case 'reserved':
                    return {
                        container: "bg-purple-500/5 border-purple-500 shadow-inner",
                        circle: "bg-purple-500/20 text-purple-500 border-purple-500/30",
                        icon: "text-purple-500",
                        indicator: "bg-purple-500",
                        bar: "bg-purple-500",
                        spotlight: "bg-gradient-to-br from-purple-500/10 to-transparent"
                    };
                default:
                    return {
                        container: "bg-neutral-100 dark:bg-white/[0.01] border-border opacity-60 grayscale cursor-not-allowed",
                        circle: "bg-neutral-200 text-neutral-400 border-neutral-300",
                        icon: "text-neutral-400",
                        indicator: "bg-neutral-400",
                        bar: "bg-neutral-400",
                        spotlight: "bg-transparent"
                    };
            }
        };

        const styles = getStatusStyles();

        return (
            <button
                key={table.id}
                onClick={() => onSelectTable(table.id)}
                data-tutorial={index === 0 ? "pos-0-0-0" : undefined}
                className={cn(
                    "group relative flex flex-col items-center justify-center min-h-[160px] md:min-h-[180px] rounded-[48px] border transition-all duration-700 overflow-hidden shadow-sm hover:shadow-2xl w-full",
                    styles.container
                )}
            >
                {/* Museum Spotlight Effect */}
                <div className={cn(
                    "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none",
                    styles.spotlight
                )} />

                {/* Background subtle number - Museum Style */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-700 cursor-pointer pointer-events-none">
                    <span className="text-9xl md:text-[140px] font-serif font-black text-text-primary italic">{table.number}</span>
                </div>

                <div className="relative z-10 flex flex-col items-center gap-4">
                    <div className={cn(
                        "w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center font-serif font-bold text-3xl md:text-4xl transition-all duration-700 border",
                        styles.circle
                    )}>
                        {table.number}
                    </div>

                    <div className="flex flex-col items-center">
                        <span className="text-[10px] md:text-[12px] font-black text-text-muted uppercase tracking-[0.3em] group-hover:text-text-primary transition-colors">Table</span>
                        <div className="flex items-center gap-2 mt-1">
                            <Users className={cn("w-3 md:w-3.5 h-3 md:h-3.5", styles.icon)} />
                            <span className="text-[11px] md:text-[13px] font-bold text-text-primary font-serif italic">{table.seats} Pers.</span>
                        </div>
                    </div>
                </div>

                {/* Premium Indicator */}
                {['seated', 'ordered', 'eating', 'paying'].includes(table.status) && (
                    <div className="absolute top-6 right-6">
                        <div className={cn(
                            "w-2.5 h-2.5 rounded-full animate-pulse shadow-glow",
                            styles.indicator
                        )} />
                    </div>
                )}

                <div className={cn(
                    "absolute bottom-0 left-0 right-0 h-1.5 transition-all duration-700 opacity-10 md:opacity-0 group-hover:opacity-100",
                    styles.bar
                )} />
            </button>
        );
    };

    return (
        <div
            ref={scrollContainerRef}
            className="flex-1 overflow-auto bg-bg-primary transition-colors duration-500 relative elegant-scrollbar scroll-smooth"
        >
            {/* Visual Couture Background Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-accent-gold/5 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent-gold/5 blur-[150px] pointer-events-none" />

            {/* Cinematic Entrance Context */}
            <motion.div 
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 px-6 md:px-12 pt-10 pb-24"
            >

                {/* Refined Header - Minimal & Executive */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        className="flex flex-col"
                    >
                        <span className="text-accent-gold text-[10px] font-black uppercase tracking-[0.4em] mb-2">Protocole Service</span>
                        <h2 className="text-4xl md:text-5xl font-serif font-black text-text-primary tracking-tighter italic">
                            Plan de <span className="text-accent-gold not-italic">Salle</span>.
                        </h2>
                    </motion.div>

                    <div className="flex items-center gap-6">
                        {/* Status Couture Badge - Compact */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3, duration: 0.8 }}
                            className="px-6 py-3 rounded-full bg-accent-gold/5 border border-accent-gold/20 text-accent-gold flex items-center gap-4 shadow-soft backdrop-blur-sm"
                        >
                            <div className="w-2 h-2 rounded-full bg-accent-gold animate-pulse" />
                            <p className="text-[11px] font-black uppercase tracking-widest whitespace-nowrap">
                                {tables.filter((t: Table) => ['seated', 'ordered', 'eating', 'paying'].includes(t.status)).length} / {tables.length} Actives
                            </p>
                        </motion.div>

                        {/* View Mode Master Toggle */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4, duration: 0.8 }}
                            className="flex items-center bg-bg-secondary p-1 rounded-full border border-border shadow-soft"
                        >
                            <button
                                onClick={() => setViewMode('grid')}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all",
                                    viewMode === 'grid'
                                        ? "bg-white dark:bg-white text-black dark:text-black shadow-xl"
                                        : "text-text-muted dark:text-white/60 hover:text-text-primary dark:hover:text-white"
                                )}
                            >
                                <LayoutGrid strokeWidth={2} className="w-3.5 h-3.5" />
                                Global
                            </button>
                            <button
                                onClick={() => setViewMode('zones')}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all",
                                    viewMode === 'zones'
                                        ? "bg-white dark:bg-white text-black dark:text-black shadow-xl"
                                        : "text-text-muted dark:text-white/60 hover:text-text-primary dark:hover:text-white"
                                )}
                            >
                                <Layers strokeWidth={2} className="w-3.5 h-3.5" />
                                Zones
                            </button>
                        </motion.div>
                    </div>
                </div>

                {/* Main Production Grid with Cinematic Animation */}
                <motion.div
                    ref={gridRef}
                    initial="hidden"
                    animate="visible"
                    variants={{
                        hidden: { opacity: 0 },
                        visible: {
                            opacity: 1,
                            transition: {
                                staggerChildren: 0.08,
                                delayChildren: 0.1
                            }
                        }
                    }}
                >
                    {viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
                            {tables.map((table: Table) => (
                                <motion.div
                                    key={table.id}
                                    variants={{
                                        hidden: { opacity: 0, scale: 0.85, y: 100 },
                                        visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 120, damping: 20 } }
                                    }}
                                >
                                    {renderTableButton(table, tables.indexOf(table))}
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-20">
                            {zones.map(zone => {
                                const zoneTables = tables.filter((t: Table) => t.zoneId === zone.id);
                                if (zoneTables.length === 0) return null;

                                return (
                                    <div key={zone.id}>
                                        <div className="flex items-center gap-8 mb-10">
                                            <h3 className="text-4xl font-serif font-bold text-text-primary italic">{zone.name}</h3>
                                            <div className="h-0.5 flex-1 bg-gradient-to-r from-accent-gold/30 to-transparent" />
                                            <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.4em]">{zoneTables.length} Unités</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-8">
                                            {zoneTables.map((table: Table, idx: number) => renderTableButton(table, idx))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </motion.div>

                {/* Museum Footer Legend - Clean & Integrated */}
                <div className="mt-32 pt-16 border-t border-border/30 flex flex-wrap gap-x-16 gap-y-8 items-center justify-center bg-gradient-to-b from-transparent to-bg-tertiary/20 -mx-12 px-12 pb-12">
                    <div className="flex flex-col gap-4">
                        <span className="text-[9px] font-black text-accent-gold uppercase tracking-[0.4em] text-center mb-4">Légende des Protocoles</span>
                        <div className="flex flex-wrap gap-12 items-center justify-center">
                            <div className="flex items-center gap-4 group">
                                <div className="w-3 h-3 rounded-full border border-accent-gold/40 shadow-glow transition-all group-hover:scale-125" />
                                <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Disponible</span>
                            </div>
                            <div className="flex items-center gap-4 group">
                                <div className="w-3 h-3 rounded-full bg-accent-gold shadow-glow shadow-accent-gold/40 transition-all group-hover:scale-125" />
                                <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Installés</span>
                            </div>
                            <div className="flex items-center gap-4 group">
                                <div className="w-3 h-3 rounded-full bg-blue-500 shadow-glow shadow-blue-500/40 transition-all group-hover:scale-125" />
                                <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Commandé</span>
                            </div>
                            <div className="flex items-center gap-4 group">
                                <div className="w-3 h-3 rounded-full bg-orange-500 shadow-glow shadow-orange-500/40 transition-all group-hover:scale-125" />
                                <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">En Cours</span>
                            </div>
                            <div className="flex items-center gap-4 group">
                                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-glow shadow-emerald-500/40 transition-all group-hover:scale-125 animate-pulse" />
                                <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">Encaissement</span>
                            </div>
                            <div className="flex items-center gap-4 group">
                                <div className="w-3 h-3 rounded-full bg-purple-500 shadow-glow shadow-purple-500/40 transition-all group-hover:scale-125" />
                                <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em]">VIP</span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
