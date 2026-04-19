"use client";

import { useState, useCallback, useMemo } from "react";

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

/**
 * Hook pour gérer le tri des listes.
 * 
 * @example
 * const { sortedItems, sortBy, getSortIndicator } = useSorting(items, {
 *   initialSortKey: 'date',
 *   initialDirection: 'desc'
 * });
 */
export function useSorting<T extends Record<string, unknown>>(
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

        return [...items].sort((a, b) => {
            const aValue = a[sortKey];
            const bValue = b[sortKey];

            if (aValue === bValue) return 0;
            if (aValue === null || aValue === undefined) return 1;
            if (bValue === null || bValue === undefined) return -1;

            let comparison = 0;
            if (typeof aValue === "string" && typeof bValue === "string") {
                comparison = aValue.localeCompare(bValue, "fr");
            } else if (typeof aValue === "number" && typeof bValue === "number") {
                comparison = aValue - bValue;
            } else if (aValue instanceof Date && bValue instanceof Date) {
                comparison = aValue.getTime() - bValue.getTime();
            } else {
                comparison = String(aValue).localeCompare(String(bValue));
            }

            return sortDirection === "asc" ? comparison : -comparison;
        });
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
