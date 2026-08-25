"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/ui.foundations";
import type { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface PageHeaderProps {
    title?: string;
    subtitle?: string;
    icon?: LucideIcon;
    emoji?: string;
    breadcrumb?: { label: string; href?: string }[];
    actions?: ReactNode;
    tabs?: ReactNode;
    variant?: "default" | "minimal" | "hero";
    className?: string;
}

export function PageHeader({
    title,
    subtitle,
    icon: Icon,
    emoji,
    breadcrumb,
    actions,
    tabs,
    variant = "default",
    className,
}: PageHeaderProps) {
    const variantStyles = {
        minimal: {
            container: "py-4 px-6",
            titleSize: "text-xl",
            subtitleSize: "text-nano",
            iconSize: "w-10 h-10 rounded-xl",
            iconInner: "w-5 h-5",
        },
        default: {
            container: "py-6 px-8",
            titleSize: "text-2xl",
            subtitleSize: "text-nano",
            iconSize: "w-12 h-12 rounded-2xl",
            iconInner: "w-6 h-6",
        },
        hero: {
            container: "py-10 px-10",
            titleSize: "text-4xl",
            subtitleSize: "text-xs",
            iconSize: "w-16 h-16 rounded-[2rem]",
            iconInner: "w-8 h-8",
        },
    };

    const styles = variantStyles[variant];

    return (
        <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className={cn(
                "bg-bg-secondary/50 backdrop-blur-md border-b border-border",
                styles.container,
                className
            )}
        >
            {/* Breadcrumb */}
            {breadcrumb && breadcrumb.length > 0 && (
                <nav className="flex items-center gap-2 mb-4">
                    {breadcrumb.map((item, index) => (
                        <span key={index} className="flex items-center gap-2">
                            {index > 0 && (
                                <span className="text-text-muted/40">/</span>
                            )}
                            {item.href ? (
                                <a
                                    href={item.href}
                                    className="text-nano font-bold uppercase tracking-widest text-text-muted hover:text-accent transition-colors"
                                >
                                    {item.label}
                                </a>
                            ) : (
                                <span className="text-nano font-bold uppercase tracking-widest text-text-primary">
                                    {item.label}
                                </span>
                            )}
                        </span>
                    ))}
                </nav>
            )}

            <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    {/* Icon */}
                    {(Icon || emoji) && (
                        <div
                            className={cn(
                                "flex items-center justify-center bg-accent text-text-primary shadow-lg shadow-accent/20",
                                styles.iconSize
                            )}
                        >
                            {emoji ? (
                                <span className="text-2xl">{emoji}</span>
                            ) : Icon ? (
                                <Icon className={styles.iconInner} strokeWidth={2} />
                            ) : null}
                        </div>
                    )}

                    {/* Title & Subtitle */}
                    <div>
                        {subtitle && (
                            <p
                                className={cn(
                                    "font-black text-text-muted uppercase tracking-[0.3em] mb-1",
                                    styles.subtitleSize
                                )}
                            >
                                {subtitle}
                            </p>
                        )}
                        {title && (
                            <h1
                                className={cn(
                                    "font-serif font-bold text-text-primary tracking-tight",
                                    styles.titleSize
                                )}
                            >
                                {title}
                            </h1>
                        )}
                    </div>
                </div>

                {/* Actions */}
                {actions && (
                    <div className="flex items-center gap-4">{actions}</div>
                )}
            </div>

            {/* Tabs */}
            {tabs && <div className="mt-6">{tabs}</div>}
        </motion.header>
    );
}
