"use client";

import { useState, useCallback, useMemo } from "react";
import { SovereignData } from "@shared/nexus-contract";

type SortDirection = "asc" | "desc";

interface UseSortingOptions<T> {
    initialSortKey?: keyof T;
    initialDirection?: SortDirection;
}

interface UseSortingReturn<T> {
    sortKey: keyof T | null;
    sortDirection: SortDirection;
    sortedItems: T[];
    sortBy: (key: keyof T) => void;
    resetSort: () => void;
    getSortIndicator: (key: keyof T) => "asc" | "desc" | null;
}

export function compareValues<T>(aVal: T[keyof T], bVal: T[keyof T], direction: SortDirection): number {
    if (aVal === bVal) return 0;
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;
    let cmp = 0;
    if (typeof aVal === "string" && typeof bVal === "string") {
        cmp = aVal.localeCompare(bVal, "fr");
    } else if (typeof aVal === "number" && typeof bVal === "number") {
        cmp = aVal - bVal;
    } else if (aVal instanceof Date && bVal instanceof Date) {
        cmp = aVal.getTime() - bVal.getTime();
    } else {
        cmp = String(aVal).localeCompare(String(bVal));
    }
    return direction === "asc" ? cmp : -cmp;
}

/**
 * Hook pour gérer le tri des listes.
 *
 * @example
 * const { sortedItems, sortBy, getSortIndicator } = useSorting(items, {
 *   initialSortKey: 'date',
 *   initialDirection: 'desc'
 * });
 */
export function useSorting<T extends SovereignData>(

    items: T[],
    options: UseSortingOptions<T> = {}
): UseSortingReturn<T> {
    const { initialSortKey = null, initialDirection = "asc" } = options;

    const [sortKey, setSortKey] = useState<keyof T | null>(initialSortKey);
    const [sortDirection, setSortDirection] = useState<SortDirection>(initialDirection);

    const sortBy = useCallback(
        (key: keyof T) => {
            if (sortKey === key) {
                setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
            } else {
                setSortKey(key);
                setSortDirection("asc");
            }
        },
        [sortKey]
    );

    const resetSort = useCallback(() => {
        setSortKey(initialSortKey);
        setSortDirection(initialDirection);
    }, [initialSortKey, initialDirection]);

    const getSortIndicator = useCallback(
        (key: keyof T): "asc" | "desc" | null => {
            if (sortKey === key) {
                return sortDirection;
            }
            return null;
        },
        [sortKey, sortDirection]
    );

    const sortedItems = useMemo(() => {
        if (!sortKey) return items;
        return [...items].sort((a, b) => compareValues(a[sortKey], b[sortKey], sortDirection));
    }, [items, sortKey, sortDirection]);

    return {
        sortKey,
        sortDirection,
        sortedItems,
        sortBy,
        resetSort,
        getSortIndicator,
    };
}
