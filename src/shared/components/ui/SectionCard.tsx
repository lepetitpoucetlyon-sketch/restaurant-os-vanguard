"use client";

import React, { type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/ui.foundations";
import { LucideIcon } from "lucide-react";

export type SectionCardVariant = "default" | "glass" | "premium" | "ghost";

export interface SectionCardProps {
  title?: string;
  subtitle?: string;
  icon?: LucideIcon;
  emoji?: string;
  badge?: ReactNode;
  headerActions?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  variant?: SectionCardVariant;
  className?: string;
  bodyClassName?: string;
  noPadding?: boolean;
}

const variantStyles: Record<SectionCardVariant, string> = {
  default:
    "bg-surface-card border border-border-default shadow-sm hover:border-border-focus/30",
  glass:
    "bg-surface-card/60 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.2)]",
  premium:
    "bg-gradient-to-b from-surface-card to-surface-card/90 border border-action-primary/20 shadow-premium",
  ghost:
    "bg-transparent border border-border-subtle",
};

export function SectionCard({
  title,
  subtitle,
  icon: Icon,
  emoji,
  badge,
  headerActions,
  footer,
  children,
  variant = "default",
  className,
  bodyClassName,
  noPadding = false,
}: SectionCardProps) {
  const hasHeader = Boolean(title || subtitle || Icon || emoji || badge || headerActions);

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "rounded-2xl transition-all duration-200 overflow-hidden flex flex-col",
        variantStyles[variant],
        className
      )}
    >
      {/* Header */}
      {hasHeader && (
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border-subtle">
          <div className="flex items-center gap-3 min-w-0">
            {(Icon || emoji) && (
              <div className="w-8 h-8 rounded-xl bg-action-primary/10 border border-action-primary/20 text-action-primary flex items-center justify-center shrink-0">
                {emoji ? (
                  <span className="text-base">{emoji}</span>
                ) : Icon ? (
                  <Icon className="w-4 h-4" />
                ) : null}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {title && (
                  <h2 className="font-serif text-base font-bold text-text-primary tracking-tight truncate">
                    {title}
                  </h2>
                )}
                {badge && <div className="shrink-0">{badge}</div>}
              </div>
              {subtitle && (
                <p className="text-micro text-text-secondary truncate mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {headerActions && (
            <div className="flex items-center gap-2 shrink-0">{headerActions}</div>
          )}
        </div>
      )}

      {/* Body */}
      <div className={cn("flex-1", !noPadding && "p-6", bodyClassName)}>
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div className="px-6 py-3.5 bg-surface-bg/50 border-t border-border-subtle flex items-center justify-between text-xs text-text-secondary">
          {footer}
        </div>
      )}
    </motion.section>
  );
}
