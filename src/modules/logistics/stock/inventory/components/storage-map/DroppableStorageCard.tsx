
"use client";

import { useDroppable } from "@dnd-kit/core";
import { Thermometer, Package, ChefHat, ArrowRight, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/ui.foundations";;
import { StorageLocation } from "@nexus/contracts";
import { STORAGE_TYPE_CONFIG } from "./StorageTypeConfig";

interface DroppableStorageCardProps {
    location: StorageLocation;
    stockCount: number;
    prepCount: number;
    expiringCount: number;
    onClick: () => void;
    isSelected: boolean;
    isHighlighted?: boolean;
}

export function DroppableStorageCard({ location, stockCount, prepCount, expiringCount, onClick, isSelected, isHighlighted }: DroppableStorageCardProps) {
    const { isOver, setNodeRef } = useDroppable({
        id: `location-${location.id}`,
        data: { location }
    });

    const config = STORAGE_TYPE_CONFIG[location.type] || STORAGE_TYPE_CONFIG.other;
    const Icon = config.icon;

    return (
        <motion.div
            ref={setNodeRef}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            className={cn(
                "relative w-full p-5 rounded-2xl border-2 transition-all text-left cursor-pointer group overflow-hidden",
                isOver
                    ? "border-emerald-500 bg-status-success shadow-xl shadow-emerald-500/20 ring-4 ring-emerald-200 scale-105"
                    : isSelected
                        ? "border-default bg-surface-sidebar dark:border-white dark:bg-surface-card text-text-primary dark:text-primary shadow-xl"
                        : isHighlighted
                            ? "border-emerald-500 bg-status-success/5 shadow-2xl shadow-emerald-500/20 ring-4 ring-emerald-500/20"
                            : cn(config.borderColor, "bg-surface-card dark:bg-bg-secondary hover:shadow-lg")
            )}
        >
            {/* Highlighter Beam Effect */}
            <AnimatePresence>
                {isHighlighted && !isOver && !isSelected && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute inset-0 z-0"
                    >
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1),transparent_70%)] animate-pulse" />
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-status-success to-transparent opacity-50" />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Drop indicator overlay */}
            <AnimatePresence>
                {isOver && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex items-center justify-center bg-status-success/90 z-20 rounded-2xl"
                    >
                        <div className="text-center">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-14 h-14 mx-auto mb-2 rounded-full bg-status-success flex items-center justify-center"
                            >
                                <Plus className="w-7 h-7 text-text-primary" />
                            </motion.div>
                            <p className="text-sm font-black text-status-success uppercase tracking-tight">Déposer ici</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Expiring warning badge */}
            {expiringCount > 0 && !isOver && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-status-danger rounded-full flex items-center justify-center animate-pulse z-10">
                    <span className="text-nano font-black text-text-primary">{expiringCount}</span>
                </div>
            )}

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3">
                    <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        isSelected ? "bg-surface-card/20 dark:bg-surface-sidebar/10" : config.bgColor
                    )}>
                        <Icon className="w-5 h-5" style={{ color: isSelected ? 'white' : config.color }} />
                    </div>
                    {location.temperature !== undefined && (
                        <div className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono font-bold",
                            isSelected ? "bg-surface-card/20 text-text-primary dark:text-primary" : "bg-surface-card dark:bg-bg-tertiary text-primary dark:text-muted"
                        )}>
                            <Thermometer className="w-3 h-3" />
                            {location.temperature}°C
                        </div>
                    )}
                </div>

                <h3 className={cn(
                    "font-black text-sm uppercase tracking-tight truncate",
                    isSelected ? "text-text-primary dark:text-primary" : "text-primary dark:text-text-primary"
                )}>
                    {location.name.replace(/ - .*/, '')}
                </h3>

                <p className={cn(
                    "text-nano font-bold uppercase tracking-widest mt-1 truncate",
                    isSelected ? "text-text-primary/70 dark:text-primary/70" : "text-secondary dark:text-muted"
                )}>
                    {location.name.includes(' - ') ? location.name.split(' - ')[1] : config.label}
                </p>

                <div className="flex items-center gap-3 mt-3">
                    <div className={cn(
                        "flex items-center gap-1.5",
                        isSelected ? "text-text-primary/80" : "text-secondary"
                    )}>
                        <Package className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold">{stockCount}</span>
                    </div>
                    <div className={cn(
                        "flex items-center gap-1.5",
                        isSelected ? "text-text-primary/80" : "text-secondary"
                    )}>
                        <ChefHat className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold">{prepCount}</span>
                    </div>
                </div>
            </div>

            {/* Hover arrow */}
            {!isOver && (
                <div className={cn(
                    "absolute right-3 bottom-3 w-8 h-8 rounded-full flex items-center justify-center transition-all",
                    isSelected ? "bg-surface-card/20" : "bg-surface-bg group-hover:bg-surface-bg"
                )}>
                    <ArrowRight className={cn("w-4 h-4", isSelected ? "text-text-primary" : "text-secondary")} />
                </div>
            )}
        </motion.div>
    );
}
