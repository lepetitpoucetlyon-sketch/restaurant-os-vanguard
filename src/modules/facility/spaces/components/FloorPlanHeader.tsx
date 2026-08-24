"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Layers, Sun, Building2, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/ui.foundations";

/**
 * FloorPlanHeader — toolbar éditoriale de l'éditeur de plan de salle.
 *
 * Extrait de app/(client)/(ops)/floor-plan/page.tsx dans le cadre du plan v3.1
 * P2.1. Voir aussi PosHeader / ReservationsHeader / KDSHeader pour la même
 * famille d'extraction.
 *
 * Gauche : kicker + big title étage + selector dropdown + fraction occupation.
 * Droite : rail mode (Sélecteur / Construire / Grille / 2D-3D) + Homologuer,
 *          ou toggle Layers seul en mobile.
 */

export interface FloorPlanHeaderFloor {
    id: string;
    name?: string | null;
    icon?: string | null;
}

const FLOOR_ICONS: Record<string, LucideIcon> = {
    home: Layers,
    layers: Layers,
    sun: Sun,
    building: Building2,
};

interface FloorPlanHeaderProps {
    // Floor identity
    currentFloor: FloorPlanHeaderFloor | undefined;
    floors: FloorPlanHeaderFloor[];
    currentFloorId: string | null | undefined;
    setCurrentFloor: (id: string) => void;
    showFloorSelector: boolean;
    setShowFloorSelector: (updater: (v: boolean) => boolean) => void;
    // KPI occupation
    occupancyPercent: number;
    occupiedSeats: number;
    totalSeatsOnFloor: number;
    tablesOnCurrentFloorLength: number;
    // Tools
    mode: "select" | "add";
    setMode: (mode: "select" | "add") => void;
    viewMode: "2d" | "3d";
    setViewMode: (updater: (v: "2d" | "3d") => "2d" | "3d") => void;
    showGrid: boolean;
    setShowGrid: (updater: (v: boolean) => boolean) => void;
    isMobile: boolean;
    isZonesLocked: boolean;
    toggleZonesLock: () => void;
    handleSave: () => void;
    // Optional right slot for domain-specific extras
    rightExtras?: ReactNode;
}

export function FloorPlanHeader({
    currentFloor,
    floors,
    currentFloorId,
    setCurrentFloor,
    showFloorSelector,
    setShowFloorSelector,
    occupancyPercent,
    occupiedSeats,
    totalSeatsOnFloor,
    tablesOnCurrentFloorLength,
    mode,
    setMode,
    viewMode,
    setViewMode,
    showGrid,
    setShowGrid,
    isMobile,
    isZonesLocked,
    toggleZonesLock,
    handleSave,
    rightExtras,
}: FloorPlanHeaderProps) {
    const FloorIcon = currentFloor?.icon ? FLOOR_ICONS[String(currentFloor.icon)] || Layers : Layers;

    return (
        <div className="px-6 lg:px-10 pt-6 pb-4 border-b border-border/40 bg-surface-card/40 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-6">
                {/* Left — floor identity */}
                <div className="flex items-center gap-5 min-w-0">
                    <div className="relative">
                        <button
                            onClick={() => setShowFloorSelector((v) => !v)}
                            aria-haspopup="listbox"
                            aria-expanded={showFloorSelector}
                            className="flex items-baseline gap-3 group"
                        >
                            <span className="font-serif font-black italic text-[11px] uppercase tracking-[0.32em] text-text-muted/70">Plan</span>
                            <span className="font-serif font-black text-2xl lg:text-3xl leading-none tracking-[-0.02em] text-text-primary truncate">
                                {String(currentFloor?.name || "—")}
                            </span>
                            <FloorIcon className="w-4 h-4 text-accent-gold/70 self-center -translate-y-0.5" />
                            <ChevronDown className={cn("w-4 h-4 text-text-muted transition-transform self-center", showFloorSelector && "rotate-180")} />
                        </button>

                        <AnimatePresence>
                            {showFloorSelector && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 8 }}
                                    transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.24 }}
                                    role="listbox"
                                    className="absolute top-full left-0 mt-3 w-[260px] bg-surface-card border border-border/60 rounded-xl shadow-2xl z-50 p-1 overflow-hidden"
                                >
                                    {floors.map((f) => {
                                        const isCurrent = f.id === currentFloorId;
                                        const I = f.icon && FLOOR_ICONS[String(f.icon)] ? FLOOR_ICONS[String(f.icon)] : Layers;
                                        return (
                                            <button
                                                key={f.id}
                                                onClick={() => {
                                                    setCurrentFloor(f.id);
                                                    setShowFloorSelector(() => false);
                                                }}
                                                role="option"
                                                aria-selected={isCurrent}
                                                className={cn(
                                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left",
                                                    isCurrent
                                                        ? "bg-accent-gold/12 text-accent-gold"
                                                        : "text-text-secondary hover:bg-surface-glass hover:text-text-primary"
                                                )}
                                            >
                                                <I className="w-4 h-4 opacity-80" />
                                                <span className="text-sm font-medium tracking-tight truncate">{String(f.name || "")}</span>
                                                {isCurrent && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-gold" />}
                                            </button>
                                        );
                                    })}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Occupancy KPI — editorial fraction */}
                    <div className="hidden lg:flex items-baseline gap-3 pl-6 border-l border-border/40">
                        <div className="flex items-baseline gap-1">
                            <span className="font-serif font-black text-xl leading-none tabular-nums text-accent-gold">{occupancyPercent}</span>
                            <span className="text-sm text-accent-gold/60">%</span>
                        </div>
                        <span className="font-serif italic text-[11px] uppercase tracking-[0.24em] text-text-muted/70">Occupation</span>
                        <span className="text-xs text-text-muted tabular-nums pl-2 border-l border-border/40 ml-1">
                            {occupiedSeats}
                            <span className="text-text-muted/50 mx-0.5">/</span>
                            {totalSeatsOnFloor}
                            <span className="text-text-muted/60 ml-1 uppercase tracking-wider text-[10px]">pax</span>
                        </span>
                        <span className="text-xs text-text-muted tabular-nums">
                            <span className="tabular-nums">{tablesOnCurrentFloorLength}</span>
                            <span className="text-text-muted/60 uppercase tracking-wider text-[10px] ml-1">tables</span>
                        </span>
                    </div>
                </div>

                {/* Right — tools */}
                <div className="flex items-center gap-3 shrink-0">
                    {!isMobile ? (
                        <>
                            <div className="flex items-center h-10 bg-surface-glass border border-border/40 rounded-xl overflow-hidden">
                                <button
                                    onClick={() => setMode("select")}
                                    aria-pressed={mode === "select"}
                                    className={cn(
                                        "h-full px-4 text-xs font-medium tracking-tight transition-colors border-r border-border/40",
                                        mode === "select" ? "bg-surface-glass-hover text-text-primary" : "text-text-muted hover:text-text-primary"
                                    )}
                                >
                                    Sélecteur
                                </button>
                                <button
                                    onClick={() => setMode("add")}
                                    aria-pressed={mode === "add"}
                                    className={cn(
                                        "h-full px-4 text-xs font-medium tracking-tight transition-colors border-r border-border/40",
                                        mode === "add" ? "bg-surface-glass-hover text-text-primary" : "text-text-muted hover:text-text-primary"
                                    )}
                                >
                                    Construire
                                </button>
                                <button
                                    onClick={() => setShowGrid((v) => !v)}
                                    aria-pressed={showGrid}
                                    title={showGrid ? "Masquer la grille" : "Afficher la grille"}
                                    className={cn(
                                        "h-full px-3 text-xs font-medium tracking-tight transition-colors border-r border-border/40",
                                        showGrid ? "bg-surface-glass-hover text-accent-gold" : "text-text-muted hover:text-text-primary"
                                    )}
                                >
                                    Grille
                                </button>
                                <button
                                    onClick={() => setViewMode((v) => (v === "2d" ? "3d" : "2d"))}
                                    aria-pressed={viewMode === "3d"}
                                    title={viewMode === "3d" ? "Passer en vue 2D" : "Passer en vue 3D"}
                                    className={cn(
                                        "h-full px-3 text-xs font-medium tracking-tight transition-colors",
                                        viewMode === "3d" ? "bg-accent-gold/20 text-accent-gold font-bold" : "text-text-muted hover:text-text-primary"
                                    )}
                                >
                                    {viewMode.toUpperCase()}
                                </button>
                            </div>
                            <button
                                onClick={handleSave}
                                className="h-10 px-5 bg-accent-gold hover:bg-accent-gold/90 text-[#0B0B0C] rounded-xl text-sm font-medium tracking-tight transition-colors shadow-[0_4px_20px_-6px_rgba(197,160,89,0.4)]"
                            >
                                Homologuer
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={toggleZonesLock}
                            aria-pressed={isZonesLocked}
                            className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center transition-colors border",
                                isZonesLocked ? "bg-accent-gold text-[#0B0B0C] border-accent-gold" : "bg-surface-glass border-border/40 text-text-muted"
                            )}
                        >
                            <Layers className="w-[15px] h-[15px]" />
                        </button>
                    )}
                    {rightExtras}
                </div>
            </div>
        </div>
    );
}
