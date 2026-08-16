'use client';

import { motion } from "framer-motion";
import { cn } from "@/lib/ui.foundations";
import { kpiCardVariants } from "@/shared/utils/motion";

interface KpiCardProps {
  title: string;
  value: string | number;
  trend: 'up' | 'down';
  trendValue: string;
  icon: import('lucide-react').LucideIcon;
  delay?: number;
  tutorialId?: string;
  isMobile?: boolean;
}

export const LandingKpiCard = ({
  title,
  value,
  trend,
  trendValue,
  icon: Icon,
  delay: _delay = 0,
  tutorialId,
  isMobile,
}: KpiCardProps) => (
  <motion.div
    variants={kpiCardVariants}
    data-tutorial={tutorialId}
    whileHover={!isMobile ? {
      y: -4,
      transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
    } : {}}
    className={cn(
      "group cursor-pointer card-premium",
      isMobile ? "p-4 min-h-[110px]" : "p-6 md:p-8 min-h-[140px]"
    )}
  >
    <div className="flex flex-col gap-3 md:gap-4 h-full justify-between">
      <div className="flex items-center justify-between">
        <p className="text-[8px] md:text-[10px] font-black text-accent-gold uppercase tracking-[0.25em]">{title}</p>
        <div className="p-1.5 rounded-full bg-bg-tertiary/50 text-accent group-hover:bg-accent group-hover:text-text-primary transition-colors">
          <Icon strokeWidth={1} className="w-3.5 h-3.5 md:w-4 md:h-4" />
        </div>
      </div>

      <div>
        <div className="flex items-baseline gap-2 md:gap-3">
          <h3 className={cn(
            "font-sans font-light text-text-primary tracking-tight",
            isMobile ? "text-2xl" : "text-4xl"
          )}>
            {value}
          </h3>
          <div className={cn(
            "text-[8px] md:text-[10px] font-bold px-1.5 py-0.5 rounded-full",
            trend === "up" ? "bg-success-soft text-success" : "bg-error-soft text-error"
          )}>
            {trend === "up" ? "↑" : "↓"}
          </div>
        </div>
        <p className="text-[8px] md:text-[10px] text-text-muted font-medium italic mt-1 md:mt-2 truncate">
          {trendValue}
        </p>
      </div>
    </div>
  </motion.div>
);
