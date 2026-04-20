// @ts-nocheck
"use client";

import { useSyncExternalStore } from "react";

export function useMediaQuery(query: string): boolean {
    const subscribe = (onStoreChange: () => void) => {
        if (typeof window === "undefined") return () => {};
        const mediaQuery = window.matchMedia(query);
        mediaQuery.addEventListener("change", onStoreChange);
        return () => mediaQuery.removeEventListener("change", onStoreChange);
    };

    const getSnapshot = () => {
        if (typeof window === "undefined") return false;
        return window.matchMedia(query).matches;
    };

    const getServerSnapshot = () => false;

    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// Breakpoint constants matching Tailwind defaults
export const BREAKPOINTS = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    "2xl": 1536,
} as const;

/**
 * Hook providing responsive breakpoint booleans.
 */
export function useResponsive() {
    const isMobile = useMediaQuery(`(max-width: ${BREAKPOINTS.md - 1}px)`);
    const isTablet = useMediaQuery(`(min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`);
    const isDesktop = useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px)`);

    return { isMobile, isTablet, isDesktop };
}
