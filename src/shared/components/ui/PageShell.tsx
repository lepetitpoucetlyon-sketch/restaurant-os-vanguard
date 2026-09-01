"use client";

import React, { type ReactNode, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
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
  rush: "bg-gradient-to-r from-red-500/0 via-red-500 to-red-500/0 motion-safe:animate-pulse",
  critical: "bg-gradient-to-r from-red-600/0 via-red-600 to-red-600/0 motion-safe:animate-pulse",
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

            {/* Editorial kicker mono */}
            {derivedKicker && (
              <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-text-muted/80 shrink-0">
                {derivedKicker}
              </span>
            )}

            <h1
              className={cn(
                "font-serif italic text-text-primary tracking-tight leading-[1.02] [text-wrap:balance] truncate",
                isHero ? "text-4xl md:text-6xl" : isCompact ? "text-2xl" : "text-3xl md:text-5xl"
              )}
            >
              {title}
            </h1>

            {status && (
              <span className="flex items-center gap-2 self-center pl-1 shrink-0">
                <span className="relative flex w-2.5 h-2.5 items-center justify-center">
                  <span
                    className={cn(
                      "absolute inset-0 rounded-full motion-safe:animate-ping",
                      STATUS_DOT[statusTone],
                      "opacity-50"
                    )}
                  />
                  <span className={cn("relative rounded-full w-2 h-2", STATUS_DOT[statusTone])} />
                </span>
                <span
                  className={cn(
                    "font-mono text-[10px] tracking-[0.20em] uppercase",
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
            <div className={cn("flex items-center gap-3 flex-wrap shrink-0", isCompact && "tabular-nums")}>
              {actions}
            </div>
          )}
        </div>

        {subtitle && (
          <p className={cn("text-sm text-text-secondary mt-3 max-w-[65ch] leading-relaxed", isCompact && "text-xs mt-2")}>
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
 * Groups related action buttons in a single bg-surface-glass rail with
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
        "flex items-center h-10 bg-surface-glass border border-border/40 rounded-xl overflow-hidden",
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
          "bg-accent-gold hover:bg-accent-gold/90 text-text-inverted shadow-[var(--shadow-glow-accent,0_4px_20px_-6px_rgba(0,0,0,0.4))]",
        tone === "danger" &&
          "bg-red-500 hover:bg-red-600 text-white shadow-[0_4px_20px_-6px_rgba(239,68,68,0.5)]",
        tone === "ghost" &&
          "bg-surface-glass border border-border/40 hover:border-accent-gold/50 text-text-muted hover:text-accent-gold",
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
        active ? "text-accent-gold font-semibold" : "text-text-muted hover:text-text-primary"
      )}
    >
      {Icon && <Icon className="w-[15px] h-[15px]" strokeWidth={1.8} />}
      <span>{children}</span>
      {active && (
        <motion.span
          layoutId="pageshell-active-tab-underline"
          transition={{ type: "spring", stiffness: 450, damping: 35 }}
          aria-hidden="true"
          className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-accent-gold rounded-full"
        />
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
      {unit && <span className="text-text-muted/70 uppercase tracking-wider text-nano ml-0.5">{unit}</span>}
      {label && <span className="font-serif italic text-micro uppercase tracking-[0.24em] text-text-muted/70 ml-2">{label}</span>}
    </span>
  );
}

/* ─── Operational primitives — for POS/KDS/floor-plan/reservations style layouts ────── */

/**
 * PageShellOperationalHeader — sticky éditorial pour les surfaces opérationnelles
 * (POS, KDS, plan de salle, réservations) qui n'utilisent pas le `<PageShell>`
 * complet mais réclament le même vocabulaire visuel : sticky glass, blur,
 * bordure basse, ribbon d'alerte optionnel, gestion d'un mode « rush » qui
 * bascule le fond en surface-sidebar.
 *
 * Enfants libres : composer avec `PageShell.EditorialTitle`,
 * `PageShell.Segmented`, `PageShell.Picker*`, `PageShell.Group`, etc.
 */
export function PageShellOperationalHeader({
  children,
  alert,
  rush,
  dense,
  sticky = true,
  className,
}: {
  children: ReactNode;
  /** Ribbon 2px au-dessus du header (mêmes tons que PageShell.alert). */
  alert?: PageShellAlert;
  /** Mode rush : fond `surface-sidebar/95`, ambiance urgente. */
  rush?: boolean;
  /** Padding vertical plus serré (KDS 76px vs 84px par défaut). */
  dense?: boolean;
  /** Décoller la sticky (utile en modales/plein écran). */
  sticky?: boolean;
  className?: string;
}) {
  return (
    <header
      role="banner"
      className={cn(
        "shrink-0 border-b border-border/40 backdrop-blur-xl transition-colors duration-300",
        rush ? "bg-surface-card" : "bg-surface-glass",
        sticky && "sticky top-0 z-40",
        className
      )}
    >
      {alert && (
        <div aria-hidden="true" className={cn("h-[2px] w-full", ALERT_COLOR[alert])} />
      )}
      <div className={cn("px-6 lg:px-10", dense ? "pt-4 pb-3" : "pt-6 pb-5")}>
        {children}
      </div>
    </header>
  );
}

/**
 * PageShellEditorialTitle — le couple kicker Playfair italic + big title
 * Playfair black, avec variantes de taille/tonalité et emplacements optionnels
 * (icône subtile gold, chevron « picker », status pulse, badge trailing).
 *
 * Peut être rendu comme bouton (`onClick`) pour signaler un picker, ou comme
 * span plein sinon. Extrait de PageShell + 4 headers restaurant.
 */
export function PageShellEditorialTitle({
  kicker,
  title,
  size = "md",
  tone = "primary",
  icon: Icon,
  chevron,
  onClick,
  ariaLabel,
  ariaHasPopup,
  ariaExpanded,
  status,
  badge,
  className,
}: {
  kicker?: string;
  title: string | number | ReactNode;
  /** `sm` = 2xl (KDS/FloorPlan), `md` = 3xl (POS shell), `lg` = 38px (table numbers). */
  size?: "sm" | "md" | "lg";
  /** `primary` = text-primary, `accent` = accent-gold (numérique éditorial). */
  tone?: "primary" | "accent";
  icon?: LucideIcon;
  /** Affiche un chevron rotatif — utile pour signaler un picker. */
  chevron?: boolean;
  /** Si fourni, le titre devient cliquable (wrap dans button). */
  onClick?: () => void;
  ariaLabel?: string;
  ariaHasPopup?: "listbox" | "menu" | "dialog" | boolean;
  ariaExpanded?: boolean;
  /** Pulse status éditorial (rush, success, warning, critical). */
  status?: { label: string; tone?: "rush" | "success" | "warning" | "critical" };
  badge?: ReactNode;
  className?: string;
}) {
  const statusTone = status?.tone ?? "rush";
  const titleColor = tone === "accent" ? "text-accent-gold" : "text-text-primary";
  const titleSize =
    size === "lg"
      ? "text-[38px]"
      : size === "sm"
      ? "text-2xl"
      : "text-3xl lg:text-[34px]";

  const inner = (
    <>
      {kicker && (
        <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-text-muted/80 shrink-0">
          {kicker}
        </span>
      )}
      <span
        className={cn(
          "font-serif italic leading-[1.02] tracking-tight",
          titleColor,
          titleSize
        )}
      >
        {title}
      </span>
      {Icon && (
        <Icon
          className={cn(
            "w-4 h-4 text-accent-gold/70 self-center -translate-y-0.5 shrink-0",
            onClick && "group-hover:text-accent-gold transition-colors"
          )}
          strokeWidth={1.8}
        />
      )}
      {chevron && (
        <ChevronDown
          className={cn(
            "w-4 h-4 text-text-muted transition-transform self-center shrink-0",
            ariaExpanded && "rotate-180"
          )}
        />
      )}
      {status && (
        <span className="flex items-center gap-2 self-center pl-1 shrink-0">
          <span className="relative flex w-2.5 h-2.5 items-center justify-center">
            <span
              className={cn(
                "absolute inset-0 rounded-full motion-safe:animate-ping opacity-50",
                STATUS_DOT[statusTone]
              )}
            />
            <span className={cn("relative rounded-full w-2 h-2", STATUS_DOT[statusTone])} />
          </span>
          <span
            className={cn(
              "font-mono text-[10px] tracking-[0.20em] uppercase",
              STATUS_TEXT[statusTone]
            )}
          >
            {status.label}
          </span>
        </span>
      )}
      {badge && <span className="shrink-0 self-center">{badge}</span>}
    </>
  );

  const baseClass = "flex items-baseline gap-3 min-w-0";

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        aria-haspopup={ariaHasPopup}
        aria-expanded={ariaExpanded}
        className={cn("group hover:opacity-90 transition-opacity", baseClass, className)}
      >
        {inner}
      </button>
    );
  }
  return <span className={cn(baseClass, className)}>{inner}</span>;
}

/**
 * PageShellPickerPanel — panneau dropdown éditorial (utilisé pour tables/étages/
 * grid columns/… dans POS/KDS/floor-plan). Positionne en absolute, anime
 * l'entrée/sortie, ferme au clic extérieur si `onClose` est fourni.
 *
 * Le trigger est laissé à la charge du parent (varie trop : bouton titre,
 * pill numérique, icône seule, etc.). Rendre `PickerOption` à l'intérieur
 * pour l'option row-style standard, ou n'importe quel contenu (grille…).
 */
export function PageShellPickerPanel({
  open,
  onClose,
  align = "left",
  width = 260,
  className,
  children,
}: {
  open: boolean;
  /** Si fourni, un clic hors du panneau appelle `onClose`. */
  onClose?: () => void;
  align?: "left" | "right";
  /** Largeur en pixels (défaut 260). */
  width?: number;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !onClose) return;
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) onClose!();
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.24 }}
          className={cn(
            "absolute top-full mt-3 z-50 bg-surface-card border border-border/60 rounded-xl shadow-2xl p-1 overflow-hidden",
            align === "left" ? "left-0" : "right-0",
            className
          )}
          style={{ width }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Option row-style pour PickerPanel — icône + label + dot sélectionné. */
export function PageShellPickerOption({
  icon: Icon,
  label,
  selected,
  onClick,
  className,
}: {
  icon?: LucideIcon;
  label: string;
  selected?: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="option"
      aria-selected={selected}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left",
        selected
          ? "bg-accent-gold/12 text-accent-gold"
          : "text-text-secondary hover:bg-surface-glass hover:text-text-primary",
        className
      )}
    >
      {Icon && <Icon className="w-4 h-4 opacity-80 shrink-0" />}
      <span className="text-sm font-medium tracking-tight truncate">{label}</span>
      {selected && <span aria-hidden="true" className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-gold" />}
    </button>
  );
}

/**
 * PageShellSegmented — rail de choix mutuellement exclusifs (view switcher,
 * consumption mode, day/week…). Rend un conteneur `bg-surface-glass` avec
 * bordure et dividers verticaux entre enfants.
 *
 * Compose avec `PageShell.SegmentedItem` (défault active tone) — on peut aussi
 * y placer n'importe quel bouton custom (RBAC wrap, ActionGuard…).
 */
export function PageShellSegmented({
  children,
  ariaLabel,
  className,
}: {
  children: ReactNode;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <nav
      aria-label={ariaLabel}
      className={cn(
        "flex items-center h-10 bg-surface-glass border border-border/40 rounded-xl overflow-hidden",
        "[&>*:not(:first-child)]:border-l [&>*]:border-border/40",
        className
      )}
    >
      {children}
    </nav>
  );
}

/** Item d'un `PageShellSegmented` — bouton avec active state cohérent. */
export function PageShellSegmentedItem({
  active,
  onClick,
  icon: Icon,
  children,
  ariaLabel,
  title,
  tone = "neutral",
  disabled,
  className,
}: {
  active?: boolean;
  onClick: () => void;
  icon?: LucideIcon;
  children?: ReactNode;
  ariaLabel?: string;
  title?: string;
  /** `accent` réserve le style gold — utilisé sur les toggles éditoriaux (grille, 3D). */
  tone?: "neutral" | "accent";
  disabled?: boolean;
  className?: string;
}) {
  const activeClass =
    tone === "accent"
      ? "bg-accent-gold/20 text-accent-gold font-bold"
      : "bg-surface-glass-hover text-text-primary";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      aria-pressed={active}
      aria-label={ariaLabel}
      title={title}
      disabled={disabled}
      className={cn(
        "h-full flex items-center gap-2 px-4 text-xs font-medium tracking-tight transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
        active ? activeClass : "text-text-muted hover:text-text-primary",
        className
      )}
    >
      {Icon && <Icon className="w-[14px] h-[14px]" strokeWidth={2} />}
      {children && <span>{children}</span>}
    </button>
  );
}

/* Named-space attachments so consumers can write `<PageShell.Group>` etc. */
PageShell.Group = PageShellActionGroup;
PageShell.CTA = PageShellActionCTA;
PageShell.Tab = PageShellTab;
PageShell.Fraction = PageShellFraction;
PageShell.OperationalHeader = PageShellOperationalHeader;
PageShell.EditorialTitle = PageShellEditorialTitle;
PageShell.PickerPanel = PageShellPickerPanel;
PageShell.PickerOption = PageShellPickerOption;
PageShell.Segmented = PageShellSegmented;
PageShell.SegmentedItem = PageShellSegmentedItem;
