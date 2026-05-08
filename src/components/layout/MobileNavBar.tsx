"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/ui.foundations";;
import { useLanguage } from "@/hooks";
import { useUI } from "@/hooks";
import { useNotifications } from "@/context/NotificationsContext";
import { NotificationPanel } from "@ui/NotificationPanel";
import {
    LayoutDashboard,
    Store,
    Map,
    ChefHat,
    MoreHorizontal,
    X,
    CalendarDays,
    Package,
    Users,
    BarChart3,
    Settings,
    Sparkles,
    Bell,
    Zap,
    Mic
} from "lucide-react";
import { mobileSpring } from "@/lib/motion";

const PRIMARY_NAV = [
    { label: "dashboard", href: "/", icon: LayoutDashboard },
    { label: "pos", href: "/pos", icon: Store },
    { label: "floor_plan", href: "/floor-plan", icon: Map },
    { label: "intelligence", href: "/intelligence", icon: Zap },
];

const GRID_ITEMS = [
    { label: "reservations", href: "/reservations", icon: CalendarDays },
    { label: "inventory", href: "/inventory", icon: Package },
    { label: "hr", href: "/staff", icon: Users },
    { label: "planning", href: "/planning", icon: CalendarDays },
    { label: "haccp", href: "/haccp", icon: Sparkles },
    { label: "settings", href: "/settings", icon: Settings },
];

export function MobileNavBar() {
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
    const { t } = useLanguage();
    const { toggleTheme, openCommandPalette } = useUI();
    const { unreadCount } = useNotifications();

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
                                <Link key={item.href} href={item.href} className="relative">
                                    <motion.div
                                        whileTap={{ scale: 0.9 }}
                                        className={cn(
                                            "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300",
                                            isActive ? "bg-text-primary text-white dark:bg-accent-gold dark:text-bg-primary shadow-lg" : "text-text-muted"
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
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMenuOpen(false)}
                            className="fixed inset-0 bg-surface-sidebar/60 backdrop-blur-xl z-[70]"
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={mobileSpring}
                            className="fixed bottom-0 left-0 right-0 z-[80] bg-surface-card dark:bg-bg-secondary rounded-t-[3.5rem] p-10 pb-[calc(2rem+env(safe-area-inset-bottom))]"
                        >
                            <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-10" />
                            <div className="flex justify-between items-center mb-10">
                                <h3 className="text-3xl font-serif font-black italic tracking-tight">Système OS<span className="text-accent-gold">.</span></h3>
                                <button onClick={() => setIsMenuOpen(false)} className="w-10 h-10 rounded-full bg-bg-tertiary flex items-center justify-center">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="grid grid-cols-3 gap-8">
                                {GRID_ITEMS.map((item, idx) => (
                                    <motion.div key={item.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                                        <Link href={item.href} onClick={() => setIsMenuOpen(false)} className="flex flex-col items-center gap-3">
                                            <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center border border-border shadow-soft", pathname === item.href ? "bg-accent-gold text-white border-transparent" : "bg-bg-primary")}>
                                                <item.icon className="w-6 h-6" />
                                            </div>
                                            <span className="text-[8px] font-black uppercase tracking-widest text-text-muted text-center">{t(`common.navigation.${item.label}`)}</span>
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
                                    <span className="text-[8px] font-black uppercase tracking-widest text-text-muted">Alertes</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setIsMenuOpen(false);
                                        window.dispatchEvent(new KeyboardEvent('keydown', { altKey: true, key: 'v' }));
                                    }}
                                    className="flex-1 flex flex-col items-center gap-2"
                                >
                                    <div className="w-12 h-12 rounded-full bg-accent-gold/10 flex items-center justify-center">
                                        <Mic className="w-5 h-5 text-accent-gold" />
                                    </div>
                                    <span className="text-[8px] font-black uppercase tracking-widest text-text-muted">Vocal</span>
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
