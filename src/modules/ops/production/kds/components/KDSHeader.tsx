'use client';

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Table as TableIcon, Search, LayoutGrid, Zap, Bell, RotateCcw, Ban } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { ActionGuard } from "@/shared/components/rbac/ActionGuard";
import { SettingsGearButton } from "@/shared/components/settings/ContextualSettings";
import { STATION_CONFIG, KitchenStation } from '..';

interface KDSHeaderProps {
    activeStation: KitchenStation;
    lockedStation?: KitchenStation | null;
    setActiveStation: (station: KitchenStation) => void;
    ordersCount: number;
    preparingOrdersCount: number;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    gridColumns: number;
    setGridColumns: (cols: number) => void;
    currentTime: Date;
    rushMode: boolean;
    setRushMode: (mode: boolean) => void;
    pendingModificationsCount: number;
    setShowModificationAlerts: (show: boolean) => void;
    isRecallMode: boolean;
    setIsRecallMode: (v: boolean) => void;
    onOpen86?: () => void;
}

export function KDSHeader({
    activeStation,
    lockedStation,
    setActiveStation,
    ordersCount,
    preparingOrdersCount,
    searchQuery,
    setSearchQuery,
    gridColumns,
    setGridColumns,
    currentTime,
    rushMode,
    setRushMode,
    pendingModificationsCount,
    setShowModificationAlerts,
    isRecallMode,
    setIsRecallMode,
    onOpen86,
}: KDSHeaderProps) {
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [isGridDropdownOpen, setIsGridDropdownOpen] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const gridDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsSearchExpanded(false);
            }
            if (gridDropdownRef.current && !gridDropdownRef.current.contains(event.target as Node)) {
                setIsGridDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <header className={cn(
            "relative z-20 w-full shrink-0 transition-colors duration-500",
            rushMode ? "bg-red-950/25" : "bg-bg-primary/60",
            "backdrop-blur-xl border-b border-border/40"
        )}>
            {/* Rush ribbon */}
            {rushMode && (
                <div className="h-[2px] w-full bg-gradient-to-r from-red-500/0 via-red-500 to-red-500/0" />
            )}

            {/* gap-3 sous lg : à 768px, `gap-6` sur 9 intervalles consommait 216px —
                plus du quart de l'écran — et ne laissait rien à la barre de stations,
                écrasée à 31px. Les 10 enfants de cette rangée génèrent leurs
                intervalles même lorsqu'ils sont masqués (`hidden lg:flex`). */}
            {/* Padding calé sur le bleed négatif de KDSDashboard (`-m-4 md:-m-8`) :
                sans compensation, l'en-tête sort de la coquille arrondie et se fait
                rogner à gauche (le « C » de CUISINE, puis l'heure elle-même).
                <md : -16px → px-4 ‖ md..lg : -32px → px-8 ‖ ≥lg : mise en page large. */}
            <div className="w-full max-w-[1800px] mx-auto flex items-center gap-3 lg:gap-6 px-4 md:px-8 lg:px-10 h-[76px]">
                {/* Signature editorial title */}
                <div className="flex items-baseline gap-3 shrink-0">
                    {/* lg et non md : à 768px le `-m-8` de KDSDashboard tire l'en-tête
                        sous le bord arrondi de la coquille, qui rognait le « C » de
                        « CUISINE ». Le kicker n'apparaît qu'à partir de la largeur
                        où il tient réellement. */}
                    <span className="font-serif font-black italic text-micro uppercase tracking-[0.32em] text-text-muted/70 hidden lg:inline">Cuisine</span>
                    <span className="font-serif font-black text-2xl leading-none tracking-[-0.02em] text-text-primary tabular-nums">
                        {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {rushMode && (
                        <span className="flex items-center gap-2 pl-2">
                            <span className="relative flex w-2 h-2">
                                <span className="absolute inset-0 rounded-full bg-red-500/60 animate-ping" />
                                <span className="relative rounded-full w-2 h-2 bg-red-500" />
                            </span>
                            <span className="font-serif italic text-micro tracking-[0.24em] uppercase text-red-500/90">Rush</span>
                        </span>
                    )}
                </div>

                {/* Station filters — one authored spring-pill motion */}
                {/* Sous 1024px (tablette de passe), la rangée d'en-tête mesurait 1218px
                    pour un viewport de 768px : 450px de stations passaient hors cadre,
                    et le parent en `overflow-x: hidden` les rendait DÉFINITIVEMENT
                    inatteignables — un cuisinier ne pouvait plus sélectionner les
                    dernières stations. La barre défile désormais au doigt ; les
                    contrôles à droite (recherche, réglages) restent ancrés. */}
                <nav aria-label="Stations" className="flex items-center bg-surface-glass border border-border/40 rounded-xl p-1 flex-1 min-w-0 overflow-x-auto scrollbar-hide lg:flex-none lg:shrink-0 lg:overflow-x-visible">
                    {(Object.keys(STATION_CONFIG) as KitchenStation[]).map(station => {
                        const config = STATION_CONFIG[station];
                        const Icon = config.icon;
                        const isActive = activeStation === station;
                        const isDisabled = lockedStation ? lockedStation !== station : false;
                        return (
                            <button
                                key={station}
                                onClick={() => setActiveStation(station)}
                                disabled={isDisabled}
                                aria-current={isActive ? "page" : undefined}
                                className={cn(
                                    // shrink-0 : la nav est devenue un conteneur défilable ;
                                    // sans lui les pastilles se compriment au lieu de défiler.
                                    "relative flex shrink-0 items-center gap-2 h-9 px-4 rounded-lg text-xs font-medium tracking-tight transition-colors z-10",
                                    isActive ? "text-text-primary" : "text-text-muted hover:text-text-primary",
                                    isDisabled && "opacity-30 cursor-not-allowed hidden md:flex"
                                )}
                            >
                                {isActive && (
                                    <motion.span
                                        layoutId="kds-active-station"
                                        className="absolute inset-0 rounded-lg bg-accent-gold/12 border border-accent-gold/30 z-[-1]"
                                        transition={{ type: "spring", stiffness: 320, damping: 28 }}
                                    />
                                )}
                                <Icon className={cn("w-[15px] h-[15px]", isActive ? "text-accent-gold" : "opacity-70")} strokeWidth={2} />
                                <span>{config.label}</span>
                                {isDisabled && lockedStation && <span className="absolute inset-0 z-20 cursor-not-allowed" title="Restreint par RBAC" />}
                            </button>
                        );
                    })}
                </nav>

                {/* Prep counter — editorial fraction, tabular */}
                <div className="hidden lg:flex items-baseline gap-2 shrink-0 pl-2 pr-1">
                    <TableIcon className="w-[15px] h-[15px] text-text-muted -translate-y-[1px]" strokeWidth={2} />
                    <span className="font-serif font-black text-lg leading-none tracking-tight text-accent-gold tabular-nums">
                        {preparingOrdersCount}
                    </span>
                    <span className="text-text-muted/60 tabular-nums text-sm">/</span>
                    <span className="font-serif font-medium text-sm text-text-muted tabular-nums">{ordersCount}</span>
                    <span className="font-serif italic text-nano uppercase tracking-[0.24em] text-text-muted/70 ml-1">en cours</span>
                </div>

                {/* Spacer — masqué sous lg : il entrait en concurrence avec la barre
                    de stations devenue `flex-1` et l'écrasait à 8px de large. */}
                <div className="hidden lg:block flex-1" />

                {/* Search — collapsible, minimal */}
                <div ref={searchRef} className="relative flex items-center shrink-0">
                    <AnimatePresence mode="wait">
                        {isSearchExpanded ? (
                            <motion.div
                                key="search-input"
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: 240, opacity: 1 }}
                                exit={{ width: 0, opacity: 0 }}
                                transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.28 }}
                                className="overflow-hidden"
                            >
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-[15px] h-[15px] text-accent-gold" strokeWidth={2} />
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="Rechercher…"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full h-9 bg-surface-glass border border-border/40 focus:border-accent-gold/50 rounded-lg pl-9 pr-3 text-sm font-normal tracking-tight focus:outline-none focus:ring-2 focus:ring-accent-gold/15 transition-colors placeholder:text-text-muted/60"
                                    />
                                </div>
                            </motion.div>
                        ) : (
                            <button
                                key="search-btn"
                                onClick={() => setIsSearchExpanded(true)}
                                aria-label="Rechercher un ticket"
                                className="w-10 h-10 flex items-center justify-center rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-glass-hover transition-colors"
                            >
                                <Search className="w-[15px] h-[15px]" strokeWidth={2} />
                            </button>
                        )}
                    </AnimatePresence>
                </div>

                {/* Grid selector */}
                <div ref={gridDropdownRef} className="relative shrink-0 z-[100]">
                    <button
                        onClick={() => setIsGridDropdownOpen(!isGridDropdownOpen)}
                        aria-label="Colonnes"
                        className={cn(
                            "flex items-center gap-1.5 h-10 px-3 rounded-lg text-sm font-medium tracking-tight transition-colors border",
                            isGridDropdownOpen
                                ? "bg-surface-glass-hover text-text-primary border-border"
                                : "bg-transparent border-transparent hover:bg-surface-glass-hover text-text-muted hover:text-text-primary"
                        )}
                    >
                        <LayoutGrid className="w-[15px] h-[15px]" strokeWidth={2} />
                        <span className="tabular-nums">{gridColumns}</span>
                    </button>
                    <AnimatePresence>
                        {isGridDropdownOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                animate={{ opacity: 1, y: 4, scale: 1 }}
                                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                                transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.2 }}
                                className="absolute top-full right-0 mt-2 p-1 w-14 bg-surface-card border border-border/60 rounded-xl shadow-xl flex flex-col gap-0.5 items-center overflow-hidden z-[101]"
                            >
                                {[3, 4, 5, 6].map(num => (
                                    <button
                                        key={num}
                                        onClick={() => { setGridColumns(num); setIsGridDropdownOpen(false); }}
                                        className={cn(
                                            "w-full h-8 rounded-md flex items-center justify-center text-sm font-medium tabular-nums transition-colors",
                                            gridColumns === num ? "bg-accent-gold/15 text-accent-gold" : "text-text-muted hover:bg-surface-glass-hover hover:text-text-primary"
                                        )}
                                    >
                                        {num}
                                    </button>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* 86 — mise en rupture d'un ingrédient */}
                {onOpen86 && (
                    <ActionGuard page="kds" action="eightysix_ingredient">
                        <button
                            onClick={onOpen86}
                            title="Mettre un ingrédient en 86"
                            className="flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-medium tracking-tight transition-colors border shrink-0 bg-surface-glass border-border/50 text-text-muted hover:text-error hover:border-error/50"
                        >
                            <Ban className="w-[15px] h-[15px]" strokeWidth={2} />
                            <span>86</span>
                        </button>
                    </ActionGuard>
                )}

                {/* Rush toggle — semantic red, no icon dance */}
                <button
                    onClick={() => setRushMode(!rushMode)}
                    aria-pressed={rushMode}
                    className={cn(
                        "flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-medium tracking-tight transition-colors border shrink-0",
                        rushMode
                            ? "bg-red-500 text-white border-red-500 shadow-[0_4px_20px_-6px_rgba(239,68,68,0.5)]"
                            : "bg-surface-glass border-border/50 text-text-muted hover:text-text-primary"
                    )}
                >
                    <Zap className="w-[15px] h-[15px]" strokeWidth={2} />
                    <span>{rushMode ? 'Rush' : 'Normal'}</span>
                </button>

                {/* Recall toggle */}
                <ActionGuard page="kds" action="recall_ticket">
                    <button
                        onClick={() => setIsRecallMode(!isRecallMode)}
                        aria-pressed={isRecallMode}
                        title="Rappel de ticket"
                        className={cn(
                            "flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-medium tracking-tight transition-colors border shrink-0",
                            isRecallMode
                                ? "bg-action-primary text-text-on-primary border-action-primary"
                                : "bg-surface-glass border-border/50 text-text-muted hover:text-text-primary"
                        )}
                    >
                        <RotateCcw className="w-[15px] h-[15px]" strokeWidth={2} />
                        <span>Rappel</span>
                    </button>
                </ActionGuard>

                {/* Bell — modification alerts */}
                <button
                    onClick={() => setShowModificationAlerts(true)}
                    aria-label="Alertes de modification"
                    className={cn(
                        "relative w-10 h-10 flex items-center justify-center rounded-lg transition-colors border shrink-0",
                        pendingModificationsCount > 0
                            ? "bg-status-warning/15 text-status-warning border-status-warning/40"
                            : "bg-surface-glass border-border/50 text-text-muted hover:text-text-primary"
                    )}
                >
                    <Bell className="w-[15px] h-[15px]" strokeWidth={2} />
                    {pendingModificationsCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-nano font-serif font-black tabular-nums flex items-center justify-center border-2 border-bg-primary">
                            {pendingModificationsCount}
                        </span>
                    )}
                </button>

                {/* Settings Gear Button (RBAC Config) */}
                <SettingsGearButton pageKey="kds" className="h-10 w-10 shrink-0 rounded-lg" />
            </div>
        </header>
    );
}
