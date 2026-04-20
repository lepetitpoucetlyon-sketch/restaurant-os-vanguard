"use client";

import { cn } from "@/lib/ui.foundations";;
import { ReactNode } from "react";

type BadgeStatus = "success" | "warning" | "error" | "info" | "neutral" | "accent";

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
        solid: "bg-emerald-500 text-white",
        outline: "border-emerald-500 text-emerald-500",
        soft: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
    },
    warning: {
        solid: "bg-amber-500 text-white",
        outline: "border-amber-500 text-amber-500",
        soft: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
    },
    error: {
        solid: "bg-rose-500 text-white",
        outline: "border-rose-500 text-rose-500",
        soft: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20",
    },
    info: {
        solid: "bg-blue-500 text-white",
        outline: "border-blue-500 text-blue-500",
        soft: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
    },
    neutral: {
        solid: "bg-neutral-500 text-white",
        outline: "border-neutral-400 text-neutral-500",
        soft: "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-white/5 dark:text-neutral-400 dark:border-white/10",
    },
    accent: {
        solid: "bg-accent text-bg-primary",
        outline: "border-accent text-accent",
        soft: "bg-accent/10 text-accent border-accent/20",
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
                            status === "success" && "bg-emerald-400",
                            status === "warning" && "bg-amber-400",
                            status === "error" && "bg-rose-400",
                            status === "info" && "bg-blue-400",
                            status === "neutral" && "bg-neutral-400",
                            status === "accent" && "bg-accent"
                        )}
                    />
                    <span
                        className={cn(
                            "relative inline-flex rounded-full h-2 w-2",
                            status === "success" && "bg-emerald-500",
                            status === "warning" && "bg-amber-500",
                            status === "error" && "bg-rose-500",
                            status === "info" && "bg-blue-500",
                            status === "neutral" && "bg-neutral-500",
                            status === "accent" && "bg-accent"
                        )}
                    />
                </span>
            )}
            {icon}
            {label}
        </span>
    );
}
