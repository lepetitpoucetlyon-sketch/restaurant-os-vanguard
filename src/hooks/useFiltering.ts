"use client";

import { useState, useCallback, useMemo, useEffect } from "react";

interface UseFilteringOptions<T> {
    searchKeys?: (keyof T)[];
    debounceMs?: number;
}

interface UseFilteringReturn<T> {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    activeFilters: Record<string, string | string[]>;
    setFilter: (key: string, value: string | string[]) => void;
    clearFilter: (key: string) => void;
    clearAllFilters: () => void;
    filteredItems: T[];
    hasActiveFilters: boolean;
}

/**
 * Hook pour gérer le filtrage et la recherche dans des listes.
 * 
 * @example
 * const { searchQuery, setSearchQuery, filteredItems, setFilter } = useFiltering(items, {
 *   searchKeys: ['name', 'email']
 * });
 */
export function useFiltering<T extends Record<string, unknown>>(
    items: T[],
    options: UseFilteringOptions<T> = {}
): UseFilteringReturn<T> {
    const { searchKeys = [], debounceMs = 300 } = options;

    const [searchQuery, setSearchQueryState] = useState("");
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [activeFilters, setActiveFilters] = useState<Record<string, string | string[]>>({});

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, debounceMs);

        return () => clearTimeout(timer);
    }, [searchQuery, debounceMs]);

    const setSearchQuery = useCallback((query: string) => {
        setSearchQueryState(query);
    }, []);

    const setFilter = useCallback((key: string, value: string | string[]) => {
        setActiveFilters((prev) => ({
            ...prev,
            [key]: value,
        }));
    }, []);

    const clearFilter = useCallback((key: string) => {
        setActiveFilters((prev) => {
            const next = { ...prev };
            delete next[key];
            return next;
        });
    }, []);

    const clearAllFilters = useCallback(() => {
        setActiveFilters({});
        setSearchQueryState("");
    }, []);

    const hasActiveFilters = useMemo(() => {
        return (
            debouncedQuery.length > 0 ||
            Object.values(activeFilters).some((v) =>
                Array.isArray(v) ? v.length > 0 : !!v
            )
        );
    }, [debouncedQuery, activeFilters]);

    const filteredItems = useMemo(() => {
        let result = [...items];

        // Apply search filter
        if (debouncedQuery && searchKeys.length > 0) {
            const query = debouncedQuery.toLowerCase();
            result = result.filter((item) =>
                searchKeys.some((key) => {
                    const value = item[key];
                    if (value == null) return false;
                    return String(value).toLowerCase().includes(query);
                })
            );
        }

        // Apply property filters
        Object.entries(activeFilters).forEach(([key, filterValue]) => {
            if (!filterValue || (Array.isArray(filterValue) && filterValue.length === 0)) {
                return;
            }

            result = result.filter((item) => {
                const itemValue = item[key as keyof T];
                if (Array.isArray(filterValue)) {
                    return filterValue.includes(String(itemValue));
                }
                return String(itemValue) === filterValue;
            });
        });

        return result;
    }, [items, debouncedQuery, searchKeys, activeFilters]);

    return {
        searchQuery,
        setSearchQuery,
        activeFilters,
        setFilter,
        clearFilter,
        clearAllFilters,
        filteredItems,
        hasActiveFilters,
    };
}
