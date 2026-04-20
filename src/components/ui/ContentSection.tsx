"use client";

import { cn } from "@/lib/ui.foundations";;
import { ReactNode } from "react";

interface ContentSectionProps {
    title?: string;
    subtitle?: string;
    children: ReactNode;
    action?: ReactNode;
    collapsible?: boolean;
    defaultOpen?: boolean;
    variant?: "default" | "card" | "transparent";
    padding?: "none" | "sm" | "md" | "lg";
    className?: string;
}

export function ContentSection({
    title,
    subtitle,
    children,
    action,
    variant = "default",
    padding = "md",
    className,
}: ContentSectionProps) {
    const variantClasses = {
        default: "bg-bg-secondary border border-border rounded-[2rem]",
        card: "bg-bg-secondary/50 backdrop-blur-md border border-border rounded-[2.5rem] shadow-lg",
        transparent: "",
    };

    const paddingClasses = {
        none: "",
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
    };

    return (
        <section className={cn(variantClasses[variant], paddingClasses[padding], className)}>
            {/* Header */}
            {(title || subtitle || action) && (
                <div className="flex items-center justify-between mb-6">
                    <div>
                        {subtitle && (
                            <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.3em] mb-1">
                                {subtitle}
                            </p>
                        )}
                        {title && (
                            <h3 className="text-xl font-serif font-bold text-text-primary tracking-tight">
                                {title}
                            </h3>
                        )}
                    </div>
                    {action && <div>{action}</div>}
                </div>
            )}

            {/* Content */}
            {children}
        </section>
    );
}

interface ContentGridProps {
    children: ReactNode;
    columns?: 1 | 2 | 3 | 4 | 6;
    gap?: "sm" | "md" | "lg";
    className?: string;
}

export function ContentGrid({
    children,
    columns = 3,
    gap = "md",
    className,
}: ContentGridProps) {
    const columnClasses = {
        1: "grid-cols-1",
        2: "grid-cols-1 md:grid-cols-2",
        3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
        6: "grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
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
