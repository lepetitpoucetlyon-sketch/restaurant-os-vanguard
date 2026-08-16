"use client";

import { motion, Variants } from "framer-motion";
import { ReceiptEuro, Sparkles, Flame, Moon } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { useLanguage } from "@/shared/hooks";
import { AmbianceService, type RestaurantAmbiance } from '@/modules/facility';
import { useState, useEffect } from "react";

interface SidebarQuickActionsProps {
    isSidebarCollapsed: boolean;
    setIsExpenseModalOpen: (val: boolean) => void;
}

const navItemReveal: Variants = {
    hidden: { opacity: 0, x: -10 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
    }
};

export function SidebarQuickActions({
    isSidebarCollapsed,
    setIsExpenseModalOpen
}: SidebarQuickActionsProps) {
    const { t } = useLanguage();
    const [currentAmbiance, setCurrentAmbiance] = useState<RestaurantAmbiance>(AmbianceService.getCurrentAmbiance());

    useEffect(() => {
        const handleAmbianceChange = (_e: Event) => {
            setCurrentAmbiance(AmbianceService.getCurrentAmbiance());
        };
        window.addEventListener('ambiance-changed', handleAmbianceChange);
        return () => window.removeEventListener('ambiance-changed', handleAmbianceChange);
    }, []);

    const ambiences: { key: RestaurantAmbiance; icon: React.ElementType; label: string; color: string }[] = [
        { key: 'SERENITY', icon: Sparkles, label: 'Serenity', color: 'text-brand' },
        { key: 'RUSH_SPEED', icon: Flame, label: 'Rush', color: 'text-status-success' },
        { key: 'ELEGANCE_NIGHT', icon: Moon, label: 'Elegance', color: 'text-status-warning' },
    ];

    return (
        <div className={cn("px-4 pb-4 border-b border-border/30 overflow-hidden", isSidebarCollapsed && "px-2")}>
            {/* Main Action: Expense Claim */}
            <motion.button
                variants={navItemReveal}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsExpenseModalOpen(true)}
                className={cn(
                    "w-full flex items-center gap-3 p-4 rounded-2xl transition-all duration-500 group outline-none mb-3",
                    "bg-accent-gold/5 hover:bg-accent-gold text-accent-gold hover:text-text-primary border border-accent-gold/20 hover:border-transparent shadow-premium",
                    isSidebarCollapsed && "justify-center"
                )}
            >
                <ReceiptEuro strokeWidth={1.5} className="w-5 h-5 shrink-0 group-hover:rotate-12 transition-transform duration-500" />
                {!isSidebarCollapsed && (
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] truncate">{t('sidebar.expense_claim')}</span>
                )}
            </motion.button>

            {/* Ambiance Switcher */}
            <div className={cn("flex gap-1", isSidebarCollapsed ? "flex-col items-center" : "flex-row")}>
                {ambiences.map((amb) => (
                    <motion.button
                        key={amb.key}
                        onClick={() => AmbianceService.setManualAmbiance(amb.key)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className={cn(
                            "flex-1 flex items-center justify-center p-2 rounded-xl border transition-all duration-300",
                            currentAmbiance === amb.key 
                                ? "bg-bg-tertiary border-border shadow-inner" 
                                : "bg-transparent border-transparent opacity-40 hover:opacity-100",
                            currentAmbiance === amb.key && amb.color
                        )}
                        title={amb.label}
                    >
                        <amb.icon className="w-4 h-4" />
                    </motion.button>
                ))}
            </div>
        </div>
    );
}
