import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Utensils, Table as TableIcon, Search, LayoutGrid, Zap, Bell } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { STATION_CONFIG, KitchenStation } from "@modules/kds";

interface KDSHeaderProps {
    activeStation: KitchenStation;
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
}

export function KDSHeader({
    activeStation,
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
    setShowModificationAlerts
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
        <div className="relative z-20 w-full border-b border-border/50 bg-bg-primary/60 backdrop-blur-xl shrink-0">
            <div className="w-full overflow-x-auto md:overflow-visible no-scrollbar py-6 px-4 md:px-8">
                <div className="min-w-max mx-auto flex items-center justify-center">
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="relative z-50 flex items-center gap-1.5 bg-surface-card/80 backdrop-blur-2xl border border-default rounded-full p-2 shadow-2xl ring-1 ring-black/5"
                    >
                        {/* 1. Station Filters */}
                        <div className="flex items-center p-1.5 bg-surface-bg/50 rounded-full border border-black/5 shadow-inner relative group/filters">
                            {(Object.keys(STATION_CONFIG) as KitchenStation[]).map(station => {
                                const config = STATION_CONFIG[station];
                                const Icon = config.icon;
                                const isActive = activeStation === station;

                                return (
                                    <button
                                        key={station}
                                        onClick={() => setActiveStation(station)}
                                        className={cn(
                                            "relative flex items-center gap-2.5 px-6 h-11 rounded-full font-bold text-[10px] uppercase tracking-[0.2em] transition-colors duration-300 z-10",
                                            isActive ? config.activeText : "text-secondary hover:text-primary"
                                        )}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="activeFilterPill"
                                                className={cn("absolute inset-0 rounded-full z-[-1] shadow-lg", config.activeBg)}
                                                initial={false}
                                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                            />
                                        )}
                                        <Icon className={cn("w-3.5 h-3.5 z-10", isActive ? "text-inherit" : config.iconColor)} strokeWidth={2.5} />
                                        <span className="relative z-10">{config.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="w-px h-8 bg-surface-bg mx-2" />

                        {/* 2. Status Badges */}
                        <div className="flex items-center gap-3 px-6 h-12 rounded-full bg-surface-bg/50 border border-black/5">
                            <div className="w-2.5 h-2.5 rounded-full bg-accent-gold animate-pulse shadow-[0_0_12px_rgba(212,175,55,0.6)]" />
                            <div className="flex items-center gap-2.5">
                                <span className="text-[12px] font-black text-accent-gold nums-proportional">
                                    {preparingOrdersCount}<span className="text-muted mx-1">/</span>{ordersCount}
                                </span>
                                <TableIcon className="w-4 h-4 text-muted" strokeWidth={2} />
                            </div>
                        </div>

                        <div className="w-px h-8 bg-surface-bg mx-2" />

                        {/* 3. Search */}
                        <div ref={searchRef} className="relative flex items-center">
                            <AnimatePresence mode="wait">
                                {isSearchExpanded ? (
                                    <motion.div
                                        initial={{ width: 0, opacity: 0 }}
                                        animate={{ width: 260, opacity: 1 }}
                                        exit={{ width: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="relative mx-2">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-accent-gold" strokeWidth={2.5} />
                                            <input
                                                autoFocus
                                                type="text"
                                                placeholder="RECHERCHER..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full h-12 bg-surface-bg border border-transparent focus:border-accent-gold/50 rounded-full pl-10 pr-4 text-[11px] font-bold uppercase tracking-wider focus:outline-none focus:ring-4 focus:ring-accent-gold/10 transition-all placeholder:text-muted"
                                            />
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setIsSearchExpanded(true)}
                                        className="w-12 h-12 flex items-center justify-center rounded-full text-muted hover:text-accent-gold hover:bg-surface-bg transition-colors"
                                    >
                                        <Search className="w-5 h-5" strokeWidth={2} />
                                    </motion.button>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="w-px h-8 bg-surface-bg mx-2" />

                        {/* 4. Grid Selector */}
                        <div ref={gridDropdownRef} className="relative z-[100]">
                            <button
                                onClick={() => setIsGridDropdownOpen(!isGridDropdownOpen)}
                                className={cn(
                                    "flex items-center gap-2.5 px-5 h-12 rounded-full font-bold text-[12px] transition-all border",
                                    isGridDropdownOpen
                                        ? "bg-surface-sidebar text-white border-transparent shadow-lg"
                                        : "bg-transparent border-transparent hover:bg-surface-bg text-secondary"
                                )}
                            >
                                <LayoutGrid className="w-4 h-4" strokeWidth={2} />
                                <span>{gridColumns}</span>
                            </button>
                            <AnimatePresence>
                                {isGridDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 4, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute top-full left-1/2 -translate-x-1/2 mt-2 p-1.5 w-16 bg-surface-card border border-subtle rounded-2xl shadow-xl flex flex-col gap-1 items-center overflow-hidden z-[101]"
                                    >
                                        {[3, 4, 5, 6].map(num => (
                                            <button
                                                key={num}
                                                onClick={() => {
                                                    setGridColumns(num);
                                                    setIsGridDropdownOpen(false);
                                                }}
                                                className={cn(
                                                    "w-full h-8 rounded-xl flex items-center justify-center text-[11px] font-bold transition-all",
                                                    gridColumns === num ? "bg-accent-gold text-white" : "text-secondary hover:bg-surface-bg"
                                                )}
                                            >
                                                {num}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="w-px h-10 bg-surface-bg mx-4" />

                        {/* 5. Production Info */}
                        <div className="flex items-center gap-4 pr-1 relative z-10">
                            <div className="flex flex-col items-center min-w-[80px]">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-accent-gold mb-0.5">TIME</span>
                                <span className="font-variant-numeric text-xl font-medium tracking-tight text-primary leading-none">
                                    {currentTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            <button
                                onClick={() => setRushMode(!rushMode)}
                                className={cn(
                                    "flex items-center gap-3 px-6 h-12 rounded-full font-black text-[10px] uppercase tracking-[0.25em] transition-all border duration-300",
                                    rushMode ? "bg-status-danger text-white border-red-500 shadow-lg shadow-red-500/20" : "bg-surface-card border-subtle text-muted hover:text-accent-gold hover:border-accent-gold/50"
                                )}
                            >
                                <Zap className={cn("w-3.5 h-3.5", rushMode ? "fill-white" : "text-current")} strokeWidth={2} />
                                {rushMode ? 'RUSH' : 'NORMAL'}
                            </button>

                            <div className="relative pl-2 pr-1">
                                <button
                                    onClick={() => setShowModificationAlerts(true)}
                                    className={cn(
                                        "relative w-12 h-12 flex items-center justify-center rounded-full transition-all duration-300 group hover:scale-110 active:scale-95",
                                        pendingModificationsCount > 0 ? "bg-status-warning text-status-warning ring-2 ring-amber-500/20" : "bg-surface-bg text-muted hover:bg-surface-bg"
                                    )}
                                >
                                    <Bell className={cn("w-5 h-5 transition-transform group-hover:rotate-12", pendingModificationsCount > 0 && "animate-pulse")} strokeWidth={2} />
                                    {pendingModificationsCount > 0 && (
                                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-status-danger text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm transform group-hover:scale-110 transition-transform">
                                            {pendingModificationsCount}
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
