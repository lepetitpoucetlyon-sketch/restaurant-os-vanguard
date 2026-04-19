"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/ui.foundations";;
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface EmptyStateProps {
    icon?: LucideIcon;
    emoji?: string;
    title: string;
    description?: string;
    action?: ReactNode;
    variant?: "default" | "compact" | "large";
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
            container: "py-12",
            iconContainer: "w-12 h-12 rounded-xl mb-4",
            iconSize: "w-6 h-6",
            title: "text-[10px]",
            description: "text-xs",
        },
        default: {
            container: "py-16",
            iconContainer: "w-16 h-16 rounded-[2rem] mb-6",
            iconSize: "w-8 h-8",
            title: "text-[11px]",
            description: "text-sm",
        },
        large: {
            container: "py-24",
            iconContainer: "w-24 h-24 rounded-[2.5rem] mb-8",
            iconSize: "w-12 h-12",
            title: "text-sm",
            description: "text-base",
        },
    };

    const styles = variantClasses[variant];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "flex flex-col items-center justify-center text-center",
                styles.container,
                className
            )}
        >
            <div
                className={cn(
                    "bg-bg-tertiary flex items-center justify-center border border-border",
                    styles.iconContainer
                )}
            >
                {emoji ? (
                    <span className={cn("text-2xl", variant === "large" && "text-4xl")}>
                        {emoji}
                    </span>
                ) : Icon ? (
                    <Icon
                        strokeWidth={1}
                        className={cn("text-text-muted/50", styles.iconSize)}
                    />
                ) : null}
            </div>

            <p
                className={cn(
                    "font-black text-text-muted/60 uppercase tracking-[0.3em] italic",
                    styles.title
                )}
            >
                {title}
            </p>

            {description && (
                <p className={cn("text-text-muted/50 mt-2 max-w-sm", styles.description)}>
                    {description}
                </p>
            )}

            {action && <div className="mt-6">{action}</div>}
        </motion.div>
    );
}
