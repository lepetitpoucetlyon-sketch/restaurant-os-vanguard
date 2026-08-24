"use client";

import { motion } from "framer-motion";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import type { StockItem, StorageLocation } from "@nexus/contracts";
import { STORAGE_TYPE_CONFIG } from "../StorageTypeConfig";

interface StorageStockItemCardProps {
    item: StockItem;
    isMoving: boolean;
    setMovingItemId: (id: string | null) => void;
    onTransferStock: (stockItemId: string, toLocation: string) => void;
    otherLocations: StorageLocation[];
}

export function getDlcStatus(dlc: string) {
    const today = new Date();
    const dlcDate = new Date(dlc);
    const daysUntil = Math.ceil((dlcDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (daysUntil < 0) return { label: 'Expiré', color: 'text-status-danger bg-surface-bg border-red-200', badge: 'bg-status-danger' };
    if (daysUntil === 0) return { label: "Aujourd'hui", color: 'text-status-warning bg-status-warning border-orange-200', badge: 'bg-status-warning' };
    if (daysUntil <= 2) return { label: `J+${daysUntil}`, color: 'text-status-warning bg-status-warning border-amber-200', badge: 'bg-status-warning' };
    return { label: `J+${daysUntil}`, color: 'text-status-success bg-surface-bg border-green-200', badge: 'bg-status-success' };
}

export const formatDate = (date: string) => new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });

export function StorageStockItemCard({
    item,
    isMoving,
    setMovingItemId,
    onTransferStock,
    otherLocations,
}: StorageStockItemCardProps) {
    const dlcStatus = getDlcStatus(item.dlc);

    return (
        <motion.div
            layout
            className="p-4 bg-bg-primary rounded-xl border border-border hover:border-accent/40 hover:shadow-lg transition-all group"
        >
            <div className="flex items-start gap-4">
                <div className={cn("w-1.5 h-full min-h-[40px] rounded-full", dlcStatus.badge)} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                            <p className="font-serif text-lg font-light text-text-primary italic truncate leading-tight">{item.ingredientName}</p>
                            <div className="flex items-center gap-3 mt-1.5">
                                <span className="text-sm font-mono font-bold text-text-secondary">
                                    {item.quantity} {item.unit}
                                </span>
                                {item.batchNumber && (
                                    <span className="text-[9px] font-black text-text-muted uppercase px-2 py-0.5 bg-bg-tertiary rounded-sm border border-border">
                                        Lot: {item.batchNumber}
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className={cn("px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border shadow-sm", dlcStatus.color)}>
                            {dlcStatus.label}
                        </div>
                    </div>

                    <div className="flex items-center gap-4 mt-3 text-[10px] font-black text-text-muted uppercase tracking-wider">
                        <span className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3" />
                            {formatDate(item.receptionDate)}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            DLC: {formatDate(item.dlc)}
                        </span>
                    </div>

                    {/* Transfer button */}
                    <div className="mt-4 pt-3 border-t border-border">
                        {isMoving ? (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-black text-text-primary uppercase">Déplacer vers :</p>
                                    <button onClick={() => setMovingItemId(null)} className="text-[10px] font-bold text-text-muted hover:text-text-primary">
                                        Annuler
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                                    {otherLocations.slice(0, 6).map(loc => {
                                        const locConfig = STORAGE_TYPE_CONFIG[loc.type] || STORAGE_TYPE_CONFIG.other;
                                        const LocIcon = locConfig.icon;
                                        return (
                                            <button
                                                key={loc.id}
                                                onClick={() => {
                                                    onTransferStock(item.id, loc.id);
                                                    setMovingItemId(null);
                                                }}
                                                className="flex items-center gap-2 p-2.5 bg-bg-tertiary border border-border rounded-xl hover:border-accent hover:bg-accent/5 transition-all text-left group/loc"
                                            >
                                                <LocIcon className="w-3.5 h-3.5 text-text-muted group-hover/loc:text-accent transition-colors" />
                                                <span className="text-[10px] font-bold text-text-primary truncate">{loc.name}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setMovingItemId(item.id)}
                                className="flex items-center gap-2 px-4 py-2 bg-text-primary text-bg-primary rounded-xl hover:bg-accent hover:text-text-primary transition-all text-chip-label shadow-lg"
                            >
                                <ArrowRight className="w-3.5 h-3.5" />
                                Déplacer
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
