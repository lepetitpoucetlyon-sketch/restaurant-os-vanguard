"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/ui.foundations";
import { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export interface EmptyStateProps {
  icon?: LucideIcon;
  emoji?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  variant?: "default" | "compact" | "large" | "full";
  className?: string;
}

export function EmptyState({
  icon: Icon,
  emoji,
  title,
  description,
  action,
  variant = "default",
  className,
}: EmptyStateProps) {
  const variantClasses = {
    compact: {
      container: "py-8 px-4",
      iconContainer: "w-10 h-10 rounded-xl mb-3",
      iconSize: "w-5 h-5",
      title: "text-xs",
      description: "text-[11px]",
    },
    default: {
      container: "py-14 px-6",
      iconContainer: "w-14 h-14 rounded-2xl mb-4",
      iconSize: "w-7 h-7",
      title: "text-sm",
      description: "text-xs",
    },
    large: {
      container: "py-20 px-8",
      iconContainer: "w-20 h-20 rounded-3xl mb-6",
      iconSize: "w-10 h-10",
      title: "text-base",
      description: "text-sm",
    },
    full: {
      container: "py-28 px-10 min-h-[400px]",
      iconContainer: "w-24 h-24 rounded-3xl mb-8",
      iconSize: "w-12 h-12",
      title: "text-lg",
      description: "text-base",
    },
  };

  const styles = variantClasses[variant];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-border-default/60 bg-surface-card/20",
        styles.container,
        className
      )}
    >
      <div
        className={cn(
          "bg-action-primary/10 border border-action-primary/20 flex items-center justify-center text-action-primary shadow-sm",
          styles.iconContainer
        )}
      >
        {emoji ? (
          <span className={cn("text-2xl", (variant === "large" || variant === "full") && "text-4xl")}>
            {emoji}
          </span>
        ) : Icon ? (
          <Icon strokeWidth={1.5} className={styles.iconSize} />
        ) : null}
      </div>

      <h3
        className={cn(
          "font-serif font-bold text-text-primary tracking-tight",
          styles.title
        )}
      >
        {title}
      </h3>

      {description && (
        <p className={cn("text-text-secondary mt-1.5 max-w-md leading-relaxed", styles.description)}>
          {description}
        </p>
      )}

      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
}
