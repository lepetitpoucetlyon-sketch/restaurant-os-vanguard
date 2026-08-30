"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/ui.foundations";
import { useLanguage } from "@/shared/hooks";
import { useUI } from "@/shared/hooks";
import { useUniversalAssistant } from "@/shared/hooks/useUniversalAssistant";
import { useNotifications } from "@/shared/contexts/NotificationsContext";
import { NotificationPanel } from "@ui/NotificationPanel";
import {
    LayoutDashboard,
    Store,
    Map,
    MoreHorizontal,
    X,
    CalendarDays,
    Package,
    Users,
    Settings,
    Sparkles,
    Bell,
    Zap,
    Mic,
    ChefHat,
    MonitorSmartphone,
    Wine,
    Clock,
    Wallet,
    Heart,
    ScrollText,
    FileCheck,
    BarChart3,
} from "lucide-react";
import { mobileSpring } from "@/shared/utils/motion";

const PRIMARY_NAV = [
    { label: "dashboard", key: "dashboard", href: "/operations", icon: LayoutDashboard },
    { label: "pos", key: "pos", href: "/pos", icon: Store },
    { label: "floor_plan", key: "floor_plan", href: "/floor-plan", icon: Map },
    { label: "intelligence", key: "intelligence_hub", href: "/intelligence", icon: Zap },
];

const GRID_ITEMS = [
    { key: "kds", href: "/kds", icon: ChefHat, color: "#F97316" },
    { key: "pos_mobile", href: "/pos-mobile", icon: MonitorSmartphone, color: "#3B82F6" },
    { key: "reservations", href: "/reservations", icon: CalendarDays, color: "#EC4899" },
    { key: "inventory", href: "/inventory", icon: Package, color: "#84CC16" },
    { key: "timeclock", href: "/timeclock", icon: Clock, color: "#06B6D4" },
    { key: "bar", href: "/bar", icon: Wine, color: "#F97316" },
    { key: "crm", href: "/crm", icon: Heart, color: "#EC4899" },
    { key: "hr", href: "/staff", icon: Users, color: "#06B6D4" },
    { key: "planning", href: "/staff?tab=planning", icon: CalendarDays, color: "#06B6D4" },
    { key: "haccp", href: "/haccp", icon: Sparkles, color: "#14B8A6" },
    { key: "treasury", href: "/finance", icon: Wallet, color: "#EF4444" },
    { key: "nf525", href: "/nf525", icon: FileCheck, color: "#F59E0B" },
    { key: "analytics", href: "/analytics", icon: BarChart3, color: "#8B5CF6" },
    { key: "registre", href: "/registre", icon: ScrollText, color: "#0EA5E9" },
    { key: "settings", href: "/settings", icon: Settings, color: "#64748B" },
];

export function MobileNavBar() {
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
    const { t } = useLanguage();
    const { toggleTheme: _toggleTheme, openCommandPalette: _openCommandPalette } = useUI();
    const { unreadCount } = useNotifications();
    const { setViewMode, startVoiceListening } = useUniversalAssistant();

    return (
        <>
            {/* Dock UX */}
            <motion.nav
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                className="fixed bottom-6 left-6 right-6 z-[60] lg:hidden"
            >
                <div className="bg-surface-card/80 dark:bg-bg-primary/80 backdrop-blur-3xl border border-default dark:border-subtle rounded-[2.5rem] p-2 shadow-2xl flex items-center justify-between">
                    <div className="flex items-center gap-1">
                        {PRIMARY_NAV.map((item) => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;
                            return (
                                <Link key={item.href} href={item.href} prefetch={false} className="relative">
                                    <motion.div
                                        whileTap={{ scale: 0.9 }}
                                        className={cn(
                                            "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300",
                                            isActive ? "bg-text-primary text-text-primary dark:bg-accent-gold dark:text-bg-primary shadow-lg" : "text-text-muted"
                                        )}
                                    >
                                        <Icon strokeWidth={isActive ? 2 : 1.5} className="w-5 h-5" />
                                    </motion.div>
                                    {isActive && (
                                        <motion.div layoutId="nav-dot" className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-current rounded-full" />
                                    )}
                                </Link>
                            );
                        })}
                    </div>

                    <div className="w-px h-6 bg-border mx-2 opacity-20" />

                    <button onClick={() => setIsMenuOpen(true)} className="relative mr-1">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-text-muted bg-bg-tertiary/50">
                            <MoreHorizontal className="w-5 h-5" />
                            {unreadCount > 0 && <div className="absolute top-2 right-2 w-2 h-2 bg-status-danger rounded-full border border-white" />}
                        </div>
                    </button>
                </div>
            </motion.nav>

            {/* Premium More Menu Overlay */}
            <AnimatePresence>
                {isMenuOpen && (
                    <>
                        <motion.div role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); (e.currentTarget as HTMLElement).click(); } }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMenuOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[70]"
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={mobileSpring}
                            className="fixed bottom-0 left-0 right-0 z-[80] bg-surface-card rounded-t-[3.5rem] p-10 pb-[calc(2rem+env(safe-area-inset-bottom))]"
                        >
                            <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-10" />
                            <div className="flex justify-between items-center mb-10">
                                <h3 className="text-3xl font-serif font-black italic tracking-tight">Système OS<span className="text-accent-gold">.</span></h3>
                                <button onClick={() => setIsMenuOpen(false)} className="w-10 h-10 rounded-full bg-bg-tertiary flex items-center justify-center">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-6 max-h-[55vh] overflow-y-auto elegant-scrollbar pr-1 pb-4">
                                {GRID_ITEMS.map((item, idx) => (
                                    <motion.div key={item.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(idx * 0.03, 0.3) }}>
                                        <Link href={item.href} prefetch={false} onClick={() => setIsMenuOpen(false)} className="flex flex-col items-center gap-2 group">
                                            <div 
                                                className={cn(
                                                    "w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-300 shadow-soft", 
                                                    pathname === item.href 
                                                        ? "bg-accent-gold text-text-primary border-transparent shadow-glow scale-105" 
                                                        : "bg-bg-primary text-text-muted hover:text-text-primary hover:scale-105 border-border"
                                                )}
                                                style={{ borderColor: pathname === item.href ? undefined : `${item.color}40` }}
                                            >
                                                <item.icon className="w-6 h-6" style={{ color: pathname === item.href ? undefined : item.color }} />
                                            </div>
                                            <span className="text-nano font-black uppercase tracking-wider text-text-muted text-center line-clamp-1 group-hover:text-text-primary transition-colors">
                                                {/* Pas de repli ici : GRID_ITEMS ne porte pas de libellé
                                                    affichable (seulement `key`). Les clés correspondantes
                                                    sont toutes présentes dans les locales. */}
                                                {t(`nav.${item.key}`)}
                                            </span>
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>

                            <div className="mt-12 pt-10 border-t border-border/50 flex justify-between">
                                <button onClick={() => { setIsNotificationsOpen(true); setIsMenuOpen(false); }} className="flex-1 flex flex-col items-center gap-2">
                                    <div className="w-12 h-12 rounded-full bg-bg-tertiary flex items-center justify-center relative">
                                        <Bell className="w-5 h-5" />
                                        {unreadCount > 0 && <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-status-danger rounded-full border-2 border-white" />}
                                    </div>
                                    <span className="text-nano font-black uppercase tracking-widest text-text-muted">Alertes</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        setViewMode('EXPANDED');
                                        startVoiceListening();
                                    }}
                                    className="flex-1 flex flex-col items-center gap-2"
                                >
                                    <div className="w-12 h-12 rounded-full bg-accent-gold/10 flex items-center justify-center">
                                        <Mic className="w-5 h-5 text-accent-gold" />
                                    </div>
                                    <span className="text-nano font-black uppercase tracking-widest text-text-muted">Vocal</span>
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            <NotificationPanel isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
        </>
    );
}
