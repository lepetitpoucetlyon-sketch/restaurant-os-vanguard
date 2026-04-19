"use client";

import { cn } from "@/lib/ui.foundations";;
import { ReactNode } from "react";
import { motion } from "framer-motion";

interface PageLayoutProps {
    children: ReactNode;
    header?: ReactNode;
    footer?: ReactNode;
    sidebar?: ReactNode;
    sidebarPosition?: "left" | "right";
    sidebarWidth?: "sm" | "md" | "lg" | "xl";
    fullHeight?: boolean;
    padding?: "none" | "sm" | "md" | "lg";
    maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "full" | "none";
    background?: "primary" | "secondary" | "tertiary" | "transparent";
    className?: string;
}

const sidebarWidthClasses = {
    sm: "w-64",
    md: "w-80",
    lg: "w-96",
    xl: "w-[400px]",
};

const maxWidthClasses = {
    sm: "max-w-3xl",
    md: "max-w-5xl",
    lg: "max-w-6xl",
    xl: "max-w-7xl",
    "2xl": "max-w-[1600px]",
    full: "max-w-full",
    none: "",
};

const paddingClasses = {
    none: "",
    sm: "p-4 md:p-6",
    md: "p-6 md:p-8",
    lg: "p-8 md:p-12",
};

const backgroundClasses = {
    primary: "bg-bg-primary",
    secondary: "bg-bg-secondary",
    tertiary: "bg-bg-tertiary",
    transparent: "bg-transparent",
};

export function PageLayout({
    children,
    header,
    footer,
    sidebar,
    sidebarPosition = "left",
    sidebarWidth = "md",
    fullHeight = true,
    padding = "md",
    maxWidth = "xl",
    background = "primary",
    className,
}: PageLayoutProps) {
    const hasSidebar = !!sidebar;

    return (
        <div
            className={cn(
                "flex flex-col transition-colors duration-500",
                fullHeight && "min-h-screen",
                backgroundClasses[background],
                className
            )}
        >
            {/* Header */}
            {header}

            {/* Main Content Area */}
            <div className={cn("flex flex-1", hasSidebar && "overflow-hidden")}>
                {/* Sidebar Left */}
                {hasSidebar && sidebarPosition === "left" && (
                    <aside
                        className={cn(
                            "hidden lg:flex flex-col border-r border-border bg-bg-secondary shrink-0",
                            sidebarWidthClasses[sidebarWidth]
                        )}
                    >
                        {sidebar}
                    </aside>
                )}

                {/* Main Content */}
                <main
                    className={cn(
                        "flex-1 overflow-y-auto",
                        paddingClasses[padding]
                    )}
                >
                    <div className={cn("mx-auto", maxWidthClasses[maxWidth])}>
                        {children}
                    </div>
                </main>

                {/* Sidebar Right */}
                {hasSidebar && sidebarPosition === "right" && (
                    <aside
                        className={cn(
                            "hidden lg:flex flex-col border-l border-border bg-bg-secondary shrink-0",
                            sidebarWidthClasses[sidebarWidth]
                        )}
                    >
                        {sidebar}
                    </aside>
                )}
            </div>

            {/* Footer */}
            {footer}
        </div>
    );
}
