// @ts-nocheck
"use client";

import { cn } from "@/lib/ui.foundations";;
import { ReactNode } from "react";

interface GridLayoutProps {
    children: ReactNode;
    columns?: {
        default: 1 | 2 | 3 | 4 | 6;
        sm?: 1 | 2 | 3 | 4 | 6;
        md?: 1 | 2 | 3 | 4 | 6;
        lg?: 1 | 2 | 3 | 4 | 6;
        xl?: 1 | 2 | 3 | 4 | 5 | 6;
        "2xl"?: 1 | 2 | 3 | 4 | 5 | 6;
    };
    gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
    rowGap?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
    colGap?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
    autoRows?: "min" | "max" | "fr" | "auto";
    className?: string;
}

const columnMap: Record<number, string> = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
    6: "grid-cols-6",
};

const gapMap = {
    none: "gap-0",
    xs: "gap-1",
    sm: "gap-2",
    md: "gap-4",
    lg: "gap-6",
    xl: "gap-8",
};

const rowGapMap = {
    none: "row-gap-0",
    xs: "row-gap-1",
    sm: "row-gap-2",
    md: "row-gap-4",
    lg: "row-gap-6",
    xl: "row-gap-8",
};

const colGapMap = {
    none: "col-gap-0",
    xs: "col-gap-1",
    sm: "col-gap-2",
    md: "col-gap-4",
    lg: "col-gap-6",
    xl: "col-gap-8",
};

const autoRowsMap = {
    min: "auto-rows-min",
    max: "auto-rows-max",
    fr: "auto-rows-fr",
    auto: "auto-rows-auto",
};

export function GridLayout({
    children,
    columns = { default: 1 },
    gap = "md",
    rowGap,
    colGap,
    autoRows = "auto",
    className,
}: GridLayoutProps) {
    const colClasses = [
        columnMap[columns.default],
        columns.sm && `sm:${columnMap[columns.sm]}`,
        columns.md && `md:${columnMap[columns.md]}`,
        columns.lg && `lg:${columnMap[columns.lg]}`,
        columns.xl && `xl:${columnMap[columns.xl]}`,
        columns["2xl"] && `2xl:${columnMap[columns["2xl"]]}`,
    ].filter(Boolean);

    return (
        <div
            className={cn(
                "grid",
                ...colClasses,
                !rowGap && !colGap && gapMap[gap],
                rowGap && rowGapMap[rowGap],
                colGap && colGapMap[colGap],
                autoRowsMap[autoRows],
                className
            )}
        >
            {children}
        </div>
    );
}

interface GridItemProps {
    children: ReactNode;
    colSpan?: 1 | 2 | 3 | 4 | 5 | 6 | "full";
    rowSpan?: 1 | 2 | 3 | 4 | 5 | 6;
    className?: string;
}

const colSpanMap: Record<string | number, string> = {
    1: "col-span-1",
    2: "col-span-2",
    3: "col-span-3",
    4: "col-span-4",
    5: "col-span-5",
    6: "col-span-6",
    full: "col-span-full",
};

const rowSpanMap: Record<number, string> = {
    1: "row-span-1",
    2: "row-span-2",
    3: "row-span-3",
    4: "row-span-4",
    5: "row-span-5",
    6: "row-span-6",
};

export function GridItem({
    children,
    colSpan = 1,
    rowSpan = 1,
    className,
}: GridItemProps) {
    return (
        <div
            className={cn(
                colSpanMap[colSpan],
                rowSpanMap[rowSpan],
                className
            )}
        >
            {children}
        </div>
    );
}
