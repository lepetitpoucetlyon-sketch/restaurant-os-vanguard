// @ts-nocheck
"use client";

import { cn } from "@/lib/ui.foundations";;
import { ReactNode } from "react";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DashboardLayoutProps {
    children: ReactNode;
    sidebar?: ReactNode;
    toolbar?: ReactNode;
    sidebarWidth?: "sm" | "md" | "lg";
    sidebarPosition?: "left" | "right";
    scrollable?: boolean;
    padding?: "none" | "sm" | "md" | "lg";
    className?: string;
}

const sidebarWidthClasses = {
    sm: "w-64",
    md: "w-80",
    lg: "w-96",
};

const paddingClasses = {
    none: "",
    sm: "p-4",
    md: "p-6 lg:p-8",
    lg: "p-8 lg:p-12",
};

export function DashboardLayout({
    children,
    sidebar,
    toolbar,
    sidebarWidth = "md",
    sidebarPosition = "left",
    scrollable = true,
    padding = "md",
    className,
}: DashboardLayoutProps) {
    const content = (
        <div className={cn(paddingClasses[padding], "pb-24 lg:pb-8")}>
            {children}
        </div>
    );

    return (
        <div
            className={cn(
                "flex h-[calc(100vh-80px)] lg:h-[calc(100vh-100px)] -m-4 lg:-m-8 bg-bg-primary overflow-hidden",
                className
            )}
        >
            {/* Sidebar Left */}
            {sidebar && sidebarPosition === "left" && (
                <motion.aside
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className={cn(
                        "hidden lg:flex flex-col border-r border-border bg-bg-secondary shrink-0 h-full",
                        sidebarWidthClasses[sidebarWidth]
                    )}
                >
                    {sidebar}
                </motion.aside>
            )}

            {/* Main Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Toolbar */}
                {toolbar && (
                    <div className="shrink-0 sticky top-0 z-40">{toolbar}</div>
                )}

                {/* Content */}
                {scrollable ? (
                    <ScrollArea className="flex-1">{content}</ScrollArea>
                ) : (
                    <div className="flex-1 overflow-hidden">{content}</div>
                )}
            </div>

            {/* Sidebar Right */}
            {sidebar && sidebarPosition === "right" && (
                <motion.aside
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className={cn(
                        "hidden lg:flex flex-col border-l border-border bg-bg-secondary shrink-0 h-full",
                        sidebarWidthClasses[sidebarWidth]
                    )}
                >
                    {sidebar}
                </motion.aside>
            )}
        </div>
    );
}
