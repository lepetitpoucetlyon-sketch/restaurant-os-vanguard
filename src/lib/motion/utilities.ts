// @ts-nocheck
"use client";

import { Variants } from "framer-motion";

/**
 * getReducedMotionVariants
 * Wraps variants to respect user's reduced motion preferences.
 */
export const getReducedMotionVariants = (variants: Variants): Variants => {
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return {
            hidden: { opacity: 0 },
            visible: { opacity: 1 },
            exit: { opacity: 0 }
        };
    }
    return variants;
};
