"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Clock, 
  Search, 
  Flame, 
  Martini, 
  BookOpen, 
  CheckCircle2, 
  ArrowRight,
  GlassWater
} from "lucide-react";
import { useAtomValue } from "jotai";
import { recipesAtom } from "@/store/operationalAtoms";
import { Recipe } from "@nexus/contracts";
import { cn } from "@/lib/ui.foundations";

interface BarOrderItem {
  name: string;
  qty: number;
  station: string;
  image?: string;
  modifiers?: string[];
  notes?: string;
  details?: { glass?: string; method?: string };
}

interface BarOrder {
  id: string;
  table: string;
  serverName: string;
  status: string;
  priority: string;
  elapsed: number;
  items: BarOrderItem[];
}

interface KdsTabProps {
  orders: BarOrder[];
  rushMode: boolean;
  searchQueryKDS: string;
  gridColumns: number;
  updateOrderStatus: (orderId: string, nextStatus: string) => void;
  setRushMode: (mode: boolean) => void;
  setSearchQueryKDS: (query: string) => void;
  setSelectedRecipe: (recipe: any) => void;
}

export const KdsTab: React.FC<KdsTabProps> = ({
  orders,
  rushMode,
  searchQueryKDS,
  gridColumns,
  updateOrderStatus,
  setRushMode,
  setSearchQueryKDS,
  setSelectedRecipe
}) => {
  const recipes = useAtomValue(recipesAtom);
  
  return (

    <div className={cn(
        "animate-in fade-in duration-150 h-full flex flex-col relative",
        rushMode && "bg-red-500/5"
    )}>
        {/* Rush Mode Atmospheric Overlay */}
        <AnimatePresence>
            {rushMode && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 pointer-events-none z-10 bg-gradient-to-b from-error/5 to-transparent animate-pulse"
                />
            )}
        </AnimatePresence>

        <div className="flex items-center justify-between mb-8 relative z-20">
            <div>
                <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-black text-text-primary tracking-tighter">Production Bar</h2>
                    <div className={cn(
                        "px-3 py-1 rounded-full border text-[10px] font-black tracking-widest",
                        rushMode ? "bg-red-500 text-white border-red-500" : "bg-accent/10 text-accent border-accent/20"
                    )}>
                        {rushMode ? "MODE RUSH ACTIF" : "SERVICE STANDARD"}
                    </div>
                </div>
                <p className="text-text-muted text-sm mt-1">Coordination des boissons & mixologie</p>
            </div>
            
            <div className="flex items-center gap-4">
                {/* KDS Controls */}
                <div className="flex items-center gap-2 bg-bg-secondary p-1 rounded-2xl border border-border">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
                        <input 
                            type="text" 
                            placeholder="TABLE..."
                            value={searchQueryKDS}
                            onChange={(e) => setSearchQueryKDS(e.target.value)}
                            className="h-10 w-32 pl-9 bg-transparent border-none text-[11px] font-bold focus:ring-0 placeholder:text-text-muted/50"
                        />
                    </div>
                    <div className="w-px h-6 bg-border mx-1" />
                    <button 
                        onClick={() => setRushMode(!rushMode)}
                        className={cn(
                            "h-10 px-4 rounded-xl flex items-center gap-2 transition-all font-black text-[10px] tracking-widest",
                            rushMode ? "bg-red-500 text-white" : "bg-bg-tertiary text-text-muted hover:text-red-500"
                        )}
                    >
                        <Flame className={cn("w-3.5 h-3.5", rushMode && "fill-current")} />
                        RUSH
                    </button>
                </div>
            </div>
        </div>

        <div 
            className="grid gap-8 overflow-y-auto pb-32 pr-2 custom-scrollbar"
            style={{ gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))` }}
        >
            {orders.filter(o => o.status !== 'delivered' && (searchQueryKDS === '' || o.table.toLowerCase().includes(searchQueryKDS.toLowerCase()))).map((ticket) => {
                const elapsed = ticket.elapsed;
                const isReady = ticket.status === 'ready';
                const isUrgent = !isReady && (ticket.priority === 'rush' || elapsed >= 15);
                const isWarning = !isReady && (elapsed >= 8 && elapsed < 15);

                return (
                    <motion.div
                        key={ticket.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={cn(
                            "flex flex-col rounded-[2.5rem] overflow-hidden border transition-all duration-500 h-fit",
                            "bg-white dark:bg-bg-secondary",
                            isReady 
                                ? "border-border bg-bg-secondary/30 grayscale-[0.5]" 
                                : isUrgent 
                                    ? "border-red-500 shadow-[0_20px_50px_-15px_rgba(239,68,68,0.2)] ring-1 ring-red-500/20" 
                                    : isWarning
                                        ? "border-amber-500 shadow-xl shadow-amber-500/5"
                                        : "border-black dark:border-white/10 shadow-2xl shadow-neutral-200/50 dark:shadow-none"
                        )}
                    >
                        {/* Ticket Header - Serif Style */}
                        <div className={cn(
                            "p-6 border-b transition-colors duration-500 relative",
                            isUrgent ? "bg-red-500/5" : "bg-bg-tertiary/50"
                        )}>
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent-gold/30 to-transparent" />
                            
                            <div className="flex justify-between items-center">
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-3">
                                        <h3 className="font-serif font-black tracking-tight italic text-text-primary text-4xl">
                                            {ticket.table}
                                        </h3>
                                        {(isUrgent || rushMode) && (
                                            <span className="relative flex h-2.5 w-2.5">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-text-muted mt-2">
                                        {ticket.serverName}
                                    </span>
                                </div>

                                <div className={cn(
                                    "px-3 py-2 rounded-xl font-mono text-sm font-black border flex items-center gap-2 shadow-sm transition-all",
                                    isUrgent ? "bg-red-500 text-white border-red-500" :
                                    isWarning ? "bg-amber-500 text-white border-amber-500" :
                                    "bg-white dark:bg-bg-tertiary text-text-primary border-border"
                                )}>
                                    <Clock className={cn("w-3.5 h-3.5", (isUrgent || rushMode) && "animate-spin-slow")} />
                                    {elapsed}<span className="text-[9px] opacity-70 ml-0.5">MIN</span>
                                </div>
                            </div>
                        </div>

                        {/* Ticket Items - Splitting Logic */}
                        <div className="flex-1 p-6 flex flex-col gap-5">
                            {ticket.items.flatMap(item => {
                                if ((item.modifiers?.length || item.notes) && item.qty > 1) {
                                    return Array(item.qty).fill(null).map(() => ({ ...item, qty: 1 }));
                                }
                                return [item];
                            }).map((item, i) => {
                                const product = (recipes as any[]).find(p => p.name === item.name);
                                const hasMods = (item.modifiers && item.modifiers.length > 0) || item.notes;

                                return (
                                    <div key={i} className={cn(
                                        "group/item relative flex flex-col overflow-hidden rounded-[24px] bg-white dark:bg-bg-primary border transition-all duration-500",
                                        hasMods ? "border-amber-500/50 shadow-lg shadow-amber-500/5" : "border-border shadow-sm"
                                    )}>
                                        <div className="relative aspect-[16/9] w-full overflow-hidden">
                                            {item.image ? (
                                                <img src={item.image} className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-700 opacity-90" />
                                            ) : (
                                                <div className="w-full h-full bg-bg-tertiary flex items-center justify-center">
                                                    <Martini className="w-8 h-8 text-text-muted/30" />
                                                </div>
                                            )}
                                            
                                            <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-purple-600 text-white text-[9px] font-black tracking-widest shadow-lg">
                                                {item.station}
                                            </div>
                                            
                                            <div className="absolute top-3 right-3 w-9 h-9 rounded-xl bg-accent-gold text-bg-primary flex items-center justify-center font-black text-sm shadow-xl border border-black/10">
                                                {item.qty}
                                            </div>

                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedRecipe(product || (item as any));
                                                }}
                                                className="absolute bottom-3 right-3 w-9 h-9 rounded-xl bg-black/40 hover:bg-black/60 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white transition-all scale-0 group-hover/item:scale-100"
                                            >
                                                <BookOpen className="w-4 h-4" />
                                            </button>
                                        </div>

                                        <div className="p-4">
                                            <h4 className="font-serif text-lg font-bold text-text-primary tracking-tight leading-none mb-2">
                                                {item.name}
                                            </h4>
                                            
                                            {item.modifiers && item.modifiers.length > 0 && (
                                                <div className="flex flex-col gap-1 mt-3">
                                                    {item.modifiers.map((m, mi) => (
                                                        <span key={mi} className="text-xs font-bold text-amber-600 flex items-center gap-2">
                                                            <span className="w-1 h-1 rounded-full bg-amber-500" />
                                                            {m}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {item.notes && (
                                                <div className="mt-3 p-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-xs font-bold text-amber-700 italic">
                                                    "{ item.notes }"
                                                </div>
                                            )}

                                            <div className="mt-4 pt-3 border-t border-dashed border-border flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-text-muted">
                                                <div className="flex items-center gap-1.5">
                                                    <GlassWater className="w-3 h-3" />
                                                    <span>{item.details?.glass || 'VERRE STD'}</span>
                                                </div>
                                                <span>{item.details?.method || 'SERVICE'}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Action Footer - High Fidelity */}
                        <div className="p-6 pt-0 mt-auto">
                            <div className="h-px w-full bg-border/50 mb-6" />
                            {ticket.status === 'new' && (
                                <button
                                    className="w-full h-16 rounded-[20px] font-black uppercase tracking-[0.3em] text-[10px] transition-all bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:scale-[1.02] active:scale-[0.98] shadow-2xl flex items-center justify-center gap-3"
                                    onClick={() => updateOrderStatus(ticket.id, 'preparing')}
                                >
                                    <Flame className="w-4 h-4 text-orange-500 fill-current" />
                                    LANCER PRODUCTION
                                </button>
                            )}
                            {ticket.status === 'preparing' && (
                                <button
                                    className="w-full h-16 rounded-[20px] font-black uppercase tracking-[0.3em] text-[10px] transition-all bg-emerald-500 text-white hover:bg-emerald-600 hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3"
                                    onClick={() => updateOrderStatus(ticket.id, 'ready')}
                                >
                                    MARQUER PRÊT <ArrowRight className="w-4 h-4" />
                                </button>
                            )}
                            {ticket.status === 'ready' && (
                                <button
                                    className="w-full h-16 rounded-[20px] font-black uppercase tracking-[0.3em] text-[10px] transition-all bg-bg-tertiary border-2 border-border text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center gap-3"
                                    onClick={() => updateOrderStatus(ticket.id, 'delivered')}
                                >
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    CLÔTURER BON
                                </button>
                            )}
                        </div>
                    </motion.div>
                );
            })}
        </div>
    </div>
  );
};
