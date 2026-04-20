"use client";

import { useMediaQuery, BREAKPOINTS } from "./useMediaQuery";

/**
 * Simplified hook to detect mobile viewport.
 * @returns true if viewport is < 768px
 */
export function useIsMobile(): boolean {
    return useMediaQuery(`(max-width: ${BREAKPOINTS.md - 1}px)`);
}

/**
 * Simplified hook to detect tablet viewport.
 * @returns true if viewport is 768px - 1023px
 */
export function useIsTablet(): boolean {
    return useMediaQuery(`(min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`);
}

/**
 * Simplified hook to detect desktop viewport.
 * @returns true if viewport is >= 1024px
 */
export function useIsDesktop(): boolean {
    return useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px)`);
}
