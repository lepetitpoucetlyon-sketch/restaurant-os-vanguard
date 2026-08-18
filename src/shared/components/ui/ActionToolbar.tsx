"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/ui.foundations";
import type { ReactNode } from "react";

interface ActionToolbarProps {
    children: ReactNode;
    position?: "top" | "bottom" | "floating";
    align?: "left" | "center" | "right" | "between";
    sticky?: boolean;
    className?: string;
    "aria-label"?: string;
}

export function ActionToolbar({
    children,
    position = "top",
    align = "between",
    sticky = false,
    className,
    ...props
}: ActionToolbarProps) {
    const alignClasses = {
        left: "justify-start",
        center: "justify-center",
        right: "justify-end",
        between: "justify-between",
    };

    const positionClasses = {
        top: "border-b border-border",
        bottom: "border-t border-border",
        floating: "rounded-full border border-border shadow-lg",
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: position === "bottom" ? 20 : -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "flex items-center gap-4 px-6 py-4 bg-bg-secondary/50 backdrop-blur-md",
                alignClasses[align],
                positionClasses[position],
                sticky && "sticky z-40",
                sticky && position === "top" && "top-0",
                sticky && position === "bottom" && "bottom-0",
                className
            )}
            role="toolbar"
            aria-orientation="horizontal"
            aria-label={props["aria-label"] || "Barre d'actions"}
        >
            {children}
        </motion.div>
    );
}

interface ToolbarGroupProps {
    children: ReactNode;
    gap?: "sm" | "md" | "lg";
    className?: string;
}

export function ToolbarGroup({
    children,
    gap = "md",
    className,
}: ToolbarGroupProps) {
    const gapClasses = {
        sm: "gap-2",
        md: "gap-4",
        lg: "gap-6",
    };

    return (
        <div className={cn("flex items-center", gapClasses[gap], className)}>
            {children}
        </div>
    );
}

interface ToolbarDividerProps {
    orientation?: "vertical" | "horizontal";
    className?: string;
}

export function ToolbarDivider({
    orientation = "vertical",
    className,
}: ToolbarDividerProps) {
    return (
        <div
            className={cn(
                "bg-border",
                orientation === "vertical" ? "w-px h-8" : "w-full h-px",
                className
            )}
            role="separator"
            aria-orientation={orientation}
        />
    );
}
