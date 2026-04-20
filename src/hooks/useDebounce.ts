"use client";

import { useState, useCallback, useEffect, useRef } from "react";

interface UseDebounceOptions {
    delay?: number;
    leading?: boolean;
}

/**
 * Hook pour débouncer une valeur.
 * 
 * @example
 * const debouncedValue = useDebounce(searchQuery, 300);
 * 
 * useEffect(() => {
 *   search(debouncedValue);
 * }, [debouncedValue]);
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(timer);
        };
    }, [value, delay]);

    return debouncedValue;
}

/**
 * Hook pour créer une fonction debouncée.
 * 
 * @example
 * const debouncedSearch = useDebouncedCallback(
 *   (query: string) => searchAPI(query),
 *   300
 * );
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
    callback: T,
    delay: number = 300,
    options: UseDebounceOptions = {}
): (...args: Parameters<T>) => void {
    const { leading = false } = options;
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isLeadingRef = useRef(true);

    const debouncedFn = useCallback(
        (...args: Parameters<T>) => {
            // Leading edge call
            if (leading && isLeadingRef.current) {
                callback(...args);
                isLeadingRef.current = false;
            }

            // Clear existing timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            // Set new timeout
            timeoutRef.current = setTimeout(() => {
                if (!leading) {
                    callback(...args);
                }
                isLeadingRef.current = true;
            }, delay);
        },
        [callback, delay, leading]
    );

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return debouncedFn;
}
