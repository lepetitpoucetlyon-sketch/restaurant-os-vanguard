"use client";

import { cn } from "@/lib/ui.foundations";
import { ReactNode, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SplitLayoutProps {
    left: ReactNode;
    right: ReactNode;
    leftWidth?: "1/4" | "1/3" | "2/5" | "1/2" | "3/5" | "2/3" | "3/4";
    gap?: "none" | "sm" | "md" | "lg";
    collapsible?: "left" | "right" | "none";
    defaultCollapsed?: boolean;
    divider?: boolean;
    className?: string;
}

const widthClasses = {
    "1/4": { left: "w-1/4", right: "w-3/4" },
    "1/3": { left: "w-1/3", right: "w-2/3" },
    "2/5": { left: "w-2/5", right: "w-3/5" },
    "1/2": { left: "w-1/2", right: "w-1/2" },
    "3/5": { left: "w-3/5", right: "w-2/5" },
    "2/3": { left: "w-2/3", right: "w-1/3" },
    "3/4": { left: "w-3/4", right: "w-1/4" },
};

const gapClasses = {
    none: "gap-0",
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-8",
};

export function SplitLayout({
    left,
    right,
    leftWidth = "1/3",
    gap = "md",
    collapsible = "none",
    defaultCollapsed = false,
    divider = true,
    className,
}: SplitLayoutProps) {
    const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

    const widths = widthClasses[leftWidth];

    return (
        <div className={cn("flex h-full", gapClasses[gap], className)}>
            {/* Left Panel */}
            <AnimatePresence mode="wait">
                {collapsible !== "left" || !isCollapsed ? (
                    <motion.div
                        initial={collapsible === "left" ? { width: 0, opacity: 0 } : undefined}
                        animate={{ width: "auto", opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        className={cn(
                            "shrink-0 overflow-hidden",
                            collapsible !== "left" && widths.left,
                            divider && "border-r border-border"
                        )}
                    >
                        {left}
                    </motion.div>
                ) : null}
            </AnimatePresence>

            {/* Collapse Toggle */}
            {collapsible !== "none" && (
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="flex items-center justify-center w-6 h-12 my-auto bg-bg-tertiary border border-border rounded-full shadow-sm hover:bg-bg-secondary transition-colors z-10 -mx-3"
                >
                    {(collapsible === "left" && !isCollapsed) ||
                        (collapsible === "right" && isCollapsed) ? (
                        <ChevronLeft className="w-4 h-4 text-text-muted" />
                    ) : (
                        <ChevronRight className="w-4 h-4 text-text-muted" />
                    )}
                </button>
            )}

            {/* Right Panel */}
            <AnimatePresence mode="wait">
                {collapsible !== "right" || !isCollapsed ? (
                    <motion.div
                        initial={collapsible === "right" ? { width: 0, opacity: 0 } : undefined}
                        animate={{ width: "auto", opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        className={cn(
                            "flex-1 overflow-hidden",
                            collapsible !== "right" && widths.right
                        )}
                    >
                        {right}
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    );
}
