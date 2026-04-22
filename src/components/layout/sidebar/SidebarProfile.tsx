"use client";

import { motion, Variants } from "framer-motion";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { useLanguage } from "@/context/LanguageContext";
import { ROLE_LABELS } from "@/domain/services/AccessPolicyManager";
import { empireAudit } from "@/lib/audit";

interface SidebarProfileProps {
    currentUser: import('@/types').User | null;
    isSidebarCollapsed: boolean;
    canSwitchProfiles: boolean;
    setIsProfileSwitcherOpen: (val: boolean) => void;
    logout: () => void;
}

const navItemReveal = {
    hidden: { opacity: 0, x: -10 },
    visible: {
        opacity: 1,
        x: 0,
        transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }
    }
};

export function SidebarProfile({
    currentUser,
    isSidebarCollapsed,
    canSwitchProfiles,
    setIsProfileSwitcherOpen,
    logout
}: SidebarProfileProps) {
    const { t } = useLanguage();

    const handleLogout = () => {
        empireAudit.log({
            module: 'staff',
            action: 'USER_LOGOUT',
            details: { userId: currentUser?.id, userName: currentUser?.name },
            timestamp: new Date(),
            severity: 'low'
        });
        logout();
    };

    return (
        <motion.div
            variants={navItemReveal as any}
            className={cn(
                "p-6 border-t border-border/40 bg-bg-tertiary/20 dark:bg-black/40 backdrop-blur-md",
                isSidebarCollapsed ? "px-2" : "p-8"
            )}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-5 w-full relative group">
                    <motion.button
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => canSwitchProfiles && setIsProfileSwitcherOpen(true)}
                        className={cn(
                            "w-12 h-12 rounded-[18px] bg-bg-secondary dark:bg-bg-tertiary/50 border border-border/40 flex items-center justify-center text-accent-gold text-sm font-black shrink-0 shadow-premium relative overflow-hidden outline-none",
                            canSwitchProfiles ? "cursor-pointer" : "cursor-default opacity-90"
                        )}
                        title={canSwitchProfiles ? "Changer de profil" : "Bascule de profil désactivée"}
                    >
                        {currentUser?.avatar ? (
                            <img src={currentUser.avatar} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="avatar" />
                        ) : (
                            <span className="relative z-10 font-serif italic text-lg">{(currentUser?.name || ' ').trim().charAt(0)}</span>
                        )}
                        <div className="absolute inset-0 rounded-2xl bg-accent-gold/5 blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.button>
                    {!isSidebarCollapsed && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col overflow-hidden flex-1"
                        >
                            <span className="text-[13px] font-black text-text-primary truncate uppercase tracking-tight font-sans">{currentUser?.name}</span>
                            <span className="text-[9px] text-accent-gold/60 truncate font-black uppercase tracking-[0.3em] mt-1 group-hover:text-accent-gold transition-colors">
                                {currentUser?.role ? ROLE_LABELS[currentUser.role as keyof typeof ROLE_LABELS] : t('sidebar.admin_fallback')}
                            </span>
                        </motion.div>
                    )}
                    {!isSidebarCollapsed && (
                        <motion.button
                            whileHover={{ scale: 1.2, x: 2, color: "#EF4444" }}
                            whileTap={{ scale: 0.8 }}
                            onClick={handleLogout}
                            className="p-2 text-text-muted hover:text-error transition-all duration-500 outline-none"
                            title={t('sidebar.logout')}
                        >
                            <LogOut strokeWidth={2.5} className="w-4 h-4" />
                        </motion.button>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
