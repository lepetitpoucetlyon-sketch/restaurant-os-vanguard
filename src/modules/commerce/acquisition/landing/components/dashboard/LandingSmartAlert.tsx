'use client';

import { motion } from "framer-motion";
import { cn } from "@/lib/ui.foundations";

interface SmartAlertProps {
  type: string;
  title: string;
  message: string;
  action?: string;
  time: string;
  onAction?: () => void;
  index: number;
  isMobile?: boolean;
}

export const LandingSmartAlert = ({
  type,
  title,
  message,
  action,
  time,
  onAction,
  index,
  isMobile,
}: SmartAlertProps) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
    className={cn(
      "border-b border-border/50 group cursor-pointer",
      isMobile ? "py-4" : "py-6"
    )}
  >
    <div className="flex gap-4 md:gap-6 items-start">
      <div className={cn(
        "w-1.5 h-1.5 rounded-full mt-2 shrink-0",
        type === "critical" || type === "error" ? "bg-error" : type === "warning" ? "bg-warning" : "bg-success"
      )} />
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-1 md:mb-2">
          <h4 className="text-[14px] md:text-[15px] font-serif font-semibold text-text-primary truncate">{title}</h4>
          <span className="text-nano font-black text-text-muted uppercase tracking-widest shrink-0 ml-4">{time}</span>
        </div>
        <p className="text-[12px] md:text-[13px] text-text-secondary leading-relaxed mb-3 font-sans font-light">
          {message}
        </p>
        {action && (
          <button
            onClick={(e) => { e.stopPropagation(); onAction?.(); }}
            className="text-nano font-black uppercase tracking-[0.2em] text-accent-gold flex items-center gap-2"
          >
            {action}
            <div className="w-6 h-[1px] bg-accent-gold/30 group-hover:w-10 group-hover:bg-accent transition-all duration-300" />
          </button>
        )}
      </div>
    </div>
  </motion.div>
);
