"use client";

import { useMemo } from "react";
import { useSorting } from "./useSorting";
import { useFiltering } from "./useFiltering";
import { usePagination } from "./usePagination";

interface UseListOptions<T> {
    searchKeys?: (keyof T)[];
    initialSortKey?: keyof T;
    initialSortDirection?: "asc" | "desc";
    initialPageSize?: number;
}

/**
 * Hook combiné pour gérer une liste avec recherche, filtrage, tri et pagination.
 * 
 * @example
 * const {
 *   items,
 *   searchQuery,
 *   setSearchQuery,
 *   sortBy,
 *   page,
 *   nextPage,
 *   prevPage
 * } = useList(reservations, {
 *   searchKeys: ['name', 'email'],
 *   initialSortKey: 'date',
 *   initialPageSize: 10
 * });
 */
export function useList<T extends Record<string, unknown>>(
    data: T[],
    options: UseListOptions<T> = {}
) {
    const {
        searchKeys = [],
        initialSortKey,
        initialSortDirection = "asc",
        initialPageSize = 10,
    } = options;

    // Filtering
    const {
        searchQuery,
        setSearchQuery,
        activeFilters,
        setFilter,
        clearFilter,
        clearAllFilters,
        filteredItems,
        hasActiveFilters,
    } = useFiltering(data, { searchKeys });

    // Sorting
    const {
        sortKey,
        sortDirection,
        sortedItems,
        sortBy,
        resetSort,
        getSortIndicator,
    } = useSorting(filteredItems, {
        initialSortKey,
        initialDirection: initialSortDirection,
    });

    // Pagination
    const {
        page,
        pageSize,
        totalPages,
        hasNextPage,
        hasPrevPage,
        nextPage,
        prevPage,
        goToPage,
        setPageSize,
        paginateItems,
    } = usePagination({
        totalItems: sortedItems.length,
        initialPageSize,
    });

    // Final paginated items
    const items = useMemo(() => paginateItems(sortedItems), [paginateItems, sortedItems]);

    return {
        // Items
        items,
        totalItems: sortedItems.length,
        allItems: sortedItems,

        // Search
        searchQuery,
        setSearchQuery,

        // Filters
        activeFilters,
        setFilter,
        clearFilter,
        clearAllFilters,
        hasActiveFilters,

        // Sorting
        sortKey,
        sortDirection,
        sortBy,
        resetSort,
        getSortIndicator,

        // Pagination
        page,
        pageSize,
        totalPages,
        hasNextPage,
        hasPrevPage,
        nextPage,
        prevPage,
        goToPage,
        setPageSize,
    };
}
