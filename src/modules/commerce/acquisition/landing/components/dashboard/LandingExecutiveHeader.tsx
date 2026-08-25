'use client';

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";
import Link from "next/link";
import { Plus, Calendar, Package, BarChart3 } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { useLanguage } from "@/shared/hooks";
import { SettingsGearButton } from "@/shared/components/settings/ContextualSettings";

interface LandingExecutiveHeaderProps {
  userName: string;
  isMobile: boolean;
}

export function LandingExecutiveHeader({ userName, isMobile }: LandingExecutiveHeaderProps) {
  const { t } = useLanguage();

  const quickActions = [
    { label: t('dashboard.actions.new_order'), icon: Plus, href: "/pos", primary: true },
    { label: t('dashboard.actions.reservation'), icon: Calendar, href: "/reservations" },
    { label: t('dashboard.actions.inventory'), icon: Package, href: "/inventory" },
    { label: t('dashboard.actions.analytics'), icon: BarChart3, href: "/analytics" },
  ];

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-4 md:pt-12 flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div className="space-y-2 md:space-y-6">
          <div className="flex items-center gap-3 text-accent-gold text-[8px] md:text-[10px] font-black uppercase tracking-[0.3em]">
            <div className="w-6 md:w-12 h-[1px] bg-accent-gold/30" />
            {format(new Date(), "EEEE d MMMM", { locale: fr })} • {new Date().getHours() < 16 ? "MIDI" : "SOIR"}
          </div>

          <h2 className="text-4xl md:text-7xl font-serif font-light text-text-primary tracking-tight leading-[1.1]">
            {t('dashboard.hello')}, <br />
            <span className="italic">{userName}</span>
          </h2>
        </div>

        {!isMobile && (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-1">{t('dashboard.status')}</p>
              <p className="text-[13px] font-serif italic text-accent">{t('dashboard.status_text')}</p>
            </div>
            <SettingsGearButton pageKey="dashboard" className="h-10 w-10 shrink-0" />
          </div>
        )}
      </motion.div>

      {/* Quick Actions Scroll */}
      <div className="flex gap-4 overflow-x-auto py-2 -mx-4 px-4 scrollbar-hide md:mx-0 md:px-0 md:flex-wrap">
        {quickActions.map((action, i) => (
          <Link key={i} href={action.href}>
            <motion.div
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-3 cursor-pointer group shrink-0"
            >
              <div className={cn(
                "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all",
                action.primary ? "bg-accent-gold text-text-primary shadow-lg shadow-accent-gold/20" : "bg-bg-secondary border border-border"
              )}>
                <action.icon strokeWidth={1.5} className="w-5 h-5" />
              </div>
              <span className="text-[9px] md:text-chip-label text-text-secondary">
                {action.label}
              </span>
            </motion.div>
          </Link>
        ))}
      </div>
    </>
  );
}
