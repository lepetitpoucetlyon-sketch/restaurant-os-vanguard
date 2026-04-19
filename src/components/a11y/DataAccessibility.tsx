"use client";

import { cn } from "@/lib/ui.foundations";;
import { ReactNode, useId } from "react";
import { ChevronUp, ChevronDown, ArrowUpDown } from "lucide-react";

interface AccessibleTableProps {
    caption?: string;
    captionHidden?: boolean;
    children: ReactNode;
    className?: string;
}

/**
 * Table accessible avec caption.
 */
export function AccessibleTable({
    caption,
    captionHidden = false,
    children,
    className,
}: AccessibleTableProps) {
    return (
        <div className="overflow-x-auto" role="region" aria-label={caption}>
            <table className={cn("w-full border-collapse", className)}>
                {caption && (
                    <caption className={cn(captionHidden && "sr-only", "text-left text-sm font-medium text-text-muted mb-2")}>
                        {caption}
                    </caption>
                )}
                {children}
            </table>
        </div>
    );
}

interface SortableHeaderProps {
    children: ReactNode;
    sorted?: "asc" | "desc" | false;
    onSort?: () => void;
    className?: string;
}

/**
 * En-tête de colonne triable accessible.
 */
export function SortableHeader({
    children,
    sorted = false,
    onSort,
    className,
}: SortableHeaderProps) {
    const ariaSort = sorted ? (sorted === "asc" ? "ascending" : "descending") : undefined;

    return (
        <th
            scope="col"
            aria-sort={ariaSort}
            className={cn(
                "text-left text-xs font-bold uppercase tracking-wider text-text-muted px-4 py-3 bg-bg-tertiary",
                onSort && "cursor-pointer hover:text-text-primary hover:bg-bg-secondary transition-colors",
                className
            )}
        >
            <button
                onClick={onSort}
                className="inline-flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
                aria-label={`Trier par ${children}, ${sorted === "asc" ? "croissant" : sorted === "desc" ? "décroissant" : "non trié"}`}
            >
                {children}
                {sorted === "asc" && <ChevronUp className="w-4 h-4" />}
                {sorted === "desc" && <ChevronDown className="w-4 h-4" />}
                {!sorted && onSort && <ArrowUpDown className="w-4 h-4 opacity-50" />}
            </button>
        </th>
    );
}

interface AccessibleListProps {
    items: ReactNode[];
    label: string;
    ordered?: boolean;
    className?: string;
}

/**
 * Liste accessible avec label.
 */
export function AccessibleList({
    items,
    label,
    ordered = false,
    className,
}: AccessibleListProps) {
    const id = useId();
    const Tag = ordered ? "ol" : "ul";

    return (
        <div>
            <span id={id} className="sr-only">
                {label}
            </span>
            <Tag aria-labelledby={id} className={cn("space-y-2", className)}>
                {items.map((item, index) => (
                    <li key={index}>{item}</li>
                ))}
            </Tag>
        </div>
    );
}

interface DescriptionListProps {
    items: { term: string; description: ReactNode }[];
    layout?: "horizontal" | "vertical";
    className?: string;
}

/**
 * Liste de définitions accessible.
 */
export function DescriptionList({
    items,
    layout = "vertical",
    className,
}: DescriptionListProps) {
    return (
        <dl
            className={cn(
                layout === "horizontal" && "grid grid-cols-2 gap-4",
                layout === "vertical" && "space-y-4",
                className
            )}
        >
            {items.map((item, index) => (
                <div key={index} className={layout === "horizontal" ? "" : "space-y-1"}>
                    <dt className="text-xs font-bold uppercase tracking-wider text-text-muted">
                        {item.term}
                    </dt>
                    <dd className="text-text-primary">{item.description}</dd>
                </div>
            ))}
        </dl>
    );
}
