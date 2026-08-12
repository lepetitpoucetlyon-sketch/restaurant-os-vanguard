
"use client";

import { useState } from "react";
import { Bell, Settings, Sparkles } from "lucide-react";
import { useUI } from "@/shared/hooks";
import { useNotifications } from "@/shared/hooks";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/shared/hooks";
import { CommandModal } from "@ui/CommandModal";
import { NotificationPanel } from "@ui/NotificationPanel";
import { useContextualSettings } from "@design/settings/ContextualSettings";
import { usePathname } from "next/navigation";
;
import { LANGUAGES } from "@/config/languages";
import { useAuth } from "@/shared/hooks";


interface LaunchpadStatusHubProps {
    isScrolled?: boolean;
    onClose?: () => void;
}

export function LaunchpadStatusHub({ isScrolled: _isScrolled = false, onClose }: LaunchpadStatusHubProps) {
    const { toggleTheme: _toggleTheme } = useUI();
    const { hasAccess } = useAuth();
    const { unreadCount } = useNotifications();
    const { language, setLanguage } = useLanguage();
    const [isCommandOpen, setIsCommandOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);



    const { openSettings } = useContextualSettings();
    const _pathname = usePathname();

    // Determine current page key for settings (simplified logic matching Header)
    // Note: In Launchpad, we might want to open Global Settings or Dashboard settings
    // For now, we'll default to 'dashboard' if pathname is root, or try to respect underlying page
    const _getPageKeyFromPath = (path: string | null) => {
        const segment = (path || "").split('/').filter(Boolean)[0] || 'dashboard';
        return segment; // Simplified
    };

    // Default to handling settings click safely
    const _handleSettingsClick = () => {
        // Just open settings modal if possible, or navigate
        // Given the context, we might trigger the contextual settings of the dashboard
        // But for safety in Launchpad, let's assuming mostly visual
    };

    return (
        <>
            {/* Desktop View: Dynamic Landing vs Scrolled State */}
            <motion.div
                initial={false}
                animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                transition={{ duration: 0 }}
                className="flex flex-col items-center justify-end relative z-50 my-8 md:my-16 origin-top"
            >
                <div className="bg-surface-card/40 dark:bg-surface-card/5 backdrop-blur-[40px] rounded-full border border-default dark:border-white/5 shadow-2xl p-2 md:p-3 flex items-center gap-3 md:gap-6 scale-90 md:scale-100 origin-center ring-1 ring-black/5 dark:ring-white/5">
                    {/* Language */}
                    <div className="relative">
                        <button
                            onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                            className="w-12 h-12 flex items-center justify-center text-xl rounded-full transition-all duration-300 group border border-accent-gold/30 hover:bg-surface-card/5 hover:scale-105 overflow-hidden"
                        >
                            <span className="scale-110 grayscale group-hover:grayscale-0 transition-all duration-300">{LANGUAGES.find(l => l.code === language)?.flag || '🇫🇷'}</span>
                        </button>

                        <AnimatePresence>
                            {isLangMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute top-full mt-4 left-1/2 -translate-x-1/2 min-w-[160px] bg-surface-card/90 dark:bg-surface-sidebar/90 backdrop-blur-xl rounded-2xl shadow-premium border border-default dark:border-subtle overflow-hidden z-[60]"
                                >
                                    {LANGUAGES.map((lang) => (
                                        <button
                                            key={lang.code}
                                            onClick={() => {
                                                setLanguage(lang.code);
                                                setIsLangMenuOpen(false);
                                            }}
                                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-bg/50 dark:hover:bg-surface-card/5 transition-colors text-left"
                                        >
                                            <span className="text-xl">{lang.flag}</span>
                                            <span className="text-xs font-bold uppercase tracking-wider text-text-primary">{lang.nativeName}</span>
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>


                    {/* Notifications */}
                    <button
                        onClick={() => {
                            onClose?.();
                            setTimeout(() => setIsNotificationsOpen(true), 100);
                        }}
                        className="w-12 h-12 flex items-center justify-center text-accent-gold rounded-full transition-all duration-300 relative group border border-accent-gold/30 hover:bg-surface-card/5 hover:scale-105"
                    >
                        <Bell strokeWidth={1.5} className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                        {unreadCount > 0 && (
                            <div className="absolute top-2 right-1.5 px-1.5 py-0.5 min-w-[22px] bg-status-danger text-text-primary flex items-center justify-center text-[10px] font-bold rounded-full border-2 border-white dark:border-black shadow-sm z-20">
                                <span className="leading-none">{unreadCount > 99 ? '99+' : unreadCount}</span>
                            </div>
                        )}
                    </button>

                    {/* AI / Command */}
                    <button
                        onClick={() => {
                            onClose?.();
                            setTimeout(() => setIsCommandOpen(true), 100);
                        }}
                        className="w-12 h-12 flex items-center justify-center text-accent-gold rounded-full transition-all duration-300 group border border-accent-gold/30 hover:bg-surface-card/5 hover:scale-105"
                    >
                        <Sparkles strokeWidth={1.5} className="w-6 h-6 group-hover:scale-110 group-hover:rotate-12 transition-all" />
                    </button>

                    {/* Settings */}
                    {hasAccess('settings') && (
                        <button
                            onClick={() => {
                                onClose?.();
                                setTimeout(() => openSettings('dashboard'), 100);
                            }}
                            className="w-12 h-12 flex items-center justify-center text-accent-gold rounded-full transition-all duration-300 group border border-accent-gold/30 hover:bg-surface-card/5 hover:scale-105"
                        >
                            <Settings strokeWidth={1.5} className="w-6 h-6 group-hover:rotate-90 transition-transform" />
                        </button>
                    )}
                </div>
            </motion.div>



            <CommandModal isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
            <NotificationPanel isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
        </>
    );
}
