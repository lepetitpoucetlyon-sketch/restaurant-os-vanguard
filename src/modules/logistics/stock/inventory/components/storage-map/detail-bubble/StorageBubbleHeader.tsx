"use client";

import { X, Thermometer, Package } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import type { StorageLocation, StockItem } from "@nexus/contracts";
import { STORAGE_TYPE_CONFIG } from "../StorageTypeConfig";

interface StorageBubbleHeaderProps {
    location: StorageLocation;
    stockItems: StockItem[];
    onClose: () => void;
}

export function StorageBubbleHeader({
    location,
    stockItems,
    onClose,
}: StorageBubbleHeaderProps) {
    const config = STORAGE_TYPE_CONFIG[location.type] || STORAGE_TYPE_CONFIG.other;
    const Icon = config.icon;

    return (
        <div className={cn("relative p-6 overflow-hidden", config.bgColor)}>
            {/* Decorative gradient orbs */}
            <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-50" style={{ background: `radial-gradient(circle, ${config.color}40 0%, transparent 70%)` }} />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full opacity-30" style={{ background: `radial-gradient(circle, ${config.color}30 0%, transparent 70%)` }} />

            <div className="relative z-10">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl bg-surface-card/80 dark:bg-surface-sidebar/20 backdrop-blur flex items-center justify-center shadow-lg border border-default">
                            <Icon className="w-8 h-8" style={{ color: config.color }} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-serif font-light text-text-primary italic">{location.name}</h2>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest bg-surface-card/60 backdrop-blur" style={{ color: config.color }}>
                                    {config.label}
                                </span>
                                {location.zone && (
                                    <span className="px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest bg-surface-card/40 dark:bg-surface-sidebar/10 text-text-muted">
                                        {location.zone}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl bg-surface-card/60 dark:bg-surface-sidebar/20 backdrop-blur hover:bg-surface-card dark:hover:bg-surface-card/10 flex items-center justify-center transition-all hover:scale-110 border border-default"
                    >
                        <X className="w-5 h-5 text-text-primary" />
                    </button>
                </div>

                {/* Temperature & Stats Row */}
                <div className="flex items-center gap-3 mt-6">
                    {location.temperature !== undefined && (
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-surface-card/70 dark:bg-surface-sidebar/20 backdrop-blur rounded-xl shadow-sm border border-default">
                            <Thermometer className="w-4 h-4" style={{ color: config.color }} />
                            <span className="text-2xl font-mono font-light text-text-primary">{location.temperature}°C</span>
                            {location.temperatureMin !== undefined && location.temperatureMax !== undefined && (
                                <span className="text-nano font-bold text-text-muted ml-1">
                                    ({location.temperatureMin} à {location.temperatureMax}°C)
                                </span>
                            )}
                        </div>
                    )}
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-surface-card/70 dark:bg-surface-sidebar/20 backdrop-blur rounded-xl shadow-sm border border-default">
                        <Package className="w-4 h-4 text-text-muted" />
                        <span className="text-lg font-mono font-light text-text-primary">{stockItems.length}</span>
                        <span className="text-nano font-black text-text-muted uppercase tracking-widest">ARTICLES</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
