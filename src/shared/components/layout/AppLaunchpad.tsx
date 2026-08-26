"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Search } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import type { NavSection } from "@/config/navConfig";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useUI } from "@/shared/hooks";
import { useLanguage } from "@/shared/hooks";
import { useRouter } from "next/navigation";
import { LaunchpadStatusHub } from "@components/layout/LaunchpadStatusHub";
import { useAuth } from "@/shared/hooks";
import { useHasMounted } from "@/shared/hooks";


interface AppLaunchpadProps {
    isOpen: boolean;
    onClose: () => void;
    sections: NavSection[];
}

export function AppLaunchpad({ isOpen, onClose, sections }: AppLaunchpadProps) {
    const router = useRouter();
    const { theme: _theme, setIsMap3DOpen } = useUI();
    const mounted = useHasMounted();
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const { t } = useLanguage();
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isSearchActive && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isSearchActive]);

    const { hasAccess } = useAuth();
    if (!mounted) return null;

    // Flatten and filter items by permission
    const allItems = (sections || []).flatMap(section =>
        (section.items || [])
            // bypass hasAccess to show all items
            .map(item => ({ ...item, sectionKey: section.key, sectionTitle: section.title, sectionColor: section.color }))
    );

    // Filter items if searching
    const filteredItems = searchQuery
        ? allItems.filter(item =>
            t(`nav.${item.key}`, item.label).toLowerCase().includes(searchQuery.toLowerCase()) ||
            t(`nav.${item.sectionKey}`, item.sectionTitle || item.sectionKey).toLowerCase().includes(searchQuery.toLowerCase())
        )
        : allItems;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: "circOut" }}
                    className={cn(
                        "fixed inset-0 z-[100] backdrop-blur-3xl flex items-center justify-center overflow-hidden bg-surface-bg/95"
                    )}
                    onClick={() => {
                        if (isSearchActive) setIsSearchActive(false);
                        else onClose();
                    }}
                >
                    {/* Visual Background Glow - Deep Amber/Gold */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-accent-gold/5 blur-[150px] pointer-events-none" />

                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        transition={{ type: "spring", stiffness: 260, damping: 30 }}
                        className="w-full h-full relative"
                    >

                        {/* Executive Spotlight Search Bar - Revealed via Motion */}
                        <AnimatePresence>
                            {isSearchActive && (
                                <motion.div
                                    initial={{ opacity: 0, y: -40, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    className="absolute top-0 left-0 right-0 flex justify-center z-[130] pointer-events-none"
                                >
                                    <div
                                        className="relative w-full max-w-2xl px-6 pointer-events-auto mt-4"
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <div className="relative group flex items-center">
                                            <Search className="absolute left-10 top-1/2 -translate-y-1/2 w-6 h-6 text-accent-gold transition-colors z-10" />
                                            <input
                                                ref={searchInputRef}
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Escape") {
                                                        if (searchQuery) setSearchQuery("");
                                                        else setIsSearchActive(false);
                                                    }
                                                }}
                                                className="w-full h-20 pl-20 pr-16 bg-surface-glass border border-accent-gold/30 rounded-[2.5rem] text-2xl font-serif font-black italic text-text-primary outline-none focus:border-accent-gold focus:bg-surface-glass-hover transition-all tracking-tighter"
                                            />
                                            <button
                                                onClick={() => { setIsSearchActive(false); setSearchQuery(""); }}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center text-text-primary hover:text-accent-gold transition-all group/close"
                                            >
                                                <X className="w-6 h-6 group-hover/close:rotate-90 transition-transform duration-500" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>



                        {/* Grid Gallery - The Exhibition Floor */}
                        <motion.div
                                animate={{ y: isSearchActive ? 40 : 0, opacity: isSearchActive ? 0.9 : 1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="absolute inset-0 w-full h-full overflow-y-auto elegant-scrollbar pb-32 px-6 md:px-12 flex flex-col items-center"
                        >
                            {/* Cinematic Entrance Wrapper */}
                            <motion.div
                                initial={{ y: 150, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.8, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                                className="w-full flex flex-col items-center"
                            >
                                {/* Status Hub - Now in Flow */}
                                <div className="w-full flex justify-center mb-0 pointer-events-auto" onClick={e => e.stopPropagation()}>
                                    <LaunchpadStatusHub onClose={onClose} />
                                </div>

                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-x-3 gap-y-6 md:gap-x-12 md:gap-y-16">

                                    {/* 1. The Search Trigger (Loupe) - Always First */}
                                    {!isSearchActive && !searchQuery && (
                                        <motion.button
                                            initial={{ opacity: 0, scale: 0.5 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            layoutId="search-icon"
                                            onClick={() => setIsSearchActive(true)}
                                            onMouseEnter={() => setHoveredIndex(-1)}
                                            onMouseLeave={() => setHoveredIndex(null)}
                                            className="group flex flex-col items-center gap-6 transition-all duration-700 active:scale-95"
                                        >
                                            <div className="relative w-14 h-14 md:w-16 md:h-16 flex items-center justify-center group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-700">
                                                <div className="absolute inset-0 rounded-[2rem] md:rounded-[2.4rem] bg-surface-glass border-2 transition-all duration-700"
                                                    style={{
                                                        borderColor: hoveredIndex === -1 ? 'var(--color-accent-gold)' : 'rgba(0,0,0,0.05)',
                                                        boxShadow: hoveredIndex === -1
                                                            ? '0 15px 45px -10px rgba(197,160,89,0.5), inset 0 0 20px rgba(197,160,89,0.1)'
                                                            : 'none'
                                                    }}
                                                />
                                                <div className="absolute inset-[3px] rounded-[1.8rem] md:rounded-[2.2rem] bg-transparent border border-black/5" />
                                                <Search
                                                    className={cn("relative z-10 w-6 h-6 md:w-7 md:h-7 transition-all duration-700", hoveredIndex === -1 ? "text-accent-gold rotate-12 scale-110" : "text-text-muted")}
                                                    strokeWidth={1.5}
                                                />
                                            </div>
                                            <div className="flex flex-col items-center text-center">
                                                <span className="font-black text-micro md:text-[13px] uppercase tracking-[0.2em] group-hover:text-accent-gold transition-colors duration-500 text-text-primary/60">
                                                    {t('common.search')}
                                                </span>
                                                <div className="w-0 group-hover:w-10 h-0.5 bg-accent-gold transition-all duration-700 mt-2 rounded-full" />
                                            </div>
                                        </motion.button>
                                    )}

                                    {/* 2. Application Items */}
                                    {filteredItems.map((item, idx) => {
                                        const Icon = item.icon;
                                        const actualIdx = idx + (isSearchActive ? 0 : 1);
                                        return (
                                            <motion.div
                                                key={item.href}
                                                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                transition={{ delay: Math.min(idx * 0.01, 0.2), type: "spring", stiffness: 200, damping: 25 }}
                                                className="group flex flex-col items-center gap-6 transition-all duration-300 active:scale-95 cursor-pointer"
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Stop bubbling to prevent immediate overlay closure mismatch
                                                    if (item.key === 'system_map') {
                                                        setIsMap3DOpen(true);
                                                        onClose();
                                                    } else if (item.href.startsWith('http')) {
                                                        window.open(item.href, '_blank');
                                                        onClose();
                                                    } else {
                                                        onClose();
                                                        router.push(item.href);
                                                    }
                                                }}
                                                onMouseEnter={() => setHoveredIndex(actualIdx)}
                                                onMouseLeave={() => setHoveredIndex(null)}
                                            >
                                                <div
                                                    className="relative w-14 h-14 md:w-16 md:h-16 flex items-center justify-center group-hover:scale-110 group-hover:-translate-y-2 transition-all duration-300"
                                                >
                                                    {/* Museum Exhibit Card - Full Categorical Contour */}
                                                    <div
                                                        className="absolute inset-0 rounded-[2rem] md:rounded-[2.4rem] bg-surface-glass border-2 transition-all duration-300"
                                                        style={{
                                                            borderColor: hoveredIndex === actualIdx ? item.sectionColor : `${item.sectionColor}80`,
                                                            boxShadow: hoveredIndex === actualIdx
                                                                ? `0 15px 45px -10px ${item.sectionColor}80, inset 0 0 20px ${item.sectionColor}20`
                                                                : `0 5px 25px -5px ${item.sectionColor}40`
                                                        }}
                                                    />

                                                    {/* Inner Glass Layer */}
                                                    <div className="absolute inset-[3px] rounded-[1.8rem] md:rounded-[2.2rem] bg-transparent border border-black/5" />

                                                    {/* Light Shine Overlay */}
                                                    <div className="absolute inset-0 rounded-[2rem] md:rounded-[2.4rem] bg-gradient-to-br from-white/10 via-transparent to-black/20 opacity-60 pointer-events-none" />

                                                    {/* Icon - Curator Series */}
                                                    <Icon
                                                        className={cn(
                                                            "relative z-10 w-6 h-6 md:w-7 md:h-7 transition-all duration-300",
                                                            hoveredIndex !== actualIdx && "text-primary opacity-60"
                                                        )}
                                                        style={{
                                                            color: hoveredIndex === actualIdx ? item.sectionColor : undefined,
                                                            filter: hoveredIndex === actualIdx ? `drop-shadow(0 0 10px ${item.sectionColor}60)` : 'none',
                                                            transform: hoveredIndex === actualIdx ? 'scale(1.1) rotate(5deg)' : 'none',
                                                            opacity: hoveredIndex === actualIdx ? 1 : undefined
                                                        }}
                                                        strokeWidth={1.5}
                                                    />

                                                    {/* Floating Indicator Dot */}
                                                    <div
                                                        className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg scale-0 group-hover:scale-100 border-2 border-black"
                                                        style={{ backgroundColor: item.sectionColor }}
                                                    />
                                                </div>

                                                <div className="flex flex-col items-center text-center px-2">
                                                    <span className="font-serif font-black italic text-[13px] md:text-[15px] uppercase tracking-wider group-hover:text-accent-gold transition-all duration-300 line-clamp-2 max-w-[110px] md:max-w-[140px] leading-tight opacity-95 group-hover:opacity-100 text-primary">
                                                        {t(`nav.${item.key}`, item.label)}
                                                    </span>
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        whileHover={{ width: 40 }}
                                                        className="h-[3px] bg-gradient-to-r from-transparent via-accent-gold to-transparent mt-3 rounded-full shadow-[0_0_10px_rgba(197,160,89,0.5)]"
                                                    />
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
