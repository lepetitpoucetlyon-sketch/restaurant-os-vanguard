"use client";

import React, { type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/ui.foundations";
import { LucideIcon } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageShellProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  emoji?: string;
  badge?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
  tabs?: ReactNode;
  children: ReactNode;
  variant?: "default" | "compact" | "flush" | "hero";
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
}

export function PageShell({
  title,
  subtitle,
  icon: Icon,
  emoji,
  badge,
  breadcrumbs,
  actions,
  tabs,
  children,
  variant = "default",
  className,
  contentClassName,
  headerClassName,
}: PageShellProps) {
  const isHero = variant === "hero";
  const isCompact = variant === "compact";
  const isFlush = variant === "flush";

  return (
    <div className={cn("min-h-full flex flex-col bg-surface-bg text-text-primary", className)}>
      {/* Header Container */}
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "bg-surface-card/70 backdrop-blur-xl border-b border-border-default transition-all",
          isHero ? "py-8 px-6 lg:px-10" : isCompact ? "py-3 px-4 lg:px-6" : "py-5 px-6 lg:px-8",
          headerClassName
        )}
      >
        {/* Fil d'Ariane (Breadcrumb) */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 mb-3 text-[11px] font-mono text-text-muted select-none">
            {breadcrumbs.map((item, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span className="text-text-muted/40">/</span>}
                {item.href ? (
                  <a
                    href={item.href}
                    className="hover:text-action-primary transition-colors tracking-wide"
                  >
                    {item.label}
                  </a>
                ) : (
                  <span className="text-text-primary font-medium tracking-wide">
                    {item.label}
                  </span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        {/* Ligne Principale : Titre, Icône, Badges & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            {/* Icône ou Émoji */}
            {(Icon || emoji) && (
              <div
                className={cn(
                  "flex items-center justify-center rounded-2xl bg-action-primary/10 border border-action-primary/20 text-action-primary shrink-0 shadow-sm",
                  isCompact ? "w-10 h-10 rounded-xl" : "w-12 h-12"
                )}
              >
                {emoji ? (
                  <span className="text-xl">{emoji}</span>
                ) : Icon ? (
                  <Icon className={isCompact ? "w-5 h-5" : "w-6 h-6"} />
                ) : null}
              </div>
            )}

            {/* Titre & Sous-titre */}
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1
                  className={cn(
                    "font-serif font-bold text-text-primary tracking-tight truncate",
                    isHero ? "text-3xl lg:text-4xl" : isCompact ? "text-xl" : "text-2xl"
                  )}
                >
                  {title}
                </h1>
                {badge && <div className="shrink-0">{badge}</div>}
              </div>
              {subtitle && (
                <p className="text-xs text-text-secondary mt-0.5 max-w-2xl truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Actions de droite (Toolbar / Boutons RBAC) */}
          {actions && (
            <div className="flex items-center gap-2.5 flex-wrap shrink-0">
              {actions}
            </div>
          )}
        </div>

        {/* Onglets (Tabs) intégrés avec TabGuard */}
        {tabs && (
          <div className="mt-5 -mb-5 border-t border-border-subtle pt-2 overflow-x-auto no-scrollbar">
            {tabs}
          </div>
        )}
      </motion.header>

      {/* Main Content Area */}
      <main
        className={cn(
          "flex-1 flex flex-col",
          isFlush ? "p-0" : isCompact ? "p-4" : "p-6 lg:p-8 max-w-[1600px] w-full mx-auto",
          contentClassName
        )}
      >
        {children}
      </main>
    </div>
  );
}
