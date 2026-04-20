// @ts-nocheck
"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/ui.foundations";;
import { ReactNode } from "react";

export interface TabItem {
    id: string;
    label: string;
    icon?: ReactNode;
    badge?: string | number;
}

interface ToolbarTabsProps {
    tabs: TabItem[];
    activeTab: string;
    onChange: (tabId: string) => void;
    variant?: "pill" | "underline" | "boxed";
    size?: "sm" | "md" | "lg";
    className?: string;
}

export function ToolbarTabs({
    tabs,
    activeTab,
    onChange,
    variant = "pill",
    size = "md",
    className,
}: ToolbarTabsProps) {
    const sizeClasses = {
        sm: "h-8 px-4 text-[9px]",
        md: "h-10 px-6 text-[10px]",
        lg: "h-12 px-8 text-[11px]",
    };

    const containerClasses = {
        pill: "bg-bg-tertiary p-1 rounded-full border border-border",
        underline: "border-b border-border",
        boxed: "bg-bg-tertiary p-1 rounded-xl border border-border",
    };

    const getTabClasses = (isActive: boolean) => {
        const base = cn(
            "font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2.5",
            sizeClasses[size]
        );

        if (variant === "pill") {
            return cn(
                base,
                "rounded-full",
                isActive
                    ? "bg-bg-primary text-text-primary shadow-sm ring-1 ring-black/5 dark:ring-white/5"
                    : "text-text-muted hover:text-text-primary hover:bg-bg-primary/50"
            );
        }

        if (variant === "underline") {
            return cn(
                base,
                "rounded-none border-b-2 -mb-px",
                isActive
                    ? "border-accent text-accent"
                    : "border-transparent text-text-muted hover:text-text-primary"
            );
        }

        // boxed
        return cn(
            base,
            "rounded-lg",
            isActive
                ? "bg-accent text-bg-primary shadow-md"
                : "text-text-muted hover:text-text-primary hover:bg-bg-primary/50"
        );
    };

    return (
        <div className={cn("flex items-center", containerClasses[variant], className)}>
            {tabs.map((tab) => (
                <motion.button
                    key={tab.id}
                    onClick={() => onChange(tab.id)}
                    className={getTabClasses(activeTab === tab.id)}
                    whileTap={{ scale: 0.95 }}
                >
                    {tab.icon}
                    {tab.label}
                    {tab.badge !== undefined && (
                        <span
                            className={cn(
                                "ml-1.5 px-1.5 py-0.5 rounded-full text-[8px] font-black",
                                activeTab === tab.id
                                    ? "bg-accent/20 text-accent"
                                    : "bg-text-muted/20 text-text-muted"
                            )}
                        >
                            {tab.badge}
                        </span>
                    )}
                </motion.button>
            ))}
        </div>
    );
}
