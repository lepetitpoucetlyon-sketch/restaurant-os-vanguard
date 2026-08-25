"use client";

import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";
import { cn } from "@/lib/ui.foundations";
import type { ReactNode } from "react";
import { withVerticalOverride } from "@/shared/hooks/useVerticalComponent";

// ── StatCard CVA ──────────────────────────────────────────────────────────────
const statCardVariants = cva(
  "bg-bg-secondary border border-border rounded-[2rem] transition-all duration-300 hover:shadow-lg group",
  {
    variants: {
      size: {
        compact: "p-4",
        default: "p-6",
        large:   "p-8",
        minimal: "p-4",
      },
    },
    defaultVariants: { size: "default" },
  }
);

const iconVariants = cva(
  "flex items-center justify-center border",
  {
    variants: {
      size: {
        compact: "w-10 h-10 rounded-xl",
        default: "w-12 h-12 rounded-2xl",
        large:   "w-14 h-14 rounded-2xl",
        minimal: "w-8 h-8 rounded-lg",
      },
    },
    defaultVariants: { size: "default" },
  }
);

const iconInnerVariants = cva(
  "flex items-center justify-center",
  {
    variants: {
      size: {
        compact: "w-4 h-4",
        default: "w-5 h-5",
        large:   "w-6 h-6",
        minimal: "w-3.5 h-3.5",
      },
    },
    defaultVariants: { size: "default" },
  }
);

const valueVariants = cva(
  "font-serif font-medium text-text-primary tracking-tight italic group-hover:text-accent transition-colors",
  {
    variants: {
      size: {
        compact: "text-2xl",
        default: "text-3xl",
        large:   "text-4xl",
        minimal: "text-xl",
      },
    },
    defaultVariants: { size: "default" },
  }
);

const labelVariants = cva(
  "font-black text-text-muted uppercase tracking-[0.2em] mt-1",
  {
    variants: {
      size: {
        compact: "text-nano",
        default: "text-nano",
        large:   "text-nano",
        minimal: "text-nano",
      },
    },
    defaultVariants: { size: "default" },
  }
);

/** Nouveau prop sémantique — `brand` utilise --action-primary (couleur tenant) */
import type { StatCardIntent } from './StatCardTypes';
export type { StatCardIntent };

/** @deprecated Utiliser `intent` à la place */
type LegacyAccentColor = "accent" | "success" | "warning" | "error" | "info";

type StatCardSize = NonNullable<VariantProps<typeof statCardVariants>["size"]>;

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  emoji?: string;
  trend?: string | {
    value: number;
    direction: "up" | "down" | "neutral";
  };
  isWarning?: boolean;
  intent?: StatCardIntent;
  /** @deprecated Utiliser `intent` à la place */
  accentColor?: LegacyAccentColor;
  variant?: StatCardSize;
  className?: string;
}

const intentColors: Record<StatCardIntent, { icon: string; bg: string; border: string; trend: string }> = {
  brand: {
    icon:   "text-[color:var(--action-primary,theme(colors.indigo.500))]",
    bg:     "bg-[color:color-mix(in_srgb,var(--action-primary,theme(colors.indigo.500))_10%,transparent)]",
    border: "border-[color:color-mix(in_srgb,var(--action-primary,theme(colors.indigo.500))_20%,transparent)]",
    trend:  "text-[color:var(--action-primary,theme(colors.indigo.500))]",
  },
  success: {
    icon:   "text-status-success",
    bg:     "bg-status-success/10",
    border: "border-emerald-500/20",
    trend:  "text-status-success",
  },
  warning: {
    icon:   "text-status-warning",
    bg:     "bg-status-warning/10",
    border: "border-action-primary/20",
    trend:  "text-status-warning",
  },
  danger: {
    icon:   "text-status-danger",
    bg:     "bg-status-danger/10",
    border: "border-rose-500/20",
    trend:  "text-status-danger",
  },
  info: {
    icon:   "text-brand",
    bg:     "bg-action-primary/10",
    border: "border-focus/20",
    trend:  "text-brand",
  },
  neutral: {
    icon:   "text-text-secondary",
    bg:     "bg-surface-tertiary/10",
    border: "border-border-default/20",
    trend:  "text-text-muted",
  },
};

const legacyToIntent: Record<LegacyAccentColor, StatCardIntent> = {
  accent:  "brand",
  success: "success",
  warning: "warning",
  error:   "danger",
  info:    "info",
};

function StatCardBase({
  label,
  value,
  icon,
  emoji,
  trend,
  isWarning,
  intent,
  accentColor,
  variant = "default",
  className,
}: StatCardProps) {
  const resolvedIntent: StatCardIntent =
    intent ?? (accentColor ? legacyToIntent[accentColor] : "brand");
  const colors = intentColors[resolvedIntent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        statCardVariants({ size: variant }),
        isWarning && "border-action-primary/20",
        className
      )}
      role="region"
      aria-label={`${label}: ${value}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn(iconVariants({ size: variant }), colors.bg, colors.border)}>
          {emoji ? (
            <span className="text-lg">{emoji}</span>
          ) : icon ? (
            <span className={cn(iconInnerVariants({ size: variant }), colors.icon)}>{icon}</span>
          ) : null}
        </div>

        {trend && typeof trend === "object" && (
          <div
            className={cn(
              "flex items-center gap-1 text-nano font-bold",
              trend.direction === "up"      && "text-status-success",
              trend.direction === "down"    && "text-status-danger",
              trend.direction === "neutral" && "text-text-muted"
            )}
          >
            {trend.direction === "up"   && "↑"}
            {trend.direction === "down" && "↓"}
            {trend.value}%
          </div>
        )}
      </div>

      <div>
        <p className={valueVariants({ size: variant })}>{value}</p>
        <p className={labelVariants({ size: variant })}>{label}</p>
        {trend && typeof trend === "string" && (
          <p className="text-nano font-medium text-text-muted mt-1 tracking-tighter uppercase">{trend}</p>
        )}
      </div>
    </motion.div>
  );
}

/**
 * StatCard — version avec override vertical automatique.
 * Si le vertical courant a un StatCard dans son IVerticalUIPlugin.components,
 * ce composant est utilisé à la place de StatCardBase (transparent, zéro régression).
 */
export const StatCard = withVerticalOverride('StatCard', StatCardBase);

interface StatsGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4 | 5 | 6;
  gap?: "sm" | "md" | "lg";
  className?: string;
}

export function StatsGrid({ children, columns = 4, gap = "md", className }: StatsGridProps) {
  const columnClasses: Record<2 | 3 | 4 | 5 | 6, string> = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
    6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
  };
  const gapClasses = { sm: "gap-3", md: "gap-6", lg: "gap-8" };

  return (
    <div className={cn("grid", columnClasses[columns], gapClasses[gap], className)}>
      {children}
    </div>
  );
}
