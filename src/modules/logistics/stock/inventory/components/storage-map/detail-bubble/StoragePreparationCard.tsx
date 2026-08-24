"use client";

import { motion } from "framer-motion";
import { ChefHat, Clock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import type { Preparation, StorageLocation } from "@nexus/contracts";
import { STORAGE_TYPE_CONFIG } from "../StorageTypeConfig";
import { getDlcStatus, formatDate } from "./StorageStockItemCard";

interface StoragePreparationCardProps {
    prep: Preparation;
    isMoving: boolean;
    setMovingPrepId: (id: string | null) => void;
    onTransferPreparation: (prepId: string, toLocation: string) => void;
    otherLocations: StorageLocation[];
}

export function StoragePreparationCard({
    prep,
    isMoving,
    setMovingPrepId,
    onTransferPreparation,
    otherLocations,
}: StoragePreparationCardProps) {
    const dlcStatus = getDlcStatus(prep.dlc);

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
                            <p className="font-serif text-lg font-light text-text-primary italic truncate leading-tight">{prep.name}</p>
                            <div className="flex items-center gap-3 mt-1.5">
                                <span className="text-sm font-mono font-bold text-text-secondary">
                                    {prep.quantity} {prep.unit}
                                </span>
                                {prep.portions && (
                                    <span className="text-[9px] font-black text-accent uppercase px-2 py-0.5 bg-accent/5 rounded-sm border border-accent/20">
                                        {prep.portions} portions
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className={cn("px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border shadow-sm",
                            prep.status === 'use_today' ? 'text-status-warning bg-status-warning border-orange-200' : dlcStatus.color
                        )}>
                            {prep.status === 'use_today' ? "À utiliser" : dlcStatus.label}
                        </div>
                    </div>

                    <div className="flex items-center gap-4 mt-3 text-[10px] font-black text-text-muted uppercase tracking-wider">
                        <span className="flex items-center gap-1.5">
                            <ChefHat className="w-3 h-3" />
                            {prep.preparedBy}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            DLC: {formatDate(prep.dlc)}
                        </span>
                    </div>

                    {/* Transfer button */}
                    <div className="mt-4 pt-3 border-t border-border">
                        {isMoving ? (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-black text-text-primary uppercase">Déplacer vers :</p>
                                    <button onClick={() => setMovingPrepId(null)} className="text-[10px] font-bold text-text-muted hover:text-text-primary">
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
                                                    onTransferPreparation(prep.id, loc.id);
                                                    setMovingPrepId(null);
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
                                onClick={() => setMovingPrepId(prep.id)}
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
