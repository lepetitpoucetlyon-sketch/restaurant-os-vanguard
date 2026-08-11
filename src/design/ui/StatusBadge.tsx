import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/ui.foundations";
import { ReactNode } from "react";

export type BadgeStatus = "success" | "warning" | "error" | "info" | "neutral" | "accent";

// ── StatusBadge CVA ───────────────────────────────────────────────────────────
const badgeVariants = cva(
  "inline-flex items-center font-black uppercase tracking-widest rounded-full border transition-all",
  {
    variants: {
      status: {
        success: "",
        warning: "",
        error:   "",
        info:    "",
        neutral: "",
        accent:  "",
      },
      variant: {
        solid:   "",
        outline: "",
        soft:    "",
      },
      size: {
        sm: "px-2 py-0.5 text-[8px] gap-1",
        md: "px-3 py-1 text-[10px] gap-1.5",
        lg: "px-4 py-1.5 text-xs gap-2",
      },
    },
    compoundVariants: [
      // success
      { status: "success", variant: "solid",   class: "bg-status-success text-text-primary border-transparent" },
      { status: "success", variant: "outline",  class: "border-status-success text-status-success bg-transparent" },
      { status: "success", variant: "soft",     class: "bg-status-success/10 text-status-success border-status-success/20" },
      // warning
      { status: "warning", variant: "solid",   class: "bg-status-warning text-text-primary border-transparent" },
      { status: "warning", variant: "outline",  class: "border-status-warning text-status-warning bg-transparent" },
      { status: "warning", variant: "soft",     class: "bg-status-warning/10 text-status-warning border-status-warning/20" },
      // error
      { status: "error",   variant: "solid",   class: "bg-status-danger text-text-primary border-transparent" },
      { status: "error",   variant: "outline",  class: "border-status-danger text-status-danger bg-transparent" },
      { status: "error",   variant: "soft",     class: "bg-status-danger/10 text-status-danger border-status-danger/20" },
      // info
      { status: "info",    variant: "solid",   class: "bg-action-primary text-action-primary-fg border-transparent" },
      { status: "info",    variant: "outline",  class: "border-action-primary text-action-primary bg-transparent" },
      { status: "info",    variant: "soft",     class: "bg-action-primary/10 text-action-primary border-action-primary/20" },
      // neutral
      { status: "neutral", variant: "solid",   class: "bg-surface-tertiary text-text-primary border-transparent" },
      { status: "neutral", variant: "outline",  class: "border-border-default text-text-secondary bg-transparent" },
      { status: "neutral", variant: "soft",     class: "bg-surface-card text-text-secondary border-border-default" },
      // accent
      { status: "accent",  variant: "solid",   class: "bg-action-accent text-action-primary-fg border-transparent" },
      { status: "accent",  variant: "outline",  class: "border-action-accent text-action-accent bg-transparent" },
      { status: "accent",  variant: "soft",     class: "bg-action-accent/10 text-action-accent border-action-accent/20" },
    ],
    defaultVariants: {
      status:  "neutral",
      variant: "soft",
      size:    "md",
    },
  }
);

const pulseColorMap: Record<BadgeStatus, string> = {
  success: "bg-status-success",
  warning: "bg-status-warning",
  error:   "bg-status-danger",
  info:    "bg-action-primary",
  neutral: "bg-surface-tertiary",
  accent:  "bg-action-accent",
};

interface StatusBadgeProps extends VariantProps<typeof badgeVariants> {
  label: string;
  icon?: ReactNode;
  pulse?: boolean;
  className?: string;
}

export function StatusBadge({
  status = "neutral",
  label,
  icon,
  size = "md",
  variant = "soft",
  pulse = false,
  className,
}: StatusBadgeProps) {
  return (
    <span className={cn(badgeVariants({ status, variant, size }), className)}>
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span
            className={cn(
              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
              pulseColorMap[status ?? "neutral"]
            )}
          />
          <span
            className={cn(
              "relative inline-flex rounded-full h-2 w-2",
              pulseColorMap[status ?? "neutral"]
            )}
          />
        </span>
      )}
      {icon}
      {label}
    </span>
  );
}
