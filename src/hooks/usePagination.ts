"use client";

import { useState, useCallback, useMemo } from "react";

interface UsePaginationOptions {
    initialPage?: number;
    initialPageSize?: number;
    totalItems: number;
}

interface UsePaginationReturn {
    page: number;
    pageSize: number;
    totalPages: number;
    startIndex: number;
    endIndex: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    nextPage: () => void;
    prevPage: () => void;
    goToPage: (page: number) => void;
    setPageSize: (size: number) => void;
    paginateItems: <T>(items: T[]) => T[];
}

/**
 * Hook pour gérer la pagination.
 * 
 * @example
 * const { page, paginateItems, nextPage, prevPage } = usePagination({
 *   totalItems: items.length,
 *   initialPageSize: 10
 * });
 * 
 * const paginatedItems = paginateItems(items);
 */
export function usePagination({
    initialPage = 1,
    initialPageSize = 10,
    totalItems,
}: UsePaginationOptions): UsePaginationReturn {
    const [page, setPage] = useState(initialPage);
    const [pageSize, setPageSizeState] = useState(initialPageSize);

    const totalPages = useMemo(
        () => Math.ceil(totalItems / pageSize) || 1,
        [totalItems, pageSize]
    );

    const startIndex = useMemo(() => (page - 1) * pageSize, [page, pageSize]);
    const endIndex = useMemo(
        () => Math.min(startIndex + pageSize, totalItems),
        [startIndex, pageSize, totalItems]
    );

    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const nextPage = useCallback(() => {
        setPage((p) => Math.min(p + 1, totalPages));
    }, [totalPages]);

    const prevPage = useCallback(() => {
        setPage((p) => Math.max(p - 1, 1));
    }, []);

    const goToPage = useCallback(
        (newPage: number) => {
            setPage(Math.max(1, Math.min(newPage, totalPages)));
        },
        [totalPages]
    );

    const setPageSize = useCallback((size: number) => {
        setPageSizeState(size);
        setPage(1); // Reset to first page when page size changes
    }, []);

    const paginateItems = useCallback(
        <T>(items: T[]): T[] => {
            return items.slice(startIndex, endIndex);
        },
        [startIndex, endIndex]
    );

    return {
        page,
        pageSize,
        totalPages,
        startIndex,
        endIndex,
        hasNextPage,
        hasPrevPage,
        nextPage,
        prevPage,
        goToPage,
        setPageSize,
        paginateItems,
    };
}
