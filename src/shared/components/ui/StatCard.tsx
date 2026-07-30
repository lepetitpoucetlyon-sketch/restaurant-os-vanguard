"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/ui.foundations";;
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface StatCardProps {
    label: string;
    value: string | number;
    icon?: LucideIcon;
    emoji?: string;
    trend?: {
        value: number;
        direction: "up" | "down" | "neutral";
    };
    accentColor?: "accent" | "success" | "warning" | "error" | "info";
    variant?: "default" | "compact" | "large" | "minimal";
    className?: string;
}

const accentColors = {
    accent: {
        icon: "text-accent",
        bg: "bg-accent/10",
        border: "border-accent/20",
        trend: "text-accent",
    },
    success: {
        icon: "text-status-success",
        bg: "bg-status-success/10",
        border: "border-emerald-500/20",
        trend: "text-status-success",
    },
    warning: {
        icon: "text-status-warning",
        bg: "bg-status-warning/10",
        border: "border-action-primary/20",
        trend: "text-status-warning",
    },
    error: {
        icon: "text-status-danger",
        bg: "bg-status-danger/10",
        border: "border-rose-500/20",
        trend: "text-status-danger",
    },
    info: {
        icon: "text-brand",
        bg: "bg-action-primary/10",
        border: "border-focus/20",
        trend: "text-brand",
    },
};

export function StatCard({
    label,
    value,
    icon: Icon,
    emoji,
    trend,
    accentColor = "accent",
    variant = "default",
    className,
}: StatCardProps) {
    const colors = accentColors[accentColor];

    const variantStyles = {
        compact: {
            container: "p-4",
            iconSize: "w-10 h-10 rounded-xl",
            iconInner: "w-4 h-4",
            value: "text-2xl",
            label: "text-[8px]",
        },
        default: {
            container: "p-6",
            iconSize: "w-12 h-12 rounded-2xl",
            iconInner: "w-5 h-5",
            value: "text-3xl",
            label: "text-[9px]",
        },
        large: {
            container: "p-8",
            iconSize: "w-14 h-14 rounded-2xl",
            iconInner: "w-6 h-6",
            value: "text-4xl",
            label: "text-[10px]",
        },
        minimal: {
            container: "p-4",
            iconSize: "w-8 h-8 rounded-lg",
            iconInner: "w-3.5 h-3.5",
            value: "text-xl",
            label: "text-[8px]",
        },
    };

    const styles = variantStyles[variant];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "bg-bg-secondary border border-border rounded-[2rem] transition-all duration-300 hover:shadow-lg group",
                styles.container,
                className
            )}
            role="region"
            aria-label={`${label}: ${value}`}
        >
            <div className="flex items-start justify-between mb-4">
                <div
                    className={cn(
                        "flex items-center justify-center border",
                        colors.bg,
                        colors.border,
                        styles.iconSize
                    )}
                >
                    {emoji ? (
                        <span className="text-lg">{emoji}</span>
                    ) : Icon ? (
                        <Icon className={cn(colors.icon, styles.iconInner)} strokeWidth={2} />
                    ) : null}
                </div>

                {trend && (
                    <div
                        className={cn(
                            "flex items-center gap-1 text-[10px] font-bold",
                            trend.direction === "up" && "text-status-success",
                            trend.direction === "down" && "text-status-danger",
                            trend.direction === "neutral" && "text-text-muted"
                        )}
                    >
                        {trend.direction === "up" && "↑"}
                        {trend.direction === "down" && "↓"}
                        {trend.value}%
                    </div>
                )}
            </div>

            <div>
                <p
                    className={cn(
                        "font-serif font-medium text-text-primary tracking-tight italic group-hover:text-accent transition-colors",
                        styles.value
                    )}
                >
                    {value}
                </p>
                <p
                    className={cn(
                        "font-black text-text-muted uppercase tracking-[0.2em] mt-1",
                        styles.label
                    )}
                >
                    {label}
                </p>
            </div>
        </motion.div>
    );
}

interface StatsGridProps {
    children: ReactNode;
    columns?: 2 | 3 | 4 | 5 | 6;
    gap?: "sm" | "md" | "lg";
    className?: string;
}

export function StatsGrid({
    children,
    columns = 4,
    gap = "md",
    className,
}: StatsGridProps) {
    const columnClasses = {
        2: "grid-cols-1 sm:grid-cols-2",
        3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
        5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
        6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
    };

    const gapClasses = {
        sm: "gap-3",
        md: "gap-6",
        lg: "gap-8",
    };

    return (
        <div className={cn("grid", columnClasses[columns], gapClasses[gap], className)}>
            {children}
        </div>
    );
}
