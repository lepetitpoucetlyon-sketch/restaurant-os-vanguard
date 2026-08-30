"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Clock, 
  Search, 
  Flame, 
  BookOpen, 
  CheckCircle2, 
  ArrowRight,
  GlassWater
} from "lucide-react";
import { useAtomValue } from "jotai";
import { recipesAtom } from "@/store/pillars/logistics";
import { Recipe } from "@nexus/contracts";
import { cn } from "@/lib/ui.foundations";
import { EmptyState, Button } from "@/shared/components/ui";

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
  setSelectedRecipe: (recipe: import("@nexus/contracts").Recipe | null) => void;
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
        rushMode && "bg-status-danger/5"
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
                        "px-3 py-1 rounded-full border text-nano font-black tracking-widest",
                        rushMode ? "bg-status-danger text-text-primary border-red-500" : "bg-accent/10 text-accent border-accent/20"
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
                            className="h-10 w-32 pl-9 bg-transparent border-none text-micro font-bold focus:ring-0 placeholder:text-text-muted/50"
                        />
                    </div>
                    <div className="w-px h-6 bg-border mx-1" />
                    <button 
                        onClick={() => setRushMode(!rushMode)}
                        className={cn(
                            "h-10 px-4 rounded-xl flex items-center gap-2 transition-all font-black text-nano tracking-widest",
                            rushMode ? "bg-status-danger text-text-primary" : "bg-bg-tertiary text-text-muted hover:text-status-danger"
                        )}
                    >
                        <Flame className={cn("w-3.5 h-3.5", rushMode && "fill-current")} />
                        RUSH
                    </button>
                </div>
            </div>
        </div>

        {(() => {
            const filteredOrders = orders.filter(o => o.status !== 'delivered' && (searchQueryKDS === '' || o.table.toLowerCase().includes(searchQueryKDS.toLowerCase())));

            if (filteredOrders.length === 0) {
                return (
                    <div className="py-20 flex justify-center">
                        <EmptyState
                            icon={CheckCircle2}
                            title={searchQueryKDS ? "Aucun bon trouvé" : "Production Bar à Jour"}
                            description={searchQueryKDS ? `Aucun bon ne correspond à "${searchQueryKDS}".` : "Toutes les boissons ont été envoyées. En attente de nouvelles commandes..."}
                            action={searchQueryKDS ? (
                                <Button size="sm" variant="default" onClick={() => setSearchQueryKDS('')} className="text-xs">
                                    Effacer la recherche
                                </Button>
                            ) : undefined}
                        />
                    </div>
                );
            }

            return (
                <div 
                    className="grid gap-8 overflow-y-auto pb-32 pr-2 custom-scrollbar"
                    style={{ gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))` }}
                >
                    {filteredOrders.map((ticket) => {
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
                                    "bg-surface-card dark:bg-bg-secondary",
                                    isReady 
                                        ? "border-border bg-bg-secondary/30 grayscale-[0.5]" 
                                        : isUrgent 
                                            ? "border-red-500 shadow-[0_20px_50px_-15px_rgba(239,68,68,0.2)] ring-1 ring-red-500/20" 
                                            : isWarning
                                                ? "border-action-primary shadow-xl shadow-amber-500/5"
                                                : "border-black dark:border-subtle shadow-2xl shadow-neutral-200/50 dark:shadow-none"
                                )}
                            >
                                {/* Ticket Header - Serif Style */}
                                <div className={cn(
                                    "p-6 border-b transition-colors duration-500 relative",
                                    isUrgent ? "bg-status-danger/5" : "bg-bg-tertiary/50"
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
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-danger opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-status-danger"></span>
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-nano font-black uppercase tracking-[0.25em] text-text-muted mt-2">
                                                {ticket.serverName}
                                            </span>
                                        </div>

                                        <div className={cn(
                                            "px-3 py-2 rounded-xl font-mono text-sm font-black border flex items-center gap-2 shadow-sm transition-all",
                                            isUrgent ? "bg-status-danger text-text-primary border-red-500" :
                                            isWarning ? "bg-status-warning text-text-primary border-action-primary" :
                                            "bg-surface-card dark:bg-bg-tertiary text-text-primary border-border"
                                        )}>
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>{elapsed}m</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Items Deck */}
                                <div className="p-6 space-y-4 flex-1">
                                    {ticket.items.map((item, itemIdx) => {
                                        return (
                                            <div
                                                key={itemIdx}
                                                className={cn(
                                                    "p-4 rounded-2xl border transition-all relative overflow-hidden",
                                                    "bg-bg-tertiary/30 border-border"
                                                )}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn(
                                                            "w-8 h-8 rounded-xl font-mono font-black flex items-center justify-center text-sm shadow-sm",
                                                            "bg-action-primary text-text-on-primary"
                                                        )}>
                                                            {item.qty}
                                                        </div>
                                                        <span className="font-bold text-text-primary text-base tracking-tight">
                                                            {item.name}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Recipe Direct Action */}
                                                {recipes && recipes.some(r => r.name.toLowerCase() === item.name.toLowerCase()) && (
                                                    <button
                                                        onClick={() => {
                                                            const match = recipes.find(r => r.name.toLowerCase() === item.name.toLowerCase());
                                                            if (match) setSelectedRecipe(match);
                                                        }}
                                                        className="mt-3 w-full py-1.5 px-3 rounded-xl bg-accent-gold/10 hover:bg-accent-gold/20 text-accent-gold border border-accent-gold/30 text-nano font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                                                    >
                                                        <BookOpen className="w-3 h-3" /> Fiche Recette
                                                    </button>
                                                )}

                                                {/* Modifiers / Notes */}
                                                {item.modifiers && item.modifiers.length > 0 && (
                                                    <div className="flex flex-wrap gap-1.5 mt-3">
                                                        {item.modifiers.map((mod, modIdx) => (
                                                            <span
                                                                key={modIdx}
                                                                className="px-2 py-0.5 rounded-lg text-micro font-bold bg-surface-card border border-border text-text-secondary"
                                                            >
                                                                {mod}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                {item.notes && (
                                                    <div className="mt-2 text-micro italic text-status-danger font-medium">
                                                        "{ item.notes }"
                                                    </div>
                                                )}

                                                <div className="mt-4 pt-3 border-t border-dashed border-border flex items-center justify-between text-chip-label-sm text-text-muted">
                                                    <div className="flex items-center gap-1.5">
                                                        <GlassWater className="w-3 h-3" />
                                                        <span>{item.details?.glass || 'VERRE STD'}</span>
                                                    </div>
                                                    <span>{item.details?.method || 'SERVICE'}</span>
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
                                            className="w-full h-16 rounded-[20px] font-black uppercase tracking-[0.3em] text-nano transition-all bg-action-primary hover:bg-action-primary-hover text-text-on-primary hover:scale-[1.02] active:scale-[0.98] shadow-2xl flex items-center justify-center gap-3"
                                            onClick={() => updateOrderStatus(ticket.id, 'preparing')}
                                        >
                                            <Flame className="w-4 h-4 text-status-warning fill-current" />
                                            LANCER PRODUCTION
                                        </button>
                                    )}
                                    {ticket.status === 'preparing' && (
                                        <button
                                            className="w-full h-16 rounded-[20px] font-black uppercase tracking-[0.3em] text-nano transition-all bg-status-success text-text-primary hover:bg-status-success hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3"
                                            onClick={() => updateOrderStatus(ticket.id, 'ready')}
                                        >
                                            MARQUER PRÊT <ArrowRight className="w-4 h-4" />
                                        </button>
                                    )}
                                    {ticket.status === 'ready' && (
                                        <button
                                            className="w-full h-16 rounded-[20px] font-black uppercase tracking-[0.3em] text-nano transition-all bg-bg-tertiary border-2 border-border text-text-primary hover:bg-surface-glass flex items-center justify-center gap-3"
                                            onClick={() => updateOrderStatus(ticket.id, 'delivered')}
                                        >
                                            <CheckCircle2 className="w-4 h-4 text-status-success" />
                                            CLÔTURER BON
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            );
        })()}
    </div>
  );
};
