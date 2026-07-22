"use client";

import { motion, AnimatePresence, Variants } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/ui.foundations";
import { useLanguage } from "@/hooks";
import { accordionContent } from "@/lib/motion";
import { NavSection } from "@/config/navConfig";
import { useState } from "react";
import { empireAudit } from "@/lib/audit";

interface SidebarNavigationProps {
    accessibleSections: NavSection[];
    pathname: string;
    isSidebarCollapsed: boolean;
    isMobileMenuOpen: boolean;
    setSidebarCollapsed: (val: boolean) => void;
    setIsMap3DOpen: (val: boolean) => void;
}

const navItemReveal: Variants = {
    hidden: { opacity: 0, x: -10 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
    }
};

export function SidebarNavigation({
    accessibleSections,
    pathname,
    isSidebarCollapsed,
    isMobileMenuOpen,
    setSidebarCollapsed,
    setIsMap3DOpen
}: SidebarNavigationProps) {
    const { t } = useLanguage();
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [expandedSections, setExpandedSections] = useState<string[]>(['main', 'intelligence', 'operations', 'clients', 'production', 'team', 'analytics', 'finance', 'accounting', 'admin']);

    const toggleSection = (sectionId: string) => {
        setExpandedSections(prev =>
            prev.includes(sectionId)
                ? prev.filter(id => id !== sectionId)
                : [...prev, sectionId]
        );
    };

    let globalIndex = 0;

    return (
        <nav
            className={cn(
                "flex-1 py-4 space-y-1 relative elegant-scrollbar overflow-y-auto no-scrollbar",
                (isSidebarCollapsed && !isMobileMenuOpen) ? "px-0" : "px-4"
            )}
            onMouseLeave={() => setHoveredIndex(null)}
        >
            {accessibleSections.map((section) => {
                const isExpanded = expandedSections.includes(section.id) || isSidebarCollapsed;
                const SectionIcon = section.icon;
                const hasActiveItem = (section.items || []).some(item => pathname === item.href);

                return (
                    <motion.div
                        key={section.id}
                        className="mb-6"
                        variants={navItemReveal}
                    >
                        {!(isSidebarCollapsed && !isMobileMenuOpen) ? (
                            <button
                                onClick={() => toggleSection(section.id)}
                                className={cn(
                                    "w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-all group outline-none mb-1",
                                    hasActiveItem ? "text-text-primary" : "text-text-muted hover:text-text-secondary"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div 
                                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all bg-bg-tertiary/50 group-hover:bg-bg-tertiary"
                                        style={{ color: section.color }}
                                    >
                                        <SectionIcon className="w-4 h-4 opacity-70 group-hover:opacity-100" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted dark:text-text-primary/80 group-hover:text-text-primary dark:group-hover:text-text-primary transition-all">
                                        {t(`nav.${section.key}`)}
                                    </span>
                                </div>
                                <motion.div
                                    animate={{ rotate: isExpanded ? 0 : -90, opacity: isExpanded ? 1 : 0.4 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <ChevronDown strokeWidth={2.5} className="w-3.5 h-3.5" />
                                </motion.div>
                            </button>
                        ) : (
                            <div className="flex justify-center py-2">
                                <button 
                                    onClick={() => {
                                        setSidebarCollapsed(false);
                                        if (!expandedSections.includes(section.id)) toggleSection(section.id);
                                    }}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-bg-tertiary/50 outline-none"
                                    style={{ color: section.color }}
                                    title={t(`nav.${section.key}`)}
                                >
                                    <SectionIcon className="w-4 h-4 opacity-50 hover:opacity-100" />
                                </button>
                            </div>
                        )}

                        <AnimatePresence initial={false}>
                            {(isExpanded || (isSidebarCollapsed && !isMobileMenuOpen)) && (
                                <motion.div
                                    initial={isSidebarCollapsed ? false : "hidden"}
                                    animate={isSidebarCollapsed ? false : "visible"}
                                    exit="hidden"
                                    variants={accordionContent}
                                    className={cn("overflow-hidden", !(isSidebarCollapsed && !isMobileMenuOpen) && "mt-1")}
                                >
                                    <div className="space-y-1">
                                        {(section.items || []).map((item) => {
                                            const isReallyCollapsed = isSidebarCollapsed && !isMobileMenuOpen;
                                            const currentIndex = globalIndex++;
                                            const isActive = pathname === item.href;
                                            const Icon = item.icon;

                                            return (
                                                <div key={item.href} className="relative group">
                                                    <Link
                                                        href={item.key === 'system_map' ? '#' : item.href}
                                                        prefetch={false}
                                                        onClick={(e) => {
                                                            empireAudit.log({
                                                                module: 'system',
                                                                action: 'NAVIGATION_CLICK',
                                                                details: { target: item.key, path: item.href },
                                                                timestamp: new Date()
                                                            });
                                                            if (item.key === 'system_map') {
                                                                e.preventDefault();
                                                                setIsMap3DOpen(true);
                                                            }
                                                        } }
                                                        target={item.href.startsWith('http') && item.key !== 'system_map' ? '_blank' : undefined}
                                                        rel={item.href.startsWith('http') && item.key !== 'system_map' ? 'noopener noreferrer' : undefined}
                                                        onMouseEnter={() => setHoveredIndex(currentIndex)}
                                                        className={cn(
                                                            "flex items-center rounded-2xl text-[13px] font-medium transition-all duration-700 relative overflow-hidden outline-none",
                                                            isActive
                                                                ? "text-text-primary bg-bg-secondary dark:bg-surface-card/10 border border-border/50 shadow-premium font-bold"
                                                                : "text-text-secondary dark:text-text-primary/80 hover:text-text-primary hover:bg-bg-tertiary/50",
                                                            isReallyCollapsed ? "justify-center h-12 w-12 mx-auto" : "px-5 py-3.5 gap-4 mx-0"
                                                        )}
                                                    >
                                                        {isActive && !isReallyCollapsed && (
                                                            <motion.div
                                                                layoutId="active-nav-indicator"
                                                                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-accent-gold rounded-r-full z-20"
                                                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                                            />
                                                        )}
                                                        <div className={cn("relative z-10 flex items-center", isReallyCollapsed ? "justify-center" : "gap-4 w-full")}>
                                                            <div className={cn(
                                                                "transition-all duration-700 p-2 rounded-xl",
                                                                isActive ? "bg-accent-gold/10 text-accent-gold scale-110 shadow-inner" : "text-text-muted group-hover:text-text-primary group-hover:scale-110"
                                                            )}>
                                                                <Icon strokeWidth={isActive ? 2 : 1.5} className="w-[18px] h-[18px]" />
                                                            </div>
                                                            {!isReallyCollapsed && (
                                                                <span className={cn(
                                                                    "tracking-tight transition-colors duration-700 font-serif italic text-lg font-bold leading-none py-1 flex items-center gap-2",
                                                                    isActive ? "text-text-primary" : "text-text-secondary dark:text-text-primary/90"
                                                                )}>
                                                                    {t(`nav.${item.key}`)}
                                                                    {item.badge && (
                                                                        <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 leading-none not-italic">
                                                                            {item.badge}
                                                                        </span>
                                                                    )}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </Link>
                                                    {isReallyCollapsed && hoveredIndex === currentIndex && (
                                                        <motion.div
                                                            initial={{ opacity: 0, x: 10, scale: 0.95, filter: "blur(4px)" }}
                                                            animate={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
                                                            exit={{ opacity: 0, x: 10, scale: 0.95, filter: "blur(4px)" }}
                                                            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                                                            className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-4 py-2 bg-text-primary dark:bg-bg-secondary text-bg-primary dark:text-text-primary text-[11px] font-black uppercase tracking-widest rounded-xl z-[100] shadow-2xl border border-border/50"
                                                        >
                                                            {t(`nav.${item.key}`)}
                                                        </motion.div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                );
            })}
        </nav>
    );
}
