import { cn } from "@/lib/ui.foundations";
import { ReactNode } from "react";

export type BadgeStatus = "success" | "warning" | "error" | "info" | "neutral" | "accent";

interface StatusBadgeProps {
    status: BadgeStatus;
    label: string;
    icon?: ReactNode;
    size?: "sm" | "md" | "lg";
    variant?: "solid" | "outline" | "soft";
    pulse?: boolean;
    className?: string;
}

const statusColors = {
    success: {
        solid: "bg-status-success text-text-primary",
        outline: "border-status-success text-status-success",
        soft: "bg-status-success/10 text-status-success border-status-success/20",
    },
    warning: {
        solid: "bg-status-warning text-text-primary",
        outline: "border-status-warning text-status-warning",
        soft: "bg-status-warning/10 text-status-warning border-status-warning/20",
    },
    error: {
        solid: "bg-status-danger text-text-primary",
        outline: "border-status-danger text-status-danger",
        soft: "bg-status-danger/10 text-status-danger border-status-danger/20",
    },
    info: {
        solid: "bg-action-primary text-action-primary-fg",
        outline: "border-action-primary text-action-primary",
        soft: "bg-action-primary/10 text-action-primary border-action-primary/20",
    },
    neutral: {
        solid: "bg-surface-tertiary text-text-primary",
        outline: "border-border-default text-text-secondary",
        soft: "bg-surface-card text-text-secondary border-border-default",
    },
    accent: {
        solid: "bg-action-accent text-action-primary-fg",
        outline: "border-action-accent text-action-accent",
        soft: "bg-action-accent/10 text-action-accent border-action-accent/20",
    },
};

const sizeClasses = {
    sm: "px-2 py-0.5 text-[8px] gap-1",
    md: "px-3 py-1 text-[10px] gap-1.5",
    lg: "px-4 py-1.5 text-xs gap-2",
};

export function StatusBadge({
    status,
    label,
    icon,
    size = "md",
    variant = "soft",
    pulse = false,
    className,
}: StatusBadgeProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center font-black uppercase tracking-widest rounded-full border transition-all",
                statusColors[status][variant],
                sizeClasses[size],
                className
            )}
        >
            {pulse && (
                <span className="relative flex h-2 w-2">
                    <span
                        className={cn(
                            "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                            status === "success" && "bg-status-success",
                            status === "warning" && "bg-status-warning",
                            status === "error" && "bg-status-danger",
                            status === "info" && "bg-action-primary",
                            status === "neutral" && "bg-surface-tertiary",
                            status === "accent" && "bg-action-accent"
                        )}
                    />
                    <span
                        className={cn(
                            "relative inline-flex rounded-full h-2 w-2",
                            status === "success" && "bg-status-success",
                            status === "warning" && "bg-status-warning",
                            status === "error" && "bg-status-danger",
                            status === "info" && "bg-action-primary",
                            status === "neutral" && "bg-surface-tertiary",
                            status === "accent" && "bg-action-accent"
                        )}
                    />
                </span>
            )}
            {icon}
            {label}
        </span>
    );
}
