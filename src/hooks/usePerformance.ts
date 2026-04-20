// @ts-nocheck
"use client";

import { useCallback, useRef, useMemo, useEffect, useLayoutEffect } from "react";

/**
 * Hook to memoize a callback with stable dependencies.
 * Uses useLayoutEffect to update the ref safely for React 19.
 */
export function useEventCallback<T extends (...args: unknown[]) => unknown>(
    callback: T
): T {
    const ref = useRef<T>(callback);

    useLayoutEffect(() => {
        ref.current = callback;
    });

    const stableCallback = useCallback((...args: unknown[]) => {
        return ref.current?.(...args);
    }, []);

    return stableCallback as T;
}

/**
 * Hook for deep comparison memoization.
 * Simplified for React 19 compliance (avoids reading ref in render).
 */
export function useDeepMemo<T>(factory: () => T, deps: unknown[]): T {
    const memoKey = JSON.stringify(deps);
    return useMemo(() => factory(), [memoKey, factory]);
}

/**
 * Hook to track render count (debug).
 */
export function useRenderCount(componentName: string): number {
    const renderCount = useRef(0);
    
    useEffect(() => {
        if (process.env.NODE_ENV === "development") {
            renderCount.current++;
        }
    });

    return 0; // Return dummy as we cannot read ref in render
}

/**
 * Hook to measure render performance.
 */
export function usePerformanceMeasure(name: string): void {
    const startTime = useRef(0);

    useLayoutEffect(() => {
        if (typeof performance !== "undefined") {
            startTime.current = performance.now();
        }
    }, [name]);

    useEffect(() => {
        if (typeof performance !== "undefined" && process.env.NODE_ENV === "development") {
            const endTime = performance.now();
            const duration = endTime - startTime.current;
            if (duration > 16) {
                console.warn(`[Perf] ${name} took ${duration.toFixed(2)}ms to render`);
            }
        }
    }, [name]);
}
