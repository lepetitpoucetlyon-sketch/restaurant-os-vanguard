"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface VirtualizedListOptions {
    itemHeight: number;
    overscan?: number;
    containerHeight?: number;
}

interface VirtualizedItem<T> {
    data: T;
    index: number;
    style: React.CSSProperties;
}

/**
 * Hook pour virtualiser de longues listes.
 * Rend uniquement les éléments visibles pour améliorer les performances.
 * 
 * @example
 * const { containerRef, virtualItems, totalHeight } = useVirtualizedList(items, {
 *   itemHeight: 60,
 *   overscan: 3
 * });
 * 
 * <div ref={containerRef} style={{ height: 400, overflow: 'auto' }}>
 *   <div style={{ height: totalHeight, position: 'relative' }}>
 *     {virtualItems.map(({ data, index, style }) => (
 *       <div key={index} style={style}>{data.name}</div>
 *     ))}
 *   </div>
 * </div>
 */
export function useVirtualizedList<T>(
    items: T[],
    options: VirtualizedListOptions
): {
    containerRef: React.RefObject<HTMLDivElement | null>;
    virtualItems: VirtualizedItem<T>[];
    totalHeight: number;
    scrollToIndex: (index: number) => void;
} {
    const { itemHeight, overscan = 3 } = options;

    const containerRef = useRef<HTMLDivElement>(null);
    const [scrollTop, setScrollTop] = useState(0);
    const [containerHeight, setContainerHeight] = useState(options.containerHeight || 0);

    // Calcul de la hauteur totale
    const totalHeight = items.length * itemHeight;

    // Calcul des indices visibles
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
        items.length - 1,
        Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    // Création des éléments virtuels
    const virtualItems: VirtualizedItem<T>[] = [];
    for (let i = startIndex; i <= endIndex; i++) {
        virtualItems.push({
            data: items[i],
            index: i,
            style: {
                position: "absolute",
                top: i * itemHeight,
                left: 0,
                right: 0,
                height: itemHeight,
            },
        });
    }

    // Gestion du scroll
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleScroll = () => {
            setScrollTop(container.scrollTop);
        };

        const handleResize = () => {
            setContainerHeight(container.clientHeight);
        };

        // Initial setup
        handleResize();

        container.addEventListener("scroll", handleScroll, { passive: true });
        window.addEventListener("resize", handleResize);

        return () => {
            container.removeEventListener("scroll", handleScroll);
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    const scrollToIndex = useCallback(
        (index: number) => {
            const container = containerRef.current;
            if (!container) return;

            const targetTop = index * itemHeight;
            container.scrollTo({ top: targetTop, behavior: "smooth" });
        },
        [itemHeight]
    );

    return {
        containerRef,
        virtualItems,
        totalHeight,
        scrollToIndex,
    };
}

interface UseInfiniteScrollOptions {
    hasMore: boolean;
    loading: boolean;
    onLoadMore: () => void;
    threshold?: number;
}

/**
 * Hook pour le scroll infini.
 * 
 * @example
 * const { sentinelRef } = useInfiniteScroll({
 *   hasMore: data.hasNextPage,
 *   loading: isLoading,
 *   onLoadMore: () => fetchNextPage(),
 * });
 * 
 * <div>
 *   {items.map(...)}
 *   <div ref={sentinelRef} />
 * </div>
 */
export function useInfiniteScroll(options: UseInfiniteScrollOptions): {
    sentinelRef: React.RefCallback<HTMLDivElement>;
} {
    const { hasMore, loading, onLoadMore, threshold = 100 } = options;

    const observerRef = useRef<IntersectionObserver | null>(null);

    const sentinelRef = useCallback(
        (node: HTMLDivElement | null) => {
            if (loading) return;

            if (observerRef.current) {
                observerRef.current.disconnect();
            }

            if (!node || !hasMore) return;

            observerRef.current = new IntersectionObserver(
                (entries) => {
                    if (entries[0].isIntersecting && hasMore && !loading) {
                        onLoadMore();
                    }
                },
                { rootMargin: `${threshold}px` }
            );

            observerRef.current.observe(node);
        },
        [hasMore, loading, onLoadMore, threshold]
    );

    return { sentinelRef };
}
