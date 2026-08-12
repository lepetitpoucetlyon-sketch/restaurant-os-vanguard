"use client";

import { useState } from "react";
import { motion, Variants } from "framer-motion";
import { ChevronRight, ChevronLeft, X } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { useLanguage } from "@/kernel/hooks";
import { useAtomValue } from 'jotai';
import { tenantConfigAtom } from "@nexus/state/SovereignGenome";

interface SidebarBrandingProps {
    isSidebarCollapsed: boolean;
    isMobileMenuOpen: boolean;
    toggleSidebar: () => void;
    closeMobileMenu: () => void;
    onMouseDown: () => void;
    onMouseUp: () => void;
    onMouseLeave: () => void;
}

const navItemReveal: Variants = {
    hidden: { opacity: 0, x: -10 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
    }
};

export function SidebarBranding({
    isSidebarCollapsed,
    isMobileMenuOpen,
    toggleSidebar,
    closeMobileMenu,
    onMouseDown,
    onMouseUp,
    onMouseLeave
}: SidebarBrandingProps) {
    const { t } = useLanguage();
    const config = useAtomValue(tenantConfigAtom);
    // Track load failure so a 404 doesn't cause the browser to retry on every re-render.
    const [logoFailed, setLogoFailed] = useState(false);
    const hasDynamicLogo = !!config?.theme?.logoUrl && !logoFailed;

    return (
        <div className={cn(
            "flex items-center transition-all duration-700",
            isSidebarCollapsed && !isMobileMenuOpen ? "p-4 justify-center" : "p-8 justify-between"
        )}>
            {isMobileMenuOpen && (
                <button
                    onClick={closeMobileMenu}
                    className="lg:hidden p-2 -ml-2 text-text-muted hover:text-text-primary transition-colors outline-none"
                >
                    <X className="w-5 h-5" />
                </button>
            )}
            <motion.button
                variants={navItemReveal}
                onMouseDown={onMouseDown}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseLeave}
                onTouchStart={onMouseDown}
                onTouchEnd={onMouseUp}
                onClick={toggleSidebar}
                className={cn(
                    "flex items-center gap-4 w-full group cursor-pointer text-left outline-none",
                    isSidebarCollapsed ? "justify-center p-0" : "p-0"
                )}
            >
                {isSidebarCollapsed && !isMobileMenuOpen ? (
                    <motion.div
                        initial={{ scale: 0.8, rotate: 180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        whileHover={{ scale: 1.1, x: 2 }}
                        whileTap={{ scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="w-10 h-10 rounded-xl bg-text-primary dark:bg-accent-gold/10 text-accent-gold flex items-center justify-center transition-all border border-accent-gold/20 shadow-[0_0_20px_rgba(197,160,89,0.1)]"
                    >
                        <ChevronRight strokeWidth={2} className="w-5 h-5" />
                    </motion.div>
                ) : (
                    <>
                        <motion.div
                            layoutId="sidebar-logo"
                            initial={{ rotate: 0 }}
                            animate={{ rotate: 0 }}
                            whileHover={{ scale: 1.05, x: -2 }}
                            whileTap={{ scale: 0.9 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 transition-all duration-500 relative overflow-hidden",
                                hasDynamicLogo 
                                    ? "bg-transparent border-transparent" 
                                    : "bg-text-primary dark:bg-accent-gold/10 text-accent-gold border-accent-gold/20 shadow-premium"
                            )}
                            style={!hasDynamicLogo && config?.theme?.primaryColor ? { 
                                color: config.theme.primaryColor,
                                borderColor: `${config.theme.primaryColor}33`,
                                backgroundColor: `${config.theme.primaryColor}1a`
                            } : undefined}
                        >
                            {hasDynamicLogo && config?.theme?.logoUrl ? (
                                <img
                                    src={config.theme.logoUrl}
                                    alt="Logo"
                                    className="w-full h-full object-cover"
                                    onError={() => setLogoFailed(true)}
                                />
                            ) : (
                                <>
                                    <ChevronLeft strokeWidth={2} className="w-5 h-5" />
                                    <div 
                                        className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-accent-gold border-2 border-bg-secondary shadow-glow transition-colors duration-500" 
                                        style={config?.theme?.primaryColor ? { backgroundColor: config.theme.primaryColor } : undefined}
                                    />
                                </>
                            )}
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="overflow-hidden flex-1 min-w-0"
                        >
                            <h1 className="font-serif font-black text-lg text-text-primary tracking-tight leading-none italic">
                                {t('sidebar.resto')} <span className="text-accent-gold not-italic transition-colors duration-500" style={config?.theme?.primaryColor ? { color: config.theme.primaryColor } : undefined}>{t('sidebar.os')}</span>
                            </h1>
                            <p className="text-[7px] uppercase tracking-[0.4em] text-accent-gold font-black mt-1.5 whitespace-nowrap overflow-hidden text-ellipsis leading-none opacity-60 transition-colors duration-500" style={config?.theme?.primaryColor ? { color: config.theme.primaryColor } : undefined}>
                                {t('nav.executive_intelligence')}
                            </p>
                        </motion.div>
                    </>
                )}
            </motion.button>

            {isMobileMenuOpen && (
                <button
                    onClick={closeMobileMenu}
                    className="lg:hidden p-2 text-text-muted hover:text-text-primary hover:bg-bg-tertiary rounded-lg transition-all ml-4 outline-none"
                >
                    <X strokeWidth={1.5} className="w-5 h-5" />
                </button>
            )}
        </div>
    );
}
