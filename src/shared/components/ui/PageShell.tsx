"use client";

import React, { type ReactNode } from "react";
import { cn } from "@/lib/ui.foundations";
import type { LucideIcon } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export type PageShellAlert = "rush" | "critical" | "warning" | "info" | null | undefined;

export interface PageShellProps {
  /** Big editorial title. */
  title: string;
  /**
   * Small serif-italic uppercase kicker printed just before the title
   * (e.g. "Salle", "Cuisine", "Finance", "Table"). If omitted, the label
   * of the antepenultimate breadcrumb is used; otherwise, no kicker.
   */
  kicker?: string;
  /** Optional descriptive line rendered beneath the title. */
  subtitle?: string;
  icon?: LucideIcon;
  emoji?: string;
  /** Optional inline node next to the title (badge, live indicator…). */
  badge?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  /** Right-cluster actions. Group children in `<PageShell.Group>` for consistency. */
  actions?: ReactNode;
  /** Nav row rendered under the title (segmented underline recommended). */
  tabs?: ReactNode;
  children: ReactNode;
  /**
   * `default` fills the shell with breathing padding.
   * `compact` tightens vertical rhythm — for POS/KDS ops screens.
   * `flush` removes main-area padding — for interactive canvases (floor plan…).
   * `hero` amplifies the title — for landings inside admin.
   */
  variant?: "default" | "compact" | "flush" | "hero";
  /**
   * Semantic state ribbon anchored to the very top of the shell.
   * Draws a 2px gradient strip whose color signals the alert.
   */
  alert?: PageShellAlert;
  /** Optional pulse indicator + label displayed next to the title. */
  status?: { label: string; tone?: "rush" | "success" | "warning" | "critical" };
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
}

const ALERT_COLOR: Record<Exclude<PageShellAlert, null | undefined>, string> = {
  rush: "bg-gradient-to-r from-red-500/0 via-red-500 to-red-500/0",
  critical: "bg-gradient-to-r from-red-600/0 via-red-600 to-red-600/0",
  warning: "bg-gradient-to-r from-amber-500/0 via-amber-500 to-amber-500/0",
  info: "bg-gradient-to-r from-accent-gold/0 via-accent-gold to-accent-gold/0",
};

const STATUS_DOT: Record<NonNullable<NonNullable<PageShellProps["status"]>["tone"]>, string> = {
  rush: "bg-red-500",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  critical: "bg-red-600",
};

const STATUS_TEXT: Record<NonNullable<NonNullable<PageShellProps["status"]>["tone"]>, string> = {
  rush: "text-red-500/90",
  success: "text-emerald-500/90",
  warning: "text-amber-500/90",
  critical: "text-red-600",
};

export function PageShell({
  title,
  kicker,
  subtitle,
  icon: Icon,
  emoji,
  badge,
  breadcrumbs,
  actions,
  tabs,
  children,
  variant = "default",
  alert,
  status,
  className,
  contentClassName,
  headerClassName,
}: PageShellProps) {
  const isHero = variant === "hero";
  const isCompact = variant === "compact";
  const isFlush = variant === "flush";

  // Derive kicker from breadcrumbs if none supplied.
  const derivedKicker =
    kicker ??
    (breadcrumbs && breadcrumbs.length >= 2 ? breadcrumbs[breadcrumbs.length - 2].label : undefined);

  const statusTone = status?.tone ?? "rush";

  return (
    <div className={cn("min-h-full flex flex-col bg-surface-bg text-text-primary", className)}>
      {/* Alert ribbon */}
      {alert && (
        <div aria-hidden="true" className={cn("h-[2px] w-full shrink-0", ALERT_COLOR[alert])} />
      )}

      <header
        role="banner"
        className={cn(
          "sticky top-0 z-30 bg-surface-card/60 backdrop-blur-xl border-b border-border/40",
          isCompact ? "px-4 lg:px-6 pt-4 pb-3" : isHero ? "px-6 lg:px-10 pt-8 pb-6" : "px-6 lg:px-10 pt-6 pb-5",
          headerClassName
        )}
      >
        {/* Breadcrumbs — sans-serif, subtle */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Fil d'Ariane" className="flex items-center gap-2 mb-3 text-xs text-text-muted select-none">
            {breadcrumbs.map((item, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <span aria-hidden="true" className="text-text-muted/40">·</span>}
                {item.href ? (
                  <a
                    href={item.href}
                    className="hover:text-text-primary transition-colors tracking-tight"
                  >
                    {item.label}
                  </a>
                ) : (
                  <span className="text-text-secondary font-medium tracking-tight">
                    {item.label}
                  </span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        {/* Title row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-baseline gap-3 md:gap-4 min-w-0 flex-wrap">
            {/* Discrete icon lockup (no more colored bubble box) */}
            {(Icon || emoji) && (
              <span
                aria-hidden="true"
                className={cn(
                  "shrink-0 flex items-center justify-center text-accent-gold/80 self-center -mb-1",
                  isCompact ? "w-6 h-6" : "w-7 h-7"
                )}
              >
                {emoji ? (
                  <span className={isCompact ? "text-lg" : "text-xl"}>{emoji}</span>
                ) : Icon ? (
                  <Icon className={isCompact ? "w-[18px] h-[18px]" : "w-[20px] h-[20px]"} strokeWidth={1.8} />
                ) : null}
              </span>
            )}

            {/* Editorial kicker + title */}
            {derivedKicker && (
              <span className="font-serif font-black italic text-[11px] uppercase tracking-[0.32em] text-text-muted/70 shrink-0">
                {derivedKicker}
              </span>
            )}

            <h1
              className={cn(
                "font-serif font-black text-text-primary tracking-[-0.02em] leading-[0.95] truncate",
                isHero ? "text-4xl lg:text-5xl" : isCompact ? "text-2xl" : "text-3xl lg:text-[34px]"
              )}
            >
              {title}
            </h1>

            {status && (
              <span className="flex items-center gap-2 self-center pl-1 shrink-0">
                <span className="relative flex w-2 h-2">
                  <span
                    className={cn(
                      "absolute inset-0 rounded-full animate-ping",
                      STATUS_DOT[statusTone],
                      "opacity-60"
                    )}
                  />
                  <span className={cn("relative rounded-full w-2 h-2", STATUS_DOT[statusTone])} />
                </span>
                <span
                  className={cn(
                    "font-serif italic text-[11px] tracking-[0.24em] uppercase",
                    STATUS_TEXT[statusTone]
                  )}
                >
                  {status.label}
                </span>
              </span>
            )}

            {badge && <span className="shrink-0 self-center">{badge}</span>}
          </div>

          {actions && (
            <div className="flex items-center gap-3 flex-wrap shrink-0">
              {actions}
            </div>
          )}
        </div>

        {subtitle && (
          <p className={cn("text-sm text-text-secondary mt-3 max-w-3xl leading-relaxed", isCompact && "text-xs mt-2")}>
            {subtitle}
          </p>
        )}

        {tabs && (
          <nav aria-label="Sections" className="mt-5 flex gap-6 overflow-x-auto no-scrollbar -mb-[9px] pb-[7px]">
            {tabs}
          </nav>
        )}
      </header>

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

/* ─── Sub-components — building blocks for consistent action rows and tabs ────────────── */

/**
 * Groups related action buttons in a single bg-white/[0.03] rail with
 * vertical dividers between them. Use in `actions={…}` slot.
 */
export function PageShellActionGroup({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center h-10 bg-white/[0.03] border border-border/40 rounded-xl overflow-hidden",
        "[&>*:not(:first-child)]:border-l [&>*]:border-border/40",
        className
      )}
    >
      {children}
    </div>
  );
}

/** Solitary action pill (Send, Homologate, Reserve…). Gold by default. */
export function PageShellActionCTA({
  children,
  onClick,
  disabled,
  tone = "primary",
  className,
  type,
  ariaLabel,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tone?: "primary" | "danger" | "ghost";
  className?: string;
  type?: "button" | "submit";
  ariaLabel?: string;
}) {
  return (
    <button
      type={type ?? "button"}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        "h-10 px-5 rounded-xl text-sm font-medium tracking-tight transition-colors flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed",
        tone === "primary" &&
          "bg-accent-gold hover:bg-accent-gold/90 text-[#0B0B0C] shadow-[0_4px_20px_-6px_rgba(197,160,89,0.4)]",
        tone === "danger" &&
          "bg-red-500 hover:bg-red-600 text-white shadow-[0_4px_20px_-6px_rgba(239,68,68,0.5)]",
        tone === "ghost" &&
          "bg-white/[0.03] border border-border/40 hover:border-accent-gold/50 text-text-muted hover:text-accent-gold",
        className
      )}
    >
      {children}
    </button>
  );
}

/** Underline-active tab item. Sits inside `tabs={…}` slot. */
export function PageShellTab({
  active,
  onClick,
  icon: Icon,
  children,
  ariaLabel,
}: {
  active: boolean;
  onClick: () => void;
  icon?: LucideIcon;
  children: ReactNode;
  ariaLabel?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      aria-label={ariaLabel}
      className={cn(
        "group relative shrink-0 flex items-center gap-2 pb-2 text-xs font-medium tracking-wide transition-colors whitespace-nowrap",
        active ? "text-accent-gold" : "text-text-muted hover:text-text-primary"
      )}
    >
      {Icon && <Icon className="w-[15px] h-[15px]" strokeWidth={1.8} />}
      <span>{children}</span>
      {active && (
        <span aria-hidden="true" className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-accent-gold rounded-full" />
      )}
    </button>
  );
}

/** Compact tabular fraction, editorial. Use inline in actions or content. */
export function PageShellFraction({
  numerator,
  denominator,
  unit,
  label,
}: {
  numerator: number | string;
  denominator?: number | string;
  unit?: string;
  label?: string;
}) {
  return (
    <span className="inline-flex items-baseline gap-1.5 text-text-primary">
      <span className="font-serif font-black text-xl leading-none tabular-nums text-accent-gold">{numerator}</span>
      {denominator !== undefined && (
        <>
          <span className="text-text-muted/60 tabular-nums text-sm">/</span>
          <span className="font-serif font-medium text-sm text-text-muted tabular-nums">{denominator}</span>
        </>
      )}
      {unit && <span className="text-text-muted/70 uppercase tracking-wider text-[10px] ml-0.5">{unit}</span>}
      {label && <span className="font-serif italic text-[11px] uppercase tracking-[0.24em] text-text-muted/70 ml-2">{label}</span>}
    </span>
  );
}

/* Named-space attachments so consumers can write `<PageShell.Group>` etc. */
PageShell.Group = PageShellActionGroup;
PageShell.CTA = PageShellActionCTA;
PageShell.Tab = PageShellTab;
PageShell.Fraction = PageShellFraction;
