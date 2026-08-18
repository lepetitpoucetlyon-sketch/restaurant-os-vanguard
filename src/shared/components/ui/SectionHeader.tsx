"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/ui.foundations";
import { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface SectionHeaderProps {
    title: string;
    subtitle?: string;
    icon?: LucideIcon;
    emoji?: string;
    accentColor?: "accent" | "success" | "warning" | "error" | "info";
    action?: ReactNode;
    variant?: "default" | "minimal" | "large";
    className?: string;
}

const colorClasses = {
    accent: "bg-accent text-bg-primary",
    success: "bg-status-success text-text-primary",
    warning: "bg-status-warning text-text-primary",
    error: "bg-status-danger text-text-primary",
    info: "bg-action-primary text-text-primary",
};

export function SectionHeader({
    title,
    subtitle,
    icon: Icon,
    emoji,
    accentColor = "accent",
    action,
    variant = "default",
    className,
}: SectionHeaderProps) {
    const variantStyles = {
        minimal: {
            container: "mb-4",
            iconSize: "w-8 h-8 rounded-lg",
            iconInner: "w-4 h-4",
            title: "text-lg",
            subtitle: "text-[9px]",
        },
        default: {
            container: "mb-6",
            iconSize: "w-12 h-12 rounded-xl",
            iconInner: "w-5 h-5",
            title: "text-xl",
            subtitle: "text-[10px]",
        },
        large: {
            container: "mb-8",
            iconSize: "w-14 h-14 rounded-2xl",
            iconInner: "w-6 h-6",
            title: "text-2xl",
            subtitle: "text-[11px]",
        },
    };

    const styles = variantStyles[variant];

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "flex items-center justify-between",
                styles.container,
                className
            )}
        >
            <div className="flex items-center gap-4">
                {(Icon || emoji) && (
                    <div
                        className={cn(
                            "flex items-center justify-center shadow-lg",
                            colorClasses[accentColor],
                            styles.iconSize
                        )}
                    >
                        {emoji ? (
                            <span className="text-lg">{emoji}</span>
                        ) : Icon ? (
                            <Icon className={styles.iconInner} strokeWidth={2} />
                        ) : null}
                    </div>
                )}

                <div>
                    {subtitle && (
                        <p
                            className={cn(
                                "font-black text-text-muted uppercase tracking-[0.3em] mb-1",
                                styles.subtitle
                            )}
                        >
                            {subtitle}
                        </p>
                    )}
                    <h2
                        className={cn(
                            "font-serif font-bold text-text-primary tracking-tight",
                            styles.title
                        )}
                    >
                        {title}
                    </h2>
                </div>
            </div>

            {action && <div>{action}</div>}
        </motion.div>
    );
}
